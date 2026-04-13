import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase/client";
import { generateAssistantReply } from "@/lib/ai/gemini";
import type { Database } from "@/types/database";
import {
  isUuid,
  parseJsonBody,
  toSafeErrorMessage,
  validateChatMessages,
} from "@/lib/api/validation";

export async function POST(request: Request) {
  const rawBody = await parseJsonBody(request);
  if (!rawBody || typeof rawBody !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const body = rawBody as {
    messages?: unknown;
    userId?: unknown;
  };

  const messages = validateChatMessages(body.messages);
  if (!messages) {
    return NextResponse.json(
      {
        error:
          "Invalid messages payload. Expected non-empty role/content messages and max 30 items.",
      },
      { status: 400 },
    );
  }

  const userId = typeof body.userId === "string" && isUuid(body.userId) ? body.userId : null;

  try {
    const reply = await generateAssistantReply(messages);

    if (userId && supabaseClient) {
      const aiMessageInsert: Database["public"]["Tables"]["ai_messages"]["Insert"] = {
        user_id: userId,
        content:
          messages
            .filter((m) => m.role === "user")
            .map((m) => m.content)
            .join("\n\n") || "No user content",
        response: reply,
      };

      const aiMessagesTable = supabaseClient.from("ai_messages") as unknown as {
        insert: (
          values: Database["public"]["Tables"]["ai_messages"]["Insert"],
        ) => Promise<unknown>;
      };

      await aiMessagesTable.insert(aiMessageInsert);
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("AI Chat error:", error);
    return NextResponse.json(
      { error: toSafeErrorMessage(error, "Failed to generate AI reply") },
      { status: 500 },
    );
  }
}

