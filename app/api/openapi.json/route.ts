import { NextResponse } from "next/server";
import { withSecurityHeaders } from "@/lib/server/http";
import { openApiDocument } from "@/lib/server/openapi/document";

function withDefaultResponses(document: Record<string, unknown>): Record<string, unknown> {
  const cloned = structuredClone(document) as {
    paths?: Record<string, Record<string, Record<string, unknown>>>;
  };

  const methods = ["get", "post", "patch", "put", "delete"];

  for (const [, pathItem] of Object.entries(cloned.paths ?? {})) {
    for (const method of methods) {
      const operation = pathItem?.[method];
      if (!operation || operation.responses) {
        continue;
      }

      const successCode = method === "post" ? "201" : "200";
      operation.responses = {
        [successCode]: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  data: {},
                  meta: {
                    type: "object",
                    properties: {
                      request_id: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
        "400": { description: "Bad request" },
        "401": { description: "Unauthorized" },
        "403": { description: "Forbidden" },
        "404": { description: "Not found" },
        "409": { description: "Conflict" },
        "422": { description: "Validation error" },
        "429": { description: "Too many requests" },
        "500": { description: "Server error" },
      };
    }
  }

  return cloned;
}

export async function GET() {
  const normalized = withDefaultResponses(openApiDocument as Record<string, unknown>);
  return withSecurityHeaders(NextResponse.json(normalized, { status: 200 }));
}
