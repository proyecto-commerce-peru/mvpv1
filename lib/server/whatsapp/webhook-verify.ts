import { ApiError } from "@/lib/server/errors";

export type MetaWebhookVerificationInput = {
  mode: string | null;
  verifyToken: string | null;
  challenge: string | null;
};

export function verifyMetaWebhookChallenge(input: MetaWebhookVerificationInput): string {
  if (input.mode !== "subscribe") {
    throw new ApiError(400, "WEBHOOK_VERIFY_FAILED", "Invalid hub.mode");
  }

  if (!input.challenge) {
    throw new ApiError(400, "WEBHOOK_VERIFY_FAILED", "Missing hub.challenge");
  }

  const expectedToken = process.env.META_VERIFY_TOKEN;
  if (!expectedToken) {
    throw new ApiError(500, "WHATSAPP_CONFIG_ERROR", "META_VERIFY_TOKEN is missing");
  }

  if (input.verifyToken !== expectedToken) {
    throw new ApiError(403, "WEBHOOK_VERIFY_FAILED", "Invalid verify token");
  }

  return input.challenge;
}