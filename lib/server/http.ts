import { NextResponse } from "next/server";

const REQUEST_ID_HEADER = "x-request-id";

export function getOrCreateRequestId(request: Request): string {
  return request.headers.get(REQUEST_ID_HEADER) ?? crypto.randomUUID();
}

export function jsonOk<T>(requestId: string, data: T, meta?: Record<string, unknown>, status = 200) {
  return withSecurityHeaders(
    NextResponse.json(
      {
        data,
        meta: {
          request_id: requestId,
          ...(meta ?? {}),
        },
      },
      { status },
    ),
  );
}

export function jsonError(
  requestId: string,
  status: number,
  code: string,
  message: string,
  details?: unknown,
) {
  return withSecurityHeaders(
    NextResponse.json(
      {
        error: {
          code,
          message,
          details,
        },
        meta: {
          request_id: requestId,
        },
      },
      { status },
    ),
  );
}

export function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("referrer-policy", "no-referrer");
  response.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("content-security-policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");

  if (process.env.NODE_ENV === "production") {
    response.headers.set("strict-transport-security", "max-age=63072000; includeSubDomains; preload");
  }

  return response;
}