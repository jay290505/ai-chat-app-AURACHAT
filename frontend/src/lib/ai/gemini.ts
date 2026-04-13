"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { tavily } from "@tavily/core";

const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const groqApiKey = process.env.GROQ_API_KEY;
const tavilyApiKey = process.env.TAVILY_API_KEY;

const GROQ_MODEL = "llama-3.1-8b-instant";
const MODEL_NAME = "gemini-flash-latest";
const FALLBACK_MODEL = "gemini-pro-latest";

function getGeminiClient() {
    if (!geminiApiKey) {
        throw new Error("Missing NEXT_PUBLIC_GEMINI_API_KEY");
    }
    return new GoogleGenerativeAI(geminiApiKey);
}

function getGroqClient() {
    if (!groqApiKey) {
        throw new Error("Missing GROQ_API_KEY");
    }
    return new Groq({ apiKey: groqApiKey });
}

function getTavilyClient() {
    if (!tavilyApiKey) {
        return null;
    }
    return tavily({ apiKey: tavilyApiKey });
}

export async function generateAssistantReply(messages: { role: "user" | "assistant" | "system"; content: string }[]) {
    const groq = getGroqClient();
    const tvly = getTavilyClient();
    const systemMessage = messages.find((m) => m.role === "system");
    const chatMessages = messages.filter((m) => m.role !== "system");

    if (chatMessages.length === 0) {
        throw new Error("No messages to generate reply from");
    }

    const currentDate = new Date().toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
    });

    const userMessage = chatMessages[chatMessages.length - 1].content;
    let searchContext = "";
    
    try {
        if (tvly) {
            const searchResponse = await tvly.search(userMessage, {
                searchDepth: "basic",
                maxResults: 4
            });

            searchContext = searchResponse.results
                .map((result) => `Source (${result.url}): ${result.content}`)
                .join("\n\n");
        }
    } catch (e) {
        console.error("Tavily search failed", e);
    }

    const fullSystemInstruction = `${systemMessage?.content || "You are a helpful assistant."}\n\nCurrent Time Context: The current date and time is ${currentDate}.\n\nHere is real-time web context based on the user's latest query. Use this to provide accurate and up-to-date answers. If the information is not helpful, rely on your base knowledge.\n\n[WEB SEARCH RESULTS]\n${searchContext}`;

    try {
        const groqMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
            { role: "system", content: fullSystemInstruction },
            ...chatMessages
        ];

        const response = await groq.chat.completions.create({
            messages: groqMessages,
            model: GROQ_MODEL,
            temperature: 0.7,
        });

        return response.choices[0]?.message?.content || "No reply generated.";
    } catch (err) {
        console.error("Groq Assistant Reply error:", err);
        throw err;
    }
}

export async function generateSmartReplies(context: string) {
    const groq = getGroqClient();
    const prompt = `Conversation context:\n\n${context}\n\nReturn 3 short suggested chat replies as a JSON array of strings: ["reply1", "reply2", "reply3"]. Only return the JSON.`;

    try {
        const response = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: GROQ_MODEL,
            temperature: 0.2, // Low temp for structured output
        });
        
        const text = response.choices[0]?.message?.content || "[]";
        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
            return JSON.parse(match[0]) as string[];
        }
        return JSON.parse(text) as string[];
    } catch (e) {
        console.error("Failed to parse smart replies from Groq", e);
        return [];
    }
}

export async function generateSummary(context: string) {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `Summarize the following chat in a few concise bullet points for quick reading:\n\n${context}`;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch {
        const fbModel = genAI.getGenerativeModel({ model: FALLBACK_MODEL });
        const result = await fbModel.generateContent(prompt);
        return result.response.text();
    }
}

export async function generateRewrite(text: string, tone: "Professional" | "Friendly" | "Casual") {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `Rewrite the following message to be more ${tone.toLowerCase()}. Keep the core meaning the same but adjust the wording and style to match the requested tone perfectly.\n\nMessage: "${text}"\n\nOnly return the rewritten text, no explanations or quotes.`;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch {
        const fbModel = genAI.getGenerativeModel({ model: FALLBACK_MODEL });
        const result = await fbModel.generateContent(prompt);
        return result.response.text().trim();
    }
}

export async function generateTranslation(text: string, targetLanguage: string = "English") {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `Translate the following message into ${targetLanguage}. Only return the translated text, no explanations or quotes.\n\nMessage: "${text}"`;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch {
        const fbModel = genAI.getGenerativeModel({ model: FALLBACK_MODEL });
        const result = await fbModel.generateContent(prompt);
        return result.response.text().trim();
    }
}

export async function detectMessageVibe(text: string) {
    if (!text || text.length < 3) return null;
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `Analyze the sentiment of exactly this text: "${text}". Reply strictly with ONLY ONE WORD: POSITIVE, NEGATIVE, or NEUTRAL. No explanation.`;
    
    try {
        const result = await model.generateContent(prompt);
        const label = result.response.text().trim().toUpperCase();
        if (label.includes("POSITIVE")) return [{ label: "POSITIVE", score: 0.99 }];
        if (label.includes("NEGATIVE")) return [{ label: "NEGATIVE", score: 0.99 }];
        return [{ label: "NEUTRAL", score: 0.99 }];
    } catch {
        return null;
    }
}
