import { PrismaClient } from '@prisma/client';
import { fakerES_MX as faker } from '@faker-js/faker';

const prisma = new PrismaClient();
const now = () => new Date();

// Generadores de data
const generateTenantData = () => ({
  id: faker.string.uuid(),
  name: faker.company.name(),
  legal_name: `${faker.company.name()} SAC`,
  tax_id: '20' + faker.string.numeric(9),
  slug: faker.internet.domainWord(),
  status: 'ACTIVE' as const,
  country_code: 'PE',
  timezone: 'America/Lima',
  currency_code: 'PEN',
  metadata: {},
  created_at: now(),
  updated_at: now(),
});

const generateStoreData = (tenantId: string) => ({
  id: faker.string.uuid(),
  tenant_id: tenantId,
  name: `${faker.commerce.department()} Store`,
  channel: 'WEB' as const,
  status: 'ACTIVE' as const,
  created_at: now(),
  updated_at: now(),
});

const generateUserData = (tenantId: string) => ({
  id: faker.string.uuid(),
  tenant_id: tenantId,
  email: faker.internet.email(),
  status: 'ACTIVE' as const,
  created_at: now(),
  updated_at: now(),
});

const generateUserProfileData = (tenantId: string, userId: string) => ({
  id: faker.string.uuid(),
  tenant_id: tenantId,
  user_id: userId,
  full_name: faker.person.fullName(),
  locale: 'es-PE',
  timezone: 'America/Lima',
  created_at: now(),
  updated_at: now(),
});

const generateOfferingData = (tenantId: string, catalogId: string) => ({
  id: faker.string.uuid(),
  tenant_id: tenantId,
  catalog_id: catalogId,
  type: 'PRODUCT' as const,
  title: faker.commerce.productName(),
  status: 'ACTIVE' as const,
  currency_code: 'PEN',
  is_tax_included: true,
  created_at: now(),
  updated_at: now(),
});

const generateVariantData = (tenantId: string, offeringId: string) => {
  const price = parseFloat(faker.commerce.price({ min: 10, max: 500 }));
  return {
    id: faker.string.uuid(),
    tenant_id: tenantId,
    offering_id: offeringId,
    sku: `SKU-${faker.string.numeric(6)}`,
    status: 'ACTIVE' as const,
    price_final: price,
    tax_rate: 0.18,
    created_at: now(),
    updated_at: now(),
  };
};

const generateCustomerData = (tenantId: string) => ({
  id: faker.string.uuid(),
  tenant_id: tenantId,
  full_name: faker.person.fullName(),
  phone_e164: `+51${faker.string.numeric(9)}`,
  email: faker.internet.email(),
  status: 'ACTIVE' as const,
  created_at: now(),
  updated_at: now(),
});

const generateCustomerAddressData = (tenantId: string, customerId: string) => ({
  id: faker.string.uuid(),
  tenant_id: tenantId,
  customer_id: customerId,
  label: faker.location.city(),
  country_code: 'PE',
  address_line1: faker.location.streetAddress(),
  is_default: true,
  created_at: now(),
  updated_at: now(),
});

// Función principal para crear un tenant completo
const createCompleteTenant = async (index: number) => {
  const tenantData = generateTenantData();

  // Crear tenant
  const tenant = await prisma.tenant.create({
    data: tenantData,
  });

  console.log(`✅ Tenant ${index + 1}: ${tenant.name}`);

  // Crear settings
  await prisma.tenantSetting.create({
    data: {
      id: faker.string.uuid(),
      tenant_id: tenant.id,
      key: 'features.whatsapp',
      value: JSON.stringify({ enabled: true }),
      scope: 'TENANT',
      created_at: now(),
      updated_at: now(),
    },
  });

  // Crear store
  const store = await prisma.tenantStore.create({
    data: generateStoreData(tenant.id),
  });

  // Crear catalog
  const catalog = await prisma.catalog.create({
    data: {
      id: faker.string.uuid(),
      tenant_id: tenant.id,
      store_id: store.id,
      name: 'Catálogo Principal',
      status: 'ACTIVE',
      created_at: now(),
      updated_at: now(),
    },
  });

  // Crear user
  const user = await prisma.user.create({
    data: generateUserData(tenant.id),
  });

  // Crear user profile
  await prisma.userProfile.create({
    data: generateUserProfileData(tenant.id, user.id),
  });

  // Crear price list
  const priceList = await prisma.priceList.create({
    data: {
      id: faker.string.uuid(),
      tenant_id: tenant.id,
      catalog_id: catalog.id,
      name: 'Precios por Defecto',
      currency_code: 'PEN',
      is_default: true,
      created_at: now(),
      updated_at: now(),
    },
  });

  // Crear 5 productos sin for loop
  await Promise.all(
    Array.from({ length: 5 }).map(async () => {
      const offering = await prisma.storeOffering.create({
        data: generateOfferingData(tenant.id, catalog.id),
      });

      const variant = await prisma.storeVariant.create({
        data: generateVariantData(tenant.id, offering.id),
      });

      await prisma.price.create({
        data: {
          id: faker.string.uuid(),
          tenant_id: tenant.id,
          price_list_id: priceList.id,
          offering_id: offering.id,
          variant_id: variant.id,
          list_price: variant.price_final,
          sale_price: Number(variant.price_final) * 0.9,
          is_active: true,
          created_at: now(),
          updated_at: now(),
        },
      });
    })
  );

  // Crear 3 clientes sin for loop
  await Promise.all(
    Array.from({ length: 3 }).map(async () => {
      const customer = await prisma.customer.create({
        data: generateCustomerData(tenant.id),
      });

      await prisma.customerAddress.create({
        data: generateCustomerAddressData(tenant.id, customer.id),
      });
    })
  );
};

// Main
async function main() {
  console.log('🌱 Iniciando seed con 10 tenants...');

  await Promise.all(
    Array.from({ length: 10 }).map((_, i) => createCompleteTenant(i))
  );

  console.log('✨ ¡Seed completado con éxito!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

