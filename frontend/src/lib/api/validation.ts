const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const AI_TEXT_MAX_LENGTH = 4000;
export const AI_MESSAGES_MAX_ITEMS = 30;

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessagePayload {
  role: ChatRole;
  content: string;
}

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

export function sanitizeText(value: unknown, maxLength = AI_TEXT_MAX_LENGTH): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export function toSafeErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function validateTone(value: unknown): value is "Professional" | "Friendly" | "Casual" {
  return value === "Professional" || value === "Friendly" || value === "Casual";
}

export function validateChatMessages(value: unknown): ChatMessagePayload[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  if (value.length > AI_MESSAGES_MAX_ITEMS) return null;

  const parsed: ChatMessagePayload[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const rawRole = (item as Record<string, unknown>).role;
    const rawContent = (item as Record<string, unknown>).content;
    if (rawRole !== "user" && rawRole !== "assistant" && rawRole !== "system") {
      return null;
    }
    const content = sanitizeText(rawContent);
    if (!content) return null;
    parsed.push({ role: rawRole, content });
  }

  return parsed;
}

export function validateTargetLanguage(value: unknown): string {
  const safe = sanitizeText(value, 32);
  if (!safe) return "English";
  if (!/^[a-zA-Z\- ]+$/.test(safe)) return "English";
  return safe;
}
