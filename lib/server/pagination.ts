import { ApiError } from "@/lib/server/errors";

export type CursorPayload = {
  created_at: string;
  id: string;
};

export function parseLimit(searchParams: URLSearchParams, defaultLimit = 20, maxLimit = 100): number {
  const value = searchParams.get("limit");
  if (!value) {
    return defaultLimit;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0 || parsed > maxLimit) {
    throw new ApiError(422, "VALIDATION_ERROR", `limit must be between 1 and ${maxLimit}`);
  }

  return parsed;
}

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function decodeCursor(cursor: string): CursorPayload {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const payload = JSON.parse(decoded) as CursorPayload;

    if (!payload.created_at || !payload.id) {
      throw new Error("Invalid cursor payload");
    }

    return payload;
  } catch {
    throw new ApiError(422, "VALIDATION_ERROR", "Invalid cursor");
  }
}