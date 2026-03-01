import { NextResponse } from "next/server";
import { ApiError } from "@/lib/server/errors";
import { appendCors } from "@/lib/server/cors";
import { getOrCreateRequestId, jsonError } from "@/lib/server/http";

export async function withErrorHandling(
  request: Request,
  handler: (requestId: string) => Promise<NextResponse>,
): Promise<NextResponse> {
  const requestId = getOrCreateRequestId(request);

  try {
    const response = await handler(requestId);
    return appendCors(request, response);
  } catch (error) {
    if (error instanceof ApiError) {
      return appendCors(
        request,
        jsonError(requestId, error.status, error.code, error.message, error.details),
      );
    }

    console.error("Unhandled API error", { requestId, error });
    return appendCors(
      request,
      jsonError(requestId, 500, "INTERNAL_ERROR", "Unexpected server error"),
    );
  }
}