import { ApiError } from "@/lib/server/errors";

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Request body must be valid JSON");
  }
}

export function expectObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ApiError(422, "VALIDATION_ERROR", "Request body must be an object");
  }
  return input as Record<string, unknown>;
}

export function expectString(obj: Record<string, unknown>, key: string, min = 1, max = 255): string {
  const value = obj[key];
  if (typeof value !== "string") {
    throw new ApiError(422, "VALIDATION_ERROR", `${key} must be a string`);
  }

  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    throw new ApiError(422, "VALIDATION_ERROR", `${key} length must be between ${min} and ${max}`);
  }

  return trimmed;
}

export function optionalString(
  obj: Record<string, unknown>,
  key: string,
  min = 0,
  max = 255,
): string | undefined {
  const value = obj[key];
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new ApiError(422, "VALIDATION_ERROR", `${key} must be a string`);
  }

  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    throw new ApiError(422, "VALIDATION_ERROR", `${key} length must be between ${min} and ${max}`);
  }

  return trimmed;
}

export function optionalBoolean(obj: Record<string, unknown>, key: string): boolean | undefined {
  const value = obj[key];
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new ApiError(422, "VALIDATION_ERROR", `${key} must be a boolean`);
  }

  return value;
}

export function expectEmail(obj: Record<string, unknown>, key = "email"): string {
  const value = expectString(obj, key, 5, 255).toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(value)) {
    throw new ApiError(422, "VALIDATION_ERROR", `${key} must be a valid email`);
  }

  return value;
}

export function expectPassword(obj: Record<string, unknown>, key = "password"): string {
  const value = expectString(obj, key, 8, 128);

  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasNumber = /\d/.test(value);

  if (!hasUpper || !hasLower || !hasNumber) {
    throw new ApiError(
      422,
      "VALIDATION_ERROR",
      `${key} must include uppercase, lowercase and number`,
    );
  }

  return value;
}