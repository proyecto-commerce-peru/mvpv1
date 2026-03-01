import { createHmac, timingSafeEqual } from "crypto";
import { ApiError } from "@/lib/server/errors";

type AccessTokenPayload = {
  sub: string;
  tenant_id: string;
  exp: number;
  iat: number;
};

const ACCESS_TTL_SECONDS = 60 * 60;

function getSecret(): string {
  const secret = process.env.AUTH_TOKEN_SECRET;
  if (!secret) {
    throw new ApiError(500, "AUTH_CONFIG_ERROR", "AUTH_TOKEN_SECRET is missing");
  }
  return secret;
}

function encode(input: string): string {
  return Buffer.from(input).toString("base64url");
}

function decode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(content: string, secret: string): string {
  return createHmac("sha256", secret).update(content).digest("base64url");
}

export function issueAccessToken(userId: string, tenantId: string, ttlSeconds = ACCESS_TTL_SECONDS): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: AccessTokenPayload = {
    sub: userId,
    tenant_id: tenantId,
    iat: now,
    exp: now + ttlSeconds,
  };

  const body = encode(JSON.stringify(payload));
  const signature = sign(body, getSecret());
  return `${body}.${signature}`;
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const secret = getSecret();
  const [body, signature] = token.split(".");

  if (!body || !signature) {
    throw new ApiError(401, "INVALID_TOKEN", "Malformed access token");
  }

  const expected = sign(body, secret);
  const ok = timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  if (!ok) {
    throw new ApiError(401, "INVALID_TOKEN", "Invalid token signature");
  }

  let payload: AccessTokenPayload;
  try {
    payload = JSON.parse(decode(body)) as AccessTokenPayload;
  } catch {
    throw new ApiError(401, "INVALID_TOKEN", "Invalid token payload");
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    throw new ApiError(401, "TOKEN_EXPIRED", "Token expired");
  }

  return payload;
}