import { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/server/errors";

export function parseDecimalInput(value: unknown, field: string): Prisma.Decimal {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new ApiError(422, "VALIDATION_ERROR", `${field} must be a number or numeric string`);
  }

  try {
    return new Prisma.Decimal(value);
  } catch {
    throw new ApiError(422, "VALIDATION_ERROR", `${field} must be a valid decimal`);
  }
}

export function decimalToNumber(value: Prisma.Decimal | null | undefined): number | null {
  if (!value) {
    return null;
  }
  return Number(value.toString());
}