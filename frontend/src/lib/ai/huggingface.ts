/**
 * Aura Hugging Face AI Service
 * Connects to open-source models for various AI tasks.
 */

const HF_TOKEN = process.env.NEXT_PUBLIC_HF_TOKEN;

async function queryHF(model: string, data: any) {
  try {
    const response = await fetch(
      `https://router.huggingface.co/hf-inference/models/${model}`,
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
        const errText = await response.text();
        console.error(`HF API Error (${response.status}):`, errText);
        return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Hugging Face Query Error:", error);
    return null;
  }
}

/**
 * Aura AI Master Models
 * Mistral 7B: Best for general chat and instructions
 * BART Large: Industry standard for summarization
 * DistilBERT: High-speed sentiment analysis
 */
export const MODELS = {
    ASSISTANT: "mistralai/Mistral-7B-Instruct-v0.2",
    SUMMARIZE: "facebook/bart-large-cnn",
    SENTIMENT: "distilbert-base-uncased-finetuned-sst-2-english",
    TRANSLATE: "Helsinki-NLP/opus-mt-en-es"
};

/**
 * Super-Assistant: General chat and logic
 */
export async function auraAssistant(prompt: string) {
    const result = await queryHF(MODELS.ASSISTANT, { 
        inputs: prompt,
        parameters: { max_new_tokens: 250, temperature: 0.7 }
    });
    return result?.[0]?.generated_text || null;
}

/**
 * Master Summarizer: Professional chat summaries
 */
export async function auraSummarize(text: string) {
    const result = await queryHF(MODELS.SUMMARIZE, { inputs: text });
    return result?.[0]?.summary_text || null;
}

/**
 * Smart Suggestions: Generates 3 quick replies
 */
export async function auraSuggest(context: string) {
    const prompt = `[INST] Based on this chat: "${context}", generate 3 short, professional chat replies. Return only the replies separated by | [/INST]`;
    const result = await auraAssistant(prompt);
    if (result) {
        // Clean and split results
        const text = result.split('[/INST]').pop() || "";
        return text.split('|').map((s: string) => s.trim()).filter((s: string) => s.length > 0).slice(0, 3);
    }
    return [];
}

/**
 * Detects the "Vibe" or sentiment of a message.
 */
export async function detectMessageVibe(text: string) {
  if (!text || text.length < 3) return null;

  const result = await queryHF(MODELS.SENTIMENT, { inputs: text });

  if (result && Array.isArray(result) && result[0]) {
    return result[0] as { label: string; score: number }[];
  }
  return null;
}
