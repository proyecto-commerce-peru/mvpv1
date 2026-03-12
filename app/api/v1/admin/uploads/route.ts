import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getDefaultTenantId } from "@/lib/tenant";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function jsonError(
  status: number,
  error: string,
  message: string,
  details?: Record<string, unknown>
) {
  return NextResponse.json({ error, message, details }, { status });
}

export async function POST(request: Request) {
  try {
    const tenantId = await getDefaultTenantId();
    const formData = await request.formData();
    const file = formData.get("file");
    const offeringId = formData.get("offeringId");
    const altText = formData.get("altText");

    if (!file || !(file instanceof File)) {
      return jsonError(422, "ValidationError", "File is required.");
    }
    if (typeof offeringId !== "string" || !offeringId) {
      return jsonError(422, "ValidationError", "Offering id is required.");
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return jsonError(422, "ValidationError", "Unsupported file type.");
    }
    if (file.size > MAX_SIZE_BYTES) {
      return jsonError(422, "ValidationError", "File is too large.");
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${crypto.randomUUID()}-${file.name.replace(/\s+/g, "-")}`;
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "products",
      offeringId
    );
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const url = `/uploads/products/${offeringId}/${fileName}`;
    const now = new Date();
    const image = await prisma.storeOfferingImage.create({
      data: {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        offering_id: offeringId,
        url,
        alt_text: typeof altText === "string" ? altText : null,
        sort_order: 0,
        created_at: now,
      },
      select: { id: true, url: true, alt_text: true, sort_order: true },
    });

    return NextResponse.json({
      id: image.id,
      url: image.url,
      altText: image.alt_text,
      sortOrder: image.sort_order,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonError(500, "ServerError", message);
  }
}
