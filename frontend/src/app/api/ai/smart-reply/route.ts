import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase/client";
import { generateSmartReplies } from "@/lib/ai/gemini";
import { isUuid, toSafeErrorMessage } from "@/lib/api/validation";

type ContextMessage = {
  content: string | null;
  sender_id: string;
  created_at: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  // Demo-safe: demo chats are not UUIDs
  if (!chatId) {
    return NextResponse.json({
      suggestions: ["Hello!", "How can I help?", "Sounds good!"],
    });
  }

  try {
    let context = "";
    if (supabaseClient && isUuid(chatId)) {
      const { data: messages } = await supabaseClient
        .from("messages")
        .select("content, sender_id, created_at")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true })
        .limit(20);

      const safeMessages = (messages ?? []) as ContextMessage[];
      context = safeMessages
        .map(
          (m) =>
            `[${m.created_at}] (${m.sender_id.slice(0, 6)}) ${m.content ?? ""}`,
        )
        .join("\n");
    }

    if (!context) {
      return NextResponse.json({
        suggestions: ["Hello!", "How can I help?", "Nice to meet you!"],
      });
    }

    const suggestions = await generateSmartReplies(context);
    if (!suggestions?.length) {
      return NextResponse.json({
        suggestions: ["Got it.", "Tell me more.", "Sounds good!"],
      });
    }
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Smart reply error:", error);
    return NextResponse.json({
      suggestions: ["Thanks!", "Okay.", "I’ll get back to you."],
    });
  }
}

