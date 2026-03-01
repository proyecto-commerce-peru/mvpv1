import { NextResponse } from "next/server";
import { withSecurityHeaders } from "@/lib/server/http";
import { withErrorHandling } from "@/lib/server/route";
import { processOutboxBatch } from "@/lib/server/jobs/outbox-worker";
import { ApiError } from "@/lib/server/errors";

function requireJobSecret(request: Request): void {
  const configured = process.env.JOB_RUNNER_SECRET;
  if (!configured) {
    throw new ApiError(500, "JOB_CONFIG_ERROR", "JOB_RUNNER_SECRET is missing");
  }

  const received = request.headers.get("x-job-secret");
  if (!received || received !== configured) {
    throw new ApiError(403, "FORBIDDEN", "Invalid job secret");
  }
}

export async function POST(request: Request) {
  return withErrorHandling(request, async () => {
    requireJobSecret(request);

    const result = await processOutboxBatch(50);
    return withSecurityHeaders(NextResponse.json({ data: result }, { status: 200 }));
  });
}