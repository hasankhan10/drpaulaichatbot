import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { retrieveContext } from '@/lib/rag';

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured. Please add it to your .env.local file.' },
        { status: 500 }
      );
    }

    // Last message is the current user query
    const userMessage = messages[messages.length - 1]?.content || '';

    // 1. Retrieve ONLY the semantically relevant chunks of the knowledge base dynamically (Local RAG)
    let relevantContext = '';
    try {
      relevantContext = await retrieveContext(userMessage);
    } catch (err) {
      console.error('Error retrieving semantic context, fallback to basic branding info:', err);
      relevantContext = 'Dr. Paul\'s Hair & Skin Clinic is a world-class painless hair transplant and advanced skin aesthetics clinic based in Kolkata, Guwahati, and Jorhat, India.';
    }

    // 2. Setup the highly token-efficient, conversion-focused system instruction
    const systemInstruction = `You are "Dr. Paul AI Assistant", the official expert clinic chatbot for Dr. Paul's Hair & Skin Clinic (drpaulsonline.com).

YOUR QUADRUPLE CORE INSTRUCTIONS:
1. TOKEN EFFICIENCY: Be extremely direct and highly concise. Never output long paragraphs or bloated explanations. Keep your main textual response under 2 sentences max.
2. CONVERT TO APPOINTMENT: Be highly conversational and natural. Do NOT show the booking form immediately on simple greetings (like "hi", "hello") or general initial queries. Instead, only append the exact token "[SHOW_BOOKING_FORM]" at the very end of your response text when:
   a) The user explicitly requests to book/schedule an appointment, or
   b) The user explicitly agrees or says "yes" to booking a consultation slot after you suggest it.
   For general questions, answer them accurately and politely suggest an appointment, but do NOT output the "[SHOW_BOOKING_FORM]" token until they agree or ask to book!
3. KEEP ENGAGED: Always end your response with a short, relevant question or booking prompt to continue the conversation.
4. MULTILINGUAL FLUENCY: Automatically detect the language of the user's input (such as Bengali, Hindi, English, Assamese, etc.) and respond natively and fluently in that exact same language. The facts and clinic details from the knowledge base must remain 100% accurate.

CLINICAL KNOWLEDGE BASE (RELEVANT SEGMENTS ONLY):
---
${relevantContext || 'Dr. Paul\'s Hair & Skin Clinic is a world-class painless hair transplant and advanced skin aesthetics clinic based in Kolkata, Guwahati, and Jorhat, India.'}
---`;

    // 3. Format the chat history for Gemini API with capped message limit (saves input tokens!)
    const genAI = new GoogleGenerativeAI(apiKey);

    // Format previous messages for Gemini history, strictly filtering out empty/whitespace content (like inline booking forms)
    const allHistory = messages
      .slice(0, -1)
      .filter((msg: { content: string }) => msg.content && msg.content.trim())
      .map((msg: { role: string; content: string }) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

    // Gemini API constraint: The history array MUST start with a 'user' role message.
    // We slice the history to start exactly at the first message sent by the user, ignoring the initial welcome greeting.
    const firstUserIndex = allHistory.findIndex((msg) => msg.role === 'user');
    const history = firstUserIndex !== -1 ? allHistory.slice(firstUserIndex) : [];

    // 4. Robust Auto-Retry & Fallback execution over a sequence of models to guarantee zero downtime
    const modelCandidates = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.5-pro', 'gemini-1.5-pro'];
    let responseText = '';
    let success = false;
    let attempts = 0;

    for (const modelName of modelCandidates) {
      if (success) break;
      attempts++;
      try {
        console.log(`Attempting chat generation using model: ${modelName} (Attempt ${attempts}/${modelCandidates.length})`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemInstruction,
          generationConfig: {
            maxOutputTokens: 250,
            temperature: 0.7,
          }
        });

        const chat = model.startChat({
          history: history,
        });

        const result = await chat.sendMessage(userMessage);
        responseText = result.response.text();
        
        // Guard: Verify that the model returned a valid, non-empty response
        if (responseText && responseText.trim()) {
          success = true;
          console.log(`Successfully generated response using model: ${modelName}`);
        } else {
          console.warn(`Model ${modelName} returned an empty response. Moving to next candidate.`);
        }
      } catch (err: any) {
        console.error(`Model ${modelName} failed on attempt ${attempts} with error:`, err);
        
        // Wait briefly (500ms) before trying the next fallback candidate to let the network settle
        if (attempts < modelCandidates.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }

    if (!success) {
      throw new Error('All Gemini model candidates (2.5-flash, 1.5-flash, 2.5-pro, 1.5-pro) failed or are currently unavailable.');
    }

    return NextResponse.json({
      message: responseText,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'An error occurred during chat.';
    console.error('Chat API Error:', err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
