import { z } from "zod";

const trimValue = (value: unknown) =>
  typeof value === "string" ? value.trim() : value;

const emptyToUndefined = (value: unknown) => {
  const trimmed = trimValue(value);
  if (trimmed === "" || trimmed === null || trimmed === undefined) {
    return undefined;
  }
  return trimmed;
};

const emptyToNull = (value: unknown) => {
  const trimmed = trimValue(value);
  if (trimmed === "" || trimmed === undefined) {
    return null;
  }
  return trimmed;
};

const upperValue = (value: unknown) =>
  typeof value === "string" ? value.trim().toUpperCase() : value;

const priceSchema = z.preprocess(
  (value) => {
    if (value === null || value === undefined || value === "") {
      return undefined;
    }
    if (typeof value === "number") {
      return value;
    }
    const parsed = Number.parseFloat(String(value));
    return Number.isNaN(parsed) ? value : parsed;
  },
  z
    .number()
    .min(0, "Price must be >= 0.")
);

export const productStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const productBaseSchema = z.object({
  title: z.preprocess(
    emptyToUndefined,
    z.string().min(1, "Title is required.").max(180, "Title is too long.")
  ),
  handle: z.preprocess(
    emptyToUndefined,
    z.string().min(1, "Handle is required.").max(180, "Handle is too long.")
  ),
  status: z.preprocess(
    upperValue,
    productStatusSchema
  ).default("ACTIVE"),
  description: z.preprocess(
    emptyToNull,
    z.string().max(5000, "Description is too long.").nullable()
  ).optional(),
  coverImageUrl: z.preprocess(
    emptyToNull,
    z
      .string()
      .url("Cover image URL must be a valid URL.")
      .max(2000, "Cover image URL is too long.")
      .nullable()
  ).optional(),
  currencyCode: z.preprocess(
    emptyToUndefined,
    z.string().length(3, "Currency code must be 3 letters.")
  ).default("PEN"),
  price: priceSchema,
  sku: z.preprocess(
    emptyToNull,
    z.string().max(120, "SKU is too long.").nullable()
  ).optional(),
});

export const productCreateSchema = productBaseSchema;
export const productUpdateSchema = productBaseSchema.partial();

export const productDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: productStatusSchema,
  handle: z.string().nullable(),
  coverImageUrl: z.string().nullable(),
  currencyCode: z.string(),
  price: z.number().nullable(),
  sku: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type ProductDto = z.infer<typeof productDtoSchema>;

export function formatZodErrors(error: z.ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || "root",
    message: issue.message,
  }));
}

const moneySchema = z.preprocess(
  (value) => {
    if (value === null || value === undefined || value === "") {
      return undefined;
    }
    if (typeof value === "number") {
      return value;
    }
    const parsed = Number.parseFloat(String(value));
    return Number.isNaN(parsed) ? value : parsed;
  },
  z.number({ message: "Amount must be a number." }).min(0, "Amount must be >= 0.")
);

export const priceUpsertSchema = z.object({
  listPrice: moneySchema.optional(),
  salePrice: moneySchema,
  isActive: z.boolean().optional(),
});

export const imageCreateSchema = z.object({
  url: z.string().url("Image URL must be valid."),
  altText: z.string().max(160, "Alt text is too long.").optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

export const imageUpdateSchema = z.object({
  altText: z.string().max(160, "Alt text is too long.").optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

export const categoriesReplaceSchema = z.object({
  categoryIds: z.array(z.string().uuid()).default([]),
});

const intSchema = z.preprocess(
  (value) => {
    if (value === null || value === undefined || value === "") {
      return undefined;
    }
    if (typeof value === "number") {
      return value;
    }
    const parsed = Number.parseInt(String(value), 10);
    return Number.isNaN(parsed) ? value : parsed;
  },
  z.number().int().min(0, "Sort order must be >= 0.")
);

export const categoryBaseSchema = z.object({
  name: z.preprocess(
    emptyToUndefined,
    z.string().min(1, "Name is required.").max(140, "Name is too long.")
  ),
  slug: z.preprocess(
    emptyToUndefined,
    z.string().min(1, "Slug is required.").max(160, "Slug is too long.")
  ).optional(),
  sortOrder: intSchema.optional(),
  isActive: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.boolean()
  ).optional(),
});

export const categoryCreateSchema = categoryBaseSchema;
export const categoryUpdateSchema = categoryBaseSchema.partial();
