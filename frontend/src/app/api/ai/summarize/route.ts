import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase/client";
import { generateSummary } from "@/lib/ai/gemini";
import { isUuid, toSafeErrorMessage } from "@/lib/api/validation";

type ContextMessage = {
  content: string | null;
  sender_id: string;
  created_at: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId || !isUuid(chatId)) {
    return NextResponse.json({ summary: "No chat selected." });
  }

  try {
    let context = "";
    if (supabaseClient) {
      const { data: messages } = await supabaseClient
        .from("messages")
        .select("content, sender_id, created_at")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true })
        .limit(60);

      const safeMessages = (messages ?? []) as ContextMessage[];
      context = safeMessages
        .map(
          (m) =>
            `[${m.created_at}] (${m.sender_id.slice(0, 6)}) ${m.content ?? ""}`,
        )
        .join("\n");
    }

    if (!context) {
      return NextResponse.json({ summary: "No messages found to summarize." });
    }

    const summary = await generateSummary(context);
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Summarize error:", error);
    return NextResponse.json(
      { error: toSafeErrorMessage(error, "Failed to generate summary. Please check your AI configuration.") },
      { status: 500 },
    );
  }
}

