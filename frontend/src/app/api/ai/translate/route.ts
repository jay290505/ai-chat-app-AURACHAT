import { NextResponse } from "next/server";
import { generateTranslation } from "@/lib/ai/gemini";
import {
    parseJsonBody,
    sanitizeText,
    toSafeErrorMessage,
    validateTargetLanguage,
} from "@/lib/api/validation";

export async function POST(request: Request) {
    try {
        const rawBody = await parseJsonBody(request);
        if (!rawBody || typeof rawBody !== "object") {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const text = sanitizeText((rawBody as Record<string, unknown>).text);
        const targetLanguage = validateTargetLanguage(
            (rawBody as Record<string, unknown>).targetLanguage,
        );

        if (!text) {
            return NextResponse.json({ error: "Missing text" }, { status: 400 });
        }

        const translatedText = await generateTranslation(text, targetLanguage);
        return NextResponse.json({ translatedText });
    } catch (error: unknown) {
        console.error("AI Translation error:", error);
        return NextResponse.json({ error: toSafeErrorMessage(error, "Failed to translate message") }, { status: 500 });
    }
}
