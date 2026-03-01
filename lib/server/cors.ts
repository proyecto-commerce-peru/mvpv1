import { NextResponse } from "next/server";
import { jsonError, withSecurityHeaders } from "@/lib/server/http";

const DEV_ALLOW_ORIGIN = "*";

function getAllowedOrigin(request: Request): string | null {
  const requestOrigin = request.headers.get("origin");

  if (!requestOrigin) {
    return null;
  }

  if (process.env.NODE_ENV !== "production") {
    return DEV_ALLOW_ORIGIN;
  }

  const allowed = (process.env.CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (allowed.includes(requestOrigin)) {
    return requestOrigin;
  }

  return null;
}

export function appendCors(request: Request, response: NextResponse): NextResponse {
  const origin = getAllowedOrigin(request);
  if (!origin) {
    return response;
  }

  response.headers.set("access-control-allow-origin", origin);
  response.headers.set("access-control-allow-methods", "GET,POST,PATCH,DELETE,OPTIONS");
  response.headers.set("access-control-allow-headers", "content-type,authorization,x-tenant-id,x-request-id");
  response.headers.set("access-control-max-age", "600");

  return response;
}

export function preflight(request: Request): NextResponse {
  const response = withSecurityHeaders(new NextResponse(null, { status: 204 }));
  return appendCors(request, response);
}

export function rejectOrigin(request: Request, requestId: string): NextResponse | null {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    return null;
  }

  const allowed = getAllowedOrigin(request);
  if (allowed) {
    return null;
  }

  return jsonError(requestId, 403, "CORS_FORBIDDEN", "Origin is not allowed");
}