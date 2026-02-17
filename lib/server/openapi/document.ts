const cursorParam = {
  name: "cursor",
  in: "query",
  required: false,
  schema: { type: "string" },
};

const privateSecurity = [{ bearerAuth: [], tenantHeader: [] }];

const tenantSecurity = [{ tenantHeader: [] }];

const limitParam = {
  name: "limit",
  in: "query",
  required: false,
  schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
};

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Seller Bot API",
    version: "1.0.0",
    description: "B2B WhatsApp messaging API - v1",
  },
  servers: [{ url: "/" }],
  security: privateSecurity,
  tags: [
    { name: "Auth" },
    { name: "Users" },
    { name: "Catalog" },
    { name: "Customers" },
    { name: "WhatsApp" },
    { name: "Commerce" },
    { name: "Observability" },
    { name: "Internal" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
      },
      tenantHeader: {
        type: "apiKey",
        in: "header",
        name: "x-tenant-id",
      },
    },
    schemas: {
      AuthTokenResponse: {
        type: "object",
        properties: {
          access_token: { type: "string" },
          token_type: { type: "string", example: "Bearer" },
          expires_in: { type: "integer", example: 3600 },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              details: {},
            },
          },
          meta: {
            type: "object",
            properties: { request_id: { type: "string" } },
          },
        },
      },
      SuccessEnvelope: {
        type: "object",
        properties: {
          data: {},
          meta: {
            type: "object",
            properties: {
              request_id: { type: "string" },
              next_cursor: { type: "string", nullable: true },
              has_more: { type: "boolean" },
              limit: { type: "integer" },
            },
          },
        },
      },
    },
  },
  paths: {
    "/api/v1/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register user",
        security: tenantSecurity,
        parameters: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "full_name"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                  full_name: { type: "string" },
                },
              },
              example: {
                email: "admin@primas.demo",
                password: "Secret123",
                full_name: "Admin User",
              },
            },
          },
        },
        responses: { "201": { description: "Created" } },
      },
    },
    "/api/v1/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        security: tenantSecurity,
        parameters: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
              example: {
                email: "admin@primas.demo",
                password: "Secret123",
              },
            },
          },
        },
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/v1/auth/magic-link/request": {
      post: {
        tags: ["Auth"],
        summary: "Request magic link",
        security: tenantSecurity,
        parameters: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["email"], properties: { email: { type: "string", format: "email" } } },
              example: { email: "admin@primas.demo" },
            },
          },
        },
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/v1/auth/magic-link/verify": {
      post: {
        tags: ["Auth"],
        summary: "Verify magic link",
        security: tenantSecurity,
        parameters: [],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["token"], properties: { token: { type: "string" } } }, example: { token: "ml_xxx" } } },
        },
      },
    },
    "/api/v1/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Forgot password",
        security: tenantSecurity,
        parameters: [],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["email"], properties: { email: { type: "string", format: "email" } } }, example: { email: "admin@primas.demo" } } },
        },
      },
    },
    "/api/v1/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password",
        security: tenantSecurity,
        parameters: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token", "new_password"],
                properties: { token: { type: "string" }, new_password: { type: "string" } },
              },
              example: { token: "pr_xxx", new_password: "Secret123" },
            },
          },
        },
      },
    },
    "/api/v1/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout",
        parameters: [],
      },
    },

    "/api/v1/users": {
      get: {
        tags: ["Users"],
        summary: "List users",
        parameters: [limitParam, cursorParam],
      },
      post: {
        tags: ["Users"],
        summary: "Create user",
        parameters: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "full_name"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                  full_name: { type: "string" },
                  status: { type: "string" },
                },
              },
              example: { email: "user@primas.demo", password: "Secret123", full_name: "Sales User", status: "ACTIVE" },
            },
          },
        },
      },
    },
    "/api/v1/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get user",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      },
      patch: {
        tags: ["Users"],
        summary: "Update user",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { email: { type: "string" }, status: { type: "string" }, full_name: { type: "string" }, phone: { type: ["string", "null"] } } }, example: { status: "ACTIVE", full_name: "Updated Name" } } },
        },
      },
      delete: {
        tags: ["Users"],
        summary: "Delete user",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      },
    },

    "/api/v1/catalog/categories": {
      get: { tags: ["Catalog"], summary: "List categories", parameters: [limitParam, cursorParam] },
      post: {
        tags: ["Catalog"], summary: "Create category", parameters: [],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["catalog_id", "name", "slug"], properties: { catalog_id: { type: "string" }, name: { type: "string" }, slug: { type: "string" }, parent_id: { type: "string" }, sort_order: { type: "integer" }, is_active: { type: "boolean" } } }, example: { catalog_id: "44444444-4444-4444-4444-444444444444", name: "Smartphones", slug: "smartphones", sort_order: 1, is_active: true } } } },
      },
    },
    "/api/v1/catalog/store-offerings": {
      get: { tags: ["Catalog"], summary: "List offerings", parameters: [limitParam, cursorParam] },
      post: { tags: ["Catalog"], summary: "Create offering", parameters: [], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["catalog_id", "type", "title"], properties: { catalog_id: { type: "string" }, type: { type: "string" }, title: { type: "string" }, description: { type: "string" }, handle: { type: "string" }, currency_code: { type: "string" }, is_tax_included: { type: "boolean" } } }, example: { catalog_id: "44444444-4444-4444-4444-444444444444", type: "PRODUCT", title: "iPhone 16", description: "128GB", handle: "iphone-16", currency_code: "PEN", is_tax_included: true } } } } },
    },
    "/api/v1/catalog/store-variants": {
      get: { tags: ["Catalog"], summary: "List variants", parameters: [limitParam, cursorParam] },
      post: { tags: ["Catalog"], summary: "Create variant", parameters: [], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["offering_id", "price_final"], properties: { offering_id: { type: "string" }, sku: { type: "string" }, barcode: { type: "string" }, price_final: { type: "number" }, tax_rate: { type: "number" } } }, example: { offering_id: "77777777-7777-7777-7777-777777777777", sku: "SKU-002", price_final: 99.9, tax_rate: 0.18 } } } } },
    },
    "/api/v1/catalog/prices": {
      get: { tags: ["Catalog"], summary: "List prices", parameters: [limitParam, cursorParam] },
      post: { tags: ["Catalog"], summary: "Create price", parameters: [], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["price_list_id", "sale_price"], properties: { price_list_id: { type: "string" }, offering_id: { type: "string" }, variant_id: { type: "string" }, list_price: { type: "number" }, sale_price: { type: "number" }, is_active: { type: "boolean" } } }, example: { price_list_id: "99999999-9999-9999-9999-999999999999", offering_id: "77777777-7777-7777-7777-777777777777", variant_id: "88888888-8888-8888-8888-888888888888", list_price: 120, sale_price: 99.9, is_active: true } } } } },
    },

    "/api/v1/customers": {
      get: { tags: ["Customers"], summary: "List customers", parameters: [limitParam, cursorParam] },
      post: { tags: ["Customers"], summary: "Create customer", parameters: [], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["phone_e164"], properties: { full_name: { type: "string" }, phone_e164: { type: "string" }, email: { type: "string" }, marketing_opt_in: { type: "boolean" } } }, example: { full_name: "John Doe", phone_e164: "+51999999999", email: "john@example.com", marketing_opt_in: true } } } } },
    },
    "/api/v1/customers/addresses": {
      post: { tags: ["Customers"], summary: "Create customer address", parameters: [], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["customer_id", "address_line1"], properties: { customer_id: { type: "string" }, label: { type: "string" }, country_code: { type: "string" }, city: { type: "string" }, district: { type: "string" }, address_line1: { type: "string" }, address_line2: { type: "string" }, reference: { type: "string" }, postal_code: { type: "string" }, is_default: { type: "boolean" } } }, example: { customer_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", label: "Casa", country_code: "PE", city: "Lima", district: "Miraflores", address_line1: "Av. Demo 123", is_default: true } } } } },
    },
    "/api/v1/tags": {
      get: { tags: ["Customers"], summary: "List tags", parameters: [limitParam, cursorParam] },
      post: { tags: ["Customers"], summary: "Create tag", parameters: [], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string" } } }, example: { name: "VIP" } } } } },
    },

    "/api/v1/whatsapp-accounts": {
      get: { tags: ["WhatsApp"], summary: "List whatsapp accounts", parameters: [limitParam, cursorParam] },
      post: { tags: ["WhatsApp"], summary: "Create whatsapp account", parameters: [], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["provider", "phone_number_id"], properties: { store_id: { type: "string" }, provider: { type: "string" }, phone_number_id: { type: "string" }, waba_id: { type: "string" }, display_phone: { type: "string" }, config: { type: "object" } } }, example: { provider: "META_CLOUD_API", phone_number_id: "123456789", waba_id: "987654321", display_phone: "+51911111111" } } } } },
    },
    "/api/v1/whatsapp-conversations": {
      get: { tags: ["WhatsApp"], summary: "List whatsapp conversations", parameters: [limitParam, cursorParam] },
    },
    "/api/v1/whatsapp-messages": {
      get: { tags: ["WhatsApp"], summary: "List whatsapp messages", parameters: [limitParam, cursorParam, { name: "conversation_id", in: "query", required: true, schema: { type: "string", format: "uuid" } }] },
      post: { tags: ["WhatsApp"], summary: "Send whatsapp message", parameters: [], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["conversation_id", "text"], properties: { conversation_id: { type: "string" }, text: { type: "string" } } }, example: { conversation_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", text: "Hola, tenemos una oferta para ti" } } } } },
    },
    "/api/v1/webhooks/meta": {
      get: {
        tags: ["WhatsApp"],
        summary: "Verify Meta webhook challenge",
        security: [],
        parameters: [
          { name: "hub.mode", in: "query", required: true, schema: { type: "string" }, example: "subscribe" },
          { name: "hub.verify_token", in: "query", required: true, schema: { type: "string" }, example: "meta-webhook-verify-token" },
          { name: "hub.challenge", in: "query", required: true, schema: { type: "string" }, example: "123456" },
        ],
      },
      post: {
        tags: ["WhatsApp"],
        summary: "Ingest Meta webhook",
        security: tenantSecurity,
        parameters: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object" },
              example: {
                entry: [
                  {
                    changes: [
                      {
                        value: {
                          metadata: { phone_number_id: "123456789" },
                          messages: [{ id: "wamid.abc", from: "+51999999999", text: { body: "hola" } }],
                        },
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    },

    "/api/v1/carts": {
      get: { tags: ["Commerce"], summary: "List carts", parameters: [limitParam, cursorParam] },
      post: { tags: ["Commerce"], summary: "Create cart", parameters: [], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["customer_id"], properties: { customer_id: { type: "string" }, price_list_id: { type: "string" } } }, example: { customer_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", price_list_id: "99999999-9999-9999-9999-999999999999" } } } } },
    },
    "/api/v1/carts/items": {
      post: { tags: ["Commerce"], summary: "Add item to cart with stock reservation", parameters: [], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["cart_id", "offering_id", "quantity", "unit_price"], properties: { cart_id: { type: "string" }, offering_id: { type: "string" }, variant_id: { type: "string" }, quantity: { type: "integer" }, unit_price: { type: "number" } } }, example: { cart_id: "dddddddd-dddd-dddd-dddd-dddddddddddd", offering_id: "77777777-7777-7777-7777-777777777777", variant_id: "88888888-8888-8888-8888-888888888888", quantity: 1, unit_price: 49.9 } } } } },
    },
    "/api/v1/orders": {
      get: { tags: ["Commerce"], summary: "List orders", parameters: [limitParam, cursorParam] },
      post: { tags: ["Commerce"], summary: "Place order from cart", parameters: [], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["cart_id"], properties: { cart_id: { type: "string" } } }, example: { cart_id: "dddddddd-dddd-dddd-dddd-dddddddddddd" } } } } },
    },
    "/api/v1/stock/reconcile-reservations": {
      post: { tags: ["Commerce"], summary: "Release expired stock reservations", parameters: [] },
    },

    "/api/v1/reports": {
      get: { tags: ["Observability"], summary: "List reports", parameters: [limitParam, cursorParam] },
    },
    "/api/v1/audit-logs": {
      get: { tags: ["Observability"], summary: "List audit logs", parameters: [limitParam, cursorParam] },
    },
    "/api/internal/jobs/outbox": {
      post: {
        tags: ["Internal"],
        summary: "Process outbox events batch",
        security: [],
        parameters: [{ name: "x-job-secret", in: "header", required: true, schema: { type: "string" }, example: "internal-job-secret" }],
      },
    },
    "/api/openapi.json": {
      get: {
        tags: ["Internal"],
        summary: "OpenAPI document",
        security: [],
      },
    },
    "/api/docs": {
      get: {
        tags: ["Internal"],
        summary: "Swagger UI",
        security: [],
      },
    },
  },
};
