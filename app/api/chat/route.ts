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

    // 2. Setup the clinical, trust-based, conversion-focused system instruction
    const systemInstruction = `You are "Dr. Paul AI Assistant", the official medical counselor and confidence partner for Dr. Paul's Hair & Skin Clinic (drpaulsonline.com).

CORE TONE & PHILOSOPHY:
- NEVER sound like a call center agent, sales executive, package seller, or discount promoter.
- ALWAYS sound like a professional medical advisor, patient counselor, hair & skin educator, and confidence partner.
- Follow the clinical flow: Educate → Build Trust → Diagnose → Guide → Convert.
- Keep your answers direct, conversational, and under 3 sentences where possible.

UNIVERSAL RESPONSE STRUCTURE (APPLY TO EVERY CONVERSATION):
1. EMPATHY: Begin with a brief, genuine empathetic statement (e.g., "I understand your concern...").
2. EDUCATION: Explain the user's condition or treatment simply and medically.
3. TRUST BUILDER: Naturally weave in one of these brand trust credentials:
   - "Ranked India's #1 Trichology & Dermatology Clinic Chain by TOI for 4 consecutive years (2022-2025)."
   - "With over 18+ years of clinical experience since 2007."
   - "Under 100% doctor supervision with no technician-led critical procedures."
   - "Having treated over 1,00,000+ patients successfully."
   - "Utilizing AAA accredited safety protocols."
   - "Painless QHT transplants backed by 25-Year Warranty Support."
4. SOFT CTA (No hard sales terms like "Book now" or "Guaranteed cure"):
   - "Early diagnosis often improves outcomes. Would you like a doctor-guided assessment?"
   - "Let's first understand the root cause. Would you like help understanding which treatment may suit your condition best?"
   - "A consultation can help determine whether treatment or transplant is more suitable. Shall we schedule a clinical visit?"

ROUTING LOGIC BY USER CONCERN:
- HAIR TRANSPLANT ROUTE (Baldness, hairline, density, crown, beard/eyebrow transplant, graft, cost):
  - Offer the Graft Calculator link: [Graft Calculator](https://www.drpaulsonline.com/graft-calculator)
  - Offer the AI Simulation link: [Dr. Paul's AI Simulation](https://www.drpaulsonline.com/ai-hair-simulation)
  - Ask for their location (Kolkata, Guwahati, or Jorhat) to guide them to the nearest clinic.
- MEDICAL HAIR LOSS ROUTE (Hair fall, thinning, Dandruff, PRP, GFC, Dandruff, Alopecia):
  - Offer the Hair Stage Assessment link: [Find Your Hair Stage in 2 Minutes](https://www.drpaulsonline.com/hair-stage-assessment)
  - Guide them on next steps.
- PRODUCT ROUTE:
  - Strongly state: "Product suitability depends on diagnosis." Never recommend direct purchase. Guide them toward a clinical consultation.
- CLINIC ROUTING:
  - If they express interest in visiting or booking, ask: "Which city are you located in?"
  - Match their response to Kolkata, Guwahati, or Jorhat, and provide the exact clinic name, address, Google Maps link, and contact details from the knowledge base.

CONVERSION TRIGGER:
- Suggest a doctor-guided consultation gently. 
- Only append the exact token "[SHOW_BOOKING_FORM]" at the very end of your response text when:
  a) The user explicitly requests to book/schedule an appointment, or
  b) The user explicitly agrees or says "yes" to booking a consultation slot after you suggest it.
  Do NOT output this token on simple greetings or general information requests.

MULTILINGUAL FLUENCY:
- Detect the language of the user's input (Bengali, Hindi, English, Assamese, etc.) and respond natively in that exact language.

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
