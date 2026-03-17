/**
 * seed-permissions.ts
 * Inserta los permisos del sistema y los 3 roles globales (OWNER, STAFF, ADMIN)
 * en un tenant especial "system" identificado por el slug "system".
 * Estos roles/permisos se copian a cada tenant nuevo al hacer onSignUp.
 *
 * Es idempotente: usa upsert, se puede correr múltiples veces sin duplicar.
 *
 * Ejecutar con: npx tsx prisma/seed-permissions.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Permisos del sistema ────────────────────────────────────────────────────
const PERMISSIONS = [
  { key: "catalog:read",     description: "Ver catálogo de productos" },
  { key: "catalog:write",    description: "Crear y editar productos" },
  { key: "catalog:delete",   description: "Eliminar productos" },
  { key: "images:read",      description: "Ver imágenes" },
  { key: "images:write",     description: "Subir y editar imágenes" },
  { key: "prices:read",      description: "Ver precios" },
  { key: "prices:write",     description: "Crear y editar precios" },
  { key: "promotions:read",  description: "Ver promociones" },
  { key: "promotions:write", description: "Crear y editar promociones" },
  { key: "orders:read",      description: "Ver pedidos" },
  { key: "orders:write",     description: "Crear y editar pedidos" },
  { key: "whatsapp:read",    description: "Ver configuración de WhatsApp" },
  { key: "whatsapp:write",   description: "Editar configuración de WhatsApp" },
  { key: "payments:read",    description: "Ver formas de pago" },
  { key: "payments:write",   description: "Editar formas de pago" },
  { key: "shipping:read",    description: "Ver formas de envío" },
  { key: "shipping:write",   description: "Editar formas de envío" },
  { key: "agent:read",       description: "Ver configuración del agente IA" },
  { key: "agent:write",      description: "Editar configuración del agente IA" },
  { key: "users:read",       description: "Ver usuarios del tenant" },
  { key: "users:write",      description: "Crear y gestionar usuarios STAFF" },
  { key: "tenant:read",      description: "Ver datos del tenant/negocio" },
  { key: "tenant:write",     description: "Editar datos del tenant/negocio" },
  { key: "reports:read",     description: "Ver reportes y métricas" },
  { key: "admin:tenants",    description: "Gestionar todos los tenants (solo ADMIN)" },
  { key: "admin:global",     description: "Acceso a pantallas exclusivas de ADMIN" },
];

// ─── Permisos por rol ────────────────────────────────────────────────────────
const OWNER_PERMISSIONS = [
  "catalog:read", "catalog:write", "catalog:delete",
  "images:read", "images:write",
  "prices:read", "prices:write",
  "promotions:read", "promotions:write",
  "orders:read", "orders:write",
  "whatsapp:read", "whatsapp:write",
  "payments:read", "payments:write",
  "shipping:read", "shipping:write",
  "agent:read", "agent:write",
  "users:read", "users:write",
  "tenant:read", "tenant:write",
  "reports:read",
];

const STAFF_PERMISSIONS = [
  "catalog:read", "catalog:write",
  "images:read", "images:write",
  "prices:read",
  "promotions:read",
  "orders:read", "orders:write",
];

const ADMIN_PERMISSIONS = [
  ...OWNER_PERMISSIONS,
  "admin:tenants",
  "admin:global",
];

async function main() {
  console.log("🌱 Seeding permisos del sistema...");

  // 1. Upsert todos los permisos globales
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      create: { id: crypto.randomUUID(), key: perm.key, description: perm.description },
      update: { description: perm.description },
    });
  }
  console.log(`  ✅ ${PERMISSIONS.length} permisos creados/actualizados`);

  // 2. Crear el tenant "system" si no existe
  const systemTenant = await prisma.tenant.upsert({
    where: { slug: "system" },
    create: {
      id: crypto.randomUUID(),
      name: "System",
      slug: "system",
      status: "ACTIVE",
      country_code: "PE",
      timezone: "America/Lima",
      currency_code: "PEN",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    update: {},
  });
  console.log(`  ✅ Tenant system: ${systemTenant.id}`);

  // 3. Crear/actualizar los 3 roles del sistema
  const roleData = [
    {
      name: "OWNER",
      description: "Propietario del tenant. Acceso completo a su negocio.",
      permissions: OWNER_PERMISSIONS,
    },
    {
      name: "STAFF",
      description: "Empleado del tenant. Acceso limitado.",
      permissions: STAFF_PERMISSIONS,
    },
    {
      name: "ADMIN",
      description: "Administrador del sistema. Acceso global.",
      permissions: ADMIN_PERMISSIONS,
    },
  ];

  for (const roleDef of roleData) {
    const role = await prisma.role.upsert({
      where: { tenant_id_name: { tenant_id: systemTenant.id, name: roleDef.name } },
      create: {
        id: crypto.randomUUID(),
        tenant_id: systemTenant.id,
        name: roleDef.name,
        description: roleDef.description,
        is_system: true,
      },
      update: { description: roleDef.description },
    });

    for (const permKey of roleDef.permissions) {
      const permission = await prisma.permission.findUnique({ where: { key: permKey } });
      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: {
          tenant_id_role_id_permission_id: {
            tenant_id: systemTenant.id,
            role_id: role.id,
            permission_id: permission.id,
          },
        },
        create: {
          id: crypto.randomUUID(),
          tenant_id: systemTenant.id,
          role_id: role.id,
          permission_id: permission.id,
        },
        update: {},
      });
    }

    console.log(`  ✅ Rol ${roleDef.name}: ${roleDef.permissions.length} permisos asignados`);
  }

  console.log("\n✨ Seed de permisos completado exitosamente");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed-permissions:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


