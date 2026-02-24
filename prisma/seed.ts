import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/es_PE';

const prisma = new PrismaClient();

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
});

const generateStoreData = (tenantId: string) => ({
  id: faker.string.uuid(),
  tenant_id: tenantId,
  name: `${faker.commerce.department()} Store`,
  channel: 'WEB' as const,
  status: 'ACTIVE' as const,
});

const generateUserData = (tenantId: string) => ({
  id: faker.string.uuid(),
  tenant_id: tenantId,
  email: faker.internet.email(),
  status: 'ACTIVE' as const,
});

const generateUserProfileData = (tenantId: string, userId: string) => ({
  id: faker.string.uuid(),
  tenant_id: tenantId,
  user_id: userId,
  full_name: faker.person.fullName(),
  locale: 'es-PE',
  timezone: 'America/Lima',
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
  };
};

const generateCustomerData = (tenantId: string) => ({
  id: faker.string.uuid(),
  tenant_id: tenantId,
  full_name: faker.person.fullName(),
  phone_e164: faker.phone.number('+51#########'),
  email: faker.internet.email(),
  status: 'ACTIVE' as const,
});

const generateCustomerAddressData = (tenantId: string, customerId: string) => ({
  id: faker.string.uuid(),
  tenant_id: tenantId,
  customer_id: customerId,
  label: faker.location.city(),
  country_code: 'PE',
  address_line1: faker.location.streetAddress(),
  is_default: true,
});

// Función principal para crear un tenant completo
const createCompleteTenant = async (index: number) => {
  const tenantData = generateTenantData();

  // Crear tenant
  const tenant = await prisma.tenants.create({
    data: tenantData,
  });

  console.log(`✅ Tenant ${index + 1}: ${tenant.name}`);

  // Crear settings
  await prisma.tenant_settings.create({
    data: {
      id: faker.string.uuid(),
      tenant_id: tenant.id,
      key: 'features.whatsapp',
      value: JSON.stringify({ enabled: true }),
      scope: 'TENANT',
    },
  });

  // Crear store
  const store = await prisma.tenant_stores.create({
    data: generateStoreData(tenant.id),
  });

  // Crear catalog
  const catalog = await prisma.catalogs.create({
    data: {
      id: faker.string.uuid(),
      tenant_id: tenant.id,
      store_id: store.id,
      name: 'Catálogo Principal',
      status: 'ACTIVE',
    },
  });

  // Crear user
  const user = await prisma.users.create({
    data: generateUserData(tenant.id),
  });

  // Crear user profile
  await prisma.user_profiles.create({
    data: generateUserProfileData(tenant.id, user.id),
  });

  // Crear price list
  const priceList = await prisma.price_lists.create({
    data: {
      id: faker.string.uuid(),
      tenant_id: tenant.id,
      catalog_id: catalog.id,
      name: 'Precios por Defecto',
      currency_code: 'PEN',
      is_default: true,
    },
  });

  // Crear 5 productos sin for loop
  await Promise.all(
    Array.from({ length: 5 }).map(async () => {
      const offering = await prisma.store_offerings.create({
        data: generateOfferingData(tenant.id, catalog.id),
      });

      const variant = await prisma.store_variants.create({
        data: generateVariantData(tenant.id, offering.id),
      });

      await prisma.prices.create({
        data: {
          id: faker.string.uuid(),
          tenant_id: tenant.id,
          price_list_id: priceList.id,
          offering_id: offering.id,
          variant_id: variant.id,
          list_price: variant.price_final,
          sale_price: variant.price_final * 0.9,
          is_active: true,
        },
      });
    })
  );

  // Crear 3 clientes sin for loop
  await Promise.all(
    Array.from({ length: 3 }).map(async () => {
      const customer = await prisma.customers.create({
        data: generateCustomerData(tenant.id),
      });

      await prisma.customer_addresses.create({
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

