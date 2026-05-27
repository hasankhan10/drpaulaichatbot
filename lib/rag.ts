import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// 1. Interfaces
interface CacheEntry {
  content: string;
  embedding: number[];
}

interface VectorCache {
  fileHash: string;
  entries: CacheEntry[];
  useKeywordFallback?: boolean;
}

const apiKey = process.env.GEMINI_API_KEY;

// 2. MD5 hashing helper to track data.md modifications
function getMd5Hash(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex');
}

// 3. Document Chunking helper
// Splits data.md by sections while retaining the title header inside the chunk text for semantic keyword relevance.
function chunkMarkdown(text: string): string[] {
  // Split using lookahead to retain markdown headers (## or ###)
  const sections = text.split(/(?=\n(?:##|###) )/g);
  return sections
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// 4. Mathematical Cosine Similarity calculation
function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 5. Option 2: Fallback Fuzzy Keyword Relevance Matcher
// If the Google Embedding API fails or encounters quota/limit errors, the system triggers this local scanner.
function keywordFallback(query: string, chunks: string[]): string[] {
  // Tokenize query words
  const queryWords = query
    .toLowerCase()
    .split(/[\s,.\-?]+/g)
    .filter((w) => w.length > 2); // Only consider words longer than 2 characters
  
  if (queryWords.length === 0) {
    return chunks.slice(0, 3); // Fallback to first 3 chunks if query is empty/unparsable
  }

  const scoredChunks = chunks.map((chunk) => {
    const chunkText = chunk.toLowerCase();
    let score = 0;
    queryWords.forEach((word) => {
      if (chunkText.includes(word)) {
        score += 1;
      }
    });
    return { chunk, score };
  });

  // Sort by score descending
  scoredChunks.sort((a, b) => b.score - a.score);

  // Take the top 3 matching chunks
  const matches = scoredChunks
    .filter((item) => item.score > 0)
    .map((item) => item.chunk)
    .slice(0, 3);

  // If no matches found, return first 3 chunks as absolute fallback
  return matches.length > 0 ? matches : chunks.slice(0, 3);
}

// 6. Core RAG Context Retrieval Function
// Reads data.md, synchronizes embedding cache dynamically, and returns the top 3 most relevant segments.
export async function retrieveContext(query: string): Promise<string> {
  try {
    const dataFilePath = path.join(process.cwd(), 'data.md');
    const cacheFilePath = path.join(process.cwd(), 'embeddings-cache.json');

    // 1. Read data.md
    if (!fs.existsSync(dataFilePath)) {
      console.warn('data.md knowledge base not found.');
      return '';
    }
    const dataContent = fs.readFileSync(dataFilePath, 'utf8');
    if (!dataContent.trim()) return '';

    const currentHash = getMd5Hash(dataContent);
    const chunks = chunkMarkdown(dataContent);
    let cache: VectorCache | null = null;
    let cacheIsInvalid = true;

    // 2. Try reading cached vectors
    if (fs.existsSync(cacheFilePath)) {
      try {
        const cacheContent = fs.readFileSync(cacheFilePath, 'utf8');
        cache = JSON.parse(cacheContent);
        if (cache && cache.fileHash === currentHash) {
          cacheIsInvalid = false;
          // If a previous embedding generation failed, immediately use the fast local keyword matcher
          if (cache.useKeywordFallback) {
            return keywordFallback(query, chunks).join('\n\n---\n\n');
          }
        }
      } catch (err) {
        console.error('Error reading vector cache, re-generating...', err);
      }
    }

    // 3. Option 3: Auto-Update Vector Embeddings Cache if data.md has changed
    if (cacheIsInvalid || !cache) {
      console.log('data.md has been modified. Re-generating embedding vectors...');
      
      if (!apiKey) {
        console.warn('GEMINI_API_KEY missing, using fuzzy keyword backup...');
        return keywordFallback(query, chunks).join('\n\n---\n\n');
      }

      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' }, { apiVersion: 'v1' });

        // Generate embeddings for all paragraphs in parallel
        const entries = await Promise.all(
          chunks.map(async (chunk) => {
            const result = await embeddingModel.embedContent(chunk);
            return {
              content: chunk,
              embedding: result.embedding.values,
            };
          })
        );

        cache = {
          fileHash: currentHash,
          entries: entries,
        };

        // Save embeddings to local file
        fs.writeFileSync(cacheFilePath, JSON.stringify(cache, null, 2), 'utf8');
        console.log('Successfully generated local RAG vector cache.');
      } catch (err) {
        console.warn('Gemini embedding API is not supported by your API key. Falling back to local keyword search cache.');
        
        // Write a fallback cache to prevent trying this slow API call on subsequent requests
        cache = {
          fileHash: currentHash,
          entries: [],
          useKeywordFallback: true
        };
        try {
          fs.writeFileSync(cacheFilePath, JSON.stringify(cache, null, 2), 'utf8');
        } catch (writeErr) {
          console.error('Failed to save fallback cache:', writeErr);
        }
        
        return keywordFallback(query, chunks).join('\n\n---\n\n');
      }
    }

    // 4. Perform Search
    if (!apiKey) {
      return keywordFallback(query, chunks).join('\n\n---\n\n');
    }

    try {
      // Generate embedding vector for the user query
      const genAI = new GoogleGenerativeAI(apiKey);
      const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' }, { apiVersion: 'v1' });
      const queryResult = await embeddingModel.embedContent(query);
      const queryEmbedding = queryResult.embedding.values;

      // Compute Cosine Similarity locally for all entries
      const scoredEntries = cache.entries.map((entry) => {
        const score = calculateCosineSimilarity(queryEmbedding, entry.embedding);
        return { content: entry.content, score };
      });

      // Sort by similarity descending
      scoredEntries.sort((a, b) => b.score - a.score);

      // Extract the top 3 most relevant segments
      const relevantChunks = scoredEntries.slice(0, 3).map((e) => e.content);
      
      console.log(`RAG match completed: retrieved ${relevantChunks.length} chunks.`);
      return relevantChunks.join('\n\n---\n\n');
    } catch (err) {
      console.error('Gemini embedding query failed, fallback to keyword relevance...', err);
      return keywordFallback(query, chunks).join('\n\n---\n\n');
    }
  } catch (err) {
    console.error('Critical RAG Failure:', err);
    return '';
  }
}
