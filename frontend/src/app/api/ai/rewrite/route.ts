import { NextResponse } from "next/server";
import { generateRewrite } from "@/lib/ai/gemini";
import {
    parseJsonBody,
    sanitizeText,
    toSafeErrorMessage,
    validateTone,
} from "@/lib/api/validation";

export async function POST(request: Request) {
    try {
        const rawBody = await parseJsonBody(request);
        if (!rawBody || typeof rawBody !== "object") {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const text = sanitizeText((rawBody as Record<string, unknown>).text);
        const tone = (rawBody as Record<string, unknown>).tone;

        if (!text || !validateTone(tone)) {
            return NextResponse.json({ error: "Missing text or tone" }, { status: 400 });
        }

        const rewrittenText = await generateRewrite(text, tone);
        return NextResponse.json({ rewrittenText });
    } catch (error: unknown) {
        console.error("AI Rewrite error:", error);
        return NextResponse.json({ error: toSafeErrorMessage(error, "Failed to rewrite message") }, { status: 500 });
    }
}
