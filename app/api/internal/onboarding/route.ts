import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/server/db";
import { resolveSessionUser, resolveSessionTenantId } from "@/lib/server/auth/session";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user || !session?.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionUser = await resolveSessionUser(session);
  if (!sessionUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const tenantIdFromHeader = request.headers.get("x-tenant-id");
  const tenantId = tenantIdFromHeader ?? await resolveSessionTenantId(session);

  let body: {
    name?: string;
    slug?: string;
    legal_name?: string;
    tax_id?: string;
    country_code?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { name, slug, legal_name, tax_id, country_code } = body;

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json(
      { error: "El nombre del negocio es requerido (mínimo 2 caracteres)." },
      { status: 422 }
    );
  }

  if (!slug || typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "El slug solo puede contener letras minúsculas, números y guiones." },
      { status: 422 }
    );
  }

  // Verificar que el slug no esté en uso por otro tenant
  const existingSlug = await prisma.tenant.findUnique({ where: { slug } });
  if (existingSlug && existingSlug.id !== tenantId) {
    return NextResponse.json(
      { error: "Ese identificador ya está en uso. Elige otro." },
      { status: 409 }
    );
  }

  const now = new Date();

  if (!tenantId) {
    const newTenantId = crypto.randomUUID();

    await prisma.$transaction(async (tx) => {
      await tx.tenant.create({
        data: {
          id: newTenantId,
          name: name.trim(),
          slug,
          legal_name: legal_name?.trim() || null,
          tax_id: tax_id?.trim() || null,
          country_code: country_code ?? "PE",
          status: "ACTIVE",
          timezone: "America/Lima",
          currency_code: "PEN",
          createdAt: now,
          updatedAt: now,
        },
      });

      await tx.user.update({
        where: { id: sessionUser.id },
        data: {
          tenant_id: newTenantId,
          updatedAt: now,
        },
      });
    });

    return NextResponse.json({ ok: true });
  }

  // Actualizar el tenant con los datos del negocio y cambiar status a ACTIVE
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      name: name.trim(),
      slug,
      legal_name: legal_name?.trim() || null,
      tax_id: tax_id?.trim() || null,
      country_code: country_code ?? "PE",
      status: "ACTIVE",
      updatedAt: now,
    },
  });

  return NextResponse.json({ ok: true });
}
