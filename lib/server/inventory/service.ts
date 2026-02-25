import { prisma } from "@/lib/server/db";
import { ApiError } from "@/lib/server/errors";
import { decodeCursor, encodeCursor } from "@/lib/server/pagination";

function cursorWhere(cursor?: string) {
  if (!cursor) {
    return {};
  }

  const payload = decodeCursor(cursor);
  return {
    OR: [
      { created_at: { lt: new Date(payload.created_at) } },
      {
        AND: [{ created_at: new Date(payload.created_at) }, { id: { lt: payload.id } }],
      },
    ],
  };
}

function page<T extends { id: string; created_at: Date }>(items: T[], limit: number) {
  const hasMore = items.length > limit;
  const rows = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore
    ? encodeCursor({
        id: rows[rows.length - 1].id,
        created_at: rows[rows.length - 1].created_at.toISOString(),
      })
    : null;

  return {
    rows,
    meta: {
      has_more: hasMore,
      next_cursor: nextCursor,
      limit,
    },
  };
}

function asInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new ApiError(422, "VALIDATION_ERROR", `${field} must be an integer`);
  }
  return value;
}

export async function listLocations(tenantId: string, limit: number, cursor?: string) {
  const items = await prisma.inventoryLocation.findMany({
    where: {
      tenant_id: tenantId,
      ...cursorWhere(cursor),
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  return page(items, limit);
}

export async function createLocation(input: {
  tenantId: string;
  storeId?: string;
  name: string;
  code?: string;
  isDefault?: boolean;
}) {
  const now = new Date();
  return prisma.inventoryLocation.create({
    data: {
      id: crypto.randomUUID(),
      tenant_id: input.tenantId,
      store_id: input.storeId,
      name: input.name,
      code: input.code,
      is_default: input.isDefault ?? false,
      created_at: now,
      updated_at: now,
    },
  });
}

export async function updateLocation(tenantId: string, id: string, input: {
  name?: string;
  code?: string | null;
  isDefault?: boolean;
}) {
  const existing = await prisma.inventoryLocation.findFirst({ where: { id, tenant_id: tenantId }, select: { id: true } });
  if (!existing) {
    throw new ApiError(404, "INVENTORY_LOCATION_NOT_FOUND", "Inventory location not found");
  }

  return prisma.inventoryLocation.update({
    where: { id },
    data: {
      name: input.name,
      code: input.code === undefined ? undefined : input.code,
      is_default: input.isDefault,
      updated_at: new Date(),
    },
  });
}

export async function listStockItems(tenantId: string, limit: number, cursor?: string) {
  const items = await prisma.stockItem.findMany({
    where: {
      tenant_id: tenantId,
      ...cursorWhere(cursor),
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  return page(items, limit);
}

export async function createStockItem(input: {
  tenantId: string;
  offeringId?: string;
  variantId?: string;
  trackStock?: boolean;
}) {
  return prisma.stockItem.create({
    data: {
      id: crypto.randomUUID(),
      tenant_id: input.tenantId,
      offering_id: input.offeringId,
      variant_id: input.variantId,
      track_stock: input.trackStock ?? true,
      created_at: new Date(),
    },
  });
}

export async function getStockItemById(tenantId: string, id: string) {
  const item = await prisma.stockItem.findFirst({ where: { id, tenant_id: tenantId } });
  if (!item) {
    throw new ApiError(404, "STOCK_ITEM_NOT_FOUND", "Stock item not found");
  }
  return item;
}

export async function updateStockItem(tenantId: string, id: string, input: { trackStock?: boolean }) {
  await getStockItemById(tenantId, id);
  return prisma.stockItem.update({
    where: { id },
    data: {
      track_stock: input.trackStock,
    },
  });
}

export async function listStockBalances(tenantId: string, limit: number, cursor?: string) {
  const whereCursor = cursor ? (() => {
    const payload = decodeCursor(cursor);
    return {
      OR: [
        { updated_at: { lt: new Date(payload.created_at) } },
        {
          AND: [{ updated_at: new Date(payload.created_at) }, { id: { lt: payload.id } }],
        },
      ],
    };
  })() : {};

  const items = await prisma.stockBalance.findMany({
    where: {
      tenant_id: tenantId,
      ...whereCursor,
    },
    orderBy: [{ updated_at: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  const hasMore = items.length > limit;
  const rows = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore
    ? encodeCursor({
        id: rows[rows.length - 1].id,
        created_at: rows[rows.length - 1].updated_at.toISOString(),
      })
    : null;

  return {
    rows,
    meta: {
      has_more: hasMore,
      next_cursor: nextCursor,
      limit,
    },
  };
}

export async function listStockMovements(tenantId: string, limit: number, cursor?: string) {
  const items = await prisma.stockMovement.findMany({
    where: {
      tenant_id: tenantId,
      ...cursorWhere(cursor),
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  return page(items, limit);
}

export async function createStockMovement(input: {
  tenantId: string;
  stockItemId: string;
  locationId: string;
  movementType: string;
  qty: unknown;
  reason?: string;
  referenceType?: string;
  referenceId?: string;
  createdByUserId?: string;
}) {
  const qty = asInteger(input.qty, "qty");
  if (qty === 0) {
    throw new ApiError(422, "VALIDATION_ERROR", "qty must be non-zero");
  }

  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const stockItem = await tx.stockItem.findFirst({ where: { id: input.stockItemId, tenant_id: input.tenantId } });
    if (!stockItem) {
      throw new ApiError(404, "STOCK_ITEM_NOT_FOUND", "Stock item not found");
    }

    const location = await tx.inventoryLocation.findFirst({ where: { id: input.locationId, tenant_id: input.tenantId } });
    if (!location) {
      throw new ApiError(404, "INVENTORY_LOCATION_NOT_FOUND", "Inventory location not found");
    }

    const balance =
      (await tx.stockBalance.findFirst({
        where: {
          tenant_id: input.tenantId,
          stock_item_id: input.stockItemId,
          location_id: input.locationId,
        },
      })) ??
      (await tx.stockBalance.create({
        data: {
          id: crypto.randomUUID(),
          tenant_id: input.tenantId,
          stock_item_id: input.stockItemId,
          location_id: input.locationId,
          qty_on_hand: 0,
          qty_reserved: 0,
          updated_at: now,
        },
      }));

    const movementType = input.movementType.toUpperCase();
    const next = {
      qty_on_hand: balance.qty_on_hand,
      qty_reserved: balance.qty_reserved,
    };

    if (movementType === "IN") {
      next.qty_on_hand += qty;
    } else if (movementType === "OUT") {
      if (next.qty_on_hand < qty) {
        throw new ApiError(409, "STOCK_NOT_AVAILABLE", "Insufficient stock on hand");
      }
      next.qty_on_hand -= qty;
    } else if (movementType === "RESERVE") {
      if (next.qty_on_hand - next.qty_reserved < qty) {
        throw new ApiError(409, "STOCK_NOT_AVAILABLE", "Insufficient stock available for reservation");
      }
      next.qty_reserved += qty;
    } else if (movementType === "RELEASE") {
      if (next.qty_reserved < qty) {
        throw new ApiError(409, "STOCK_RESERVED_NOT_AVAILABLE", "Insufficient reserved stock");
      }
      next.qty_reserved -= qty;
    } else if (movementType === "SALE") {
      if (next.qty_on_hand < qty) {
        throw new ApiError(409, "STOCK_NOT_AVAILABLE", "Insufficient stock on hand");
      }
      if (next.qty_reserved >= qty) {
        next.qty_reserved -= qty;
      }
      next.qty_on_hand -= qty;
    } else if (movementType === "ADJUSTMENT") {
      next.qty_on_hand += qty;
    } else {
      throw new ApiError(422, "VALIDATION_ERROR", "movement_type is not supported");
    }

    if (next.qty_on_hand < 0 || next.qty_reserved < 0) {
      throw new ApiError(409, "STOCK_NEGATIVE", "Stock balances cannot become negative");
    }

    await tx.stockBalance.update({
      where: { id: balance.id },
      data: {
        qty_on_hand: next.qty_on_hand,
        qty_reserved: next.qty_reserved,
        updated_at: now,
      },
    });

    return tx.stockMovement.create({
      data: {
        id: crypto.randomUUID(),
        tenant_id: input.tenantId,
        stock_item_id: input.stockItemId,
        location_id: input.locationId,
        movement_type: movementType,
        qty,
        reason: input.reason,
        reference_type: input.referenceType,
        reference_id: input.referenceId,
        created_by_user_id: input.createdByUserId,
        created_at: now,
      },
    });
  });
}