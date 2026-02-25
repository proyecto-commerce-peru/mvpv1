import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/db";
import { ApiError } from "@/lib/server/errors";
import { decodeCursor, encodeCursor } from "@/lib/server/pagination";
import { parseDecimalInput } from "@/lib/server/decimal";
import { computeAvailable } from "@/lib/server/commerce/reservations";

const RESERVATION_TTL_MINUTES = 15;

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

async function getDefaultLocation(tenantId: string, tx: Prisma.TransactionClient) {
  const location = await tx.inventoryLocation.findFirst({
    where: { tenant_id: tenantId },
    orderBy: [{ is_default: "desc" }, { created_at: "asc" }],
  });

  if (!location) {
    throw new ApiError(409, "INVENTORY_LOCATION_MISSING", "No inventory location configured");
  }

  return location;
}

async function getOrCreateStockItem(
  tx: Prisma.TransactionClient,
  tenantId: string,
  offeringId: string,
  variantId?: string,
) {
  const existing = await tx.stockItem.findFirst({
    where: {
      tenant_id: tenantId,
      offering_id: offeringId,
      variant_id: variantId ?? null,
    },
  });

  if (existing) {
    return existing;
  }

  return tx.stockItem.create({
    data: {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      offering_id: offeringId,
      variant_id: variantId,
      track_stock: true,
      created_at: new Date(),
    },
  });
}

async function getOrCreateStockBalance(
  tx: Prisma.TransactionClient,
  tenantId: string,
  stockItemId: string,
  locationId: string,
) {
  const existing = await tx.stockBalance.findFirst({
    where: {
      tenant_id: tenantId,
      stock_item_id: stockItemId,
      location_id: locationId,
    },
  });

  if (existing) {
    return existing;
  }

  return tx.stockBalance.create({
    data: {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      stock_item_id: stockItemId,
      location_id: locationId,
      qty_on_hand: 0,
      qty_reserved: 0,
      updated_at: new Date(),
    },
  });
}

export async function listCarts(tenantId: string, limit: number, cursor?: string) {
  const items = await prisma.cart.findMany({
    where: {
      tenant_id: tenantId,
      ...cursorWhere(cursor),
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  return page(items, limit);
}

export async function createCart(input: {
  tenantId: string;
  customerId: string;
  priceListId?: string;
}) {
  return prisma.cart.create({
    data: {
      id: crypto.randomUUID(),
      tenant_id: input.tenantId,
      customer_id: input.customerId,
      status: "ACTIVE",
      currency_code: "PEN",
      price_list_id: input.priceListId,
      source: "WHATSAPP",
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
}

export async function addCartItem(input: {
  tenantId: string;
  cartId: string;
  offeringId: string;
  variantId?: string;
  quantity: number;
  unitPrice: unknown;
  actorUserId?: string;
}) {
  if (input.quantity <= 0) {
    throw new ApiError(422, "VALIDATION_ERROR", "quantity must be greater than zero");
  }

  const now = new Date();
  const reservationExpiresAt = new Date(now.getTime() + RESERVATION_TTL_MINUTES * 60_000);

  return prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findFirst({
      where: { id: input.cartId, tenant_id: input.tenantId, status: "ACTIVE" },
      select: { id: true },
    });

    if (!cart) {
      throw new ApiError(404, "CART_NOT_FOUND", "Cart not found");
    }

    const location = await getDefaultLocation(input.tenantId, tx);
    const stockItem = await getOrCreateStockItem(tx, input.tenantId, input.offeringId, input.variantId);
    const balance = await getOrCreateStockBalance(tx, input.tenantId, stockItem.id, location.id);

    const available = computeAvailable(balance.qty_on_hand, balance.qty_reserved);
    if (available < input.quantity) {
      throw new ApiError(409, "STOCK_NOT_AVAILABLE", "Insufficient available stock for reservation");
    }

    const item = await tx.cartItem.create({
      data: {
        id: crypto.randomUUID(),
        tenant_id: input.tenantId,
        cart_id: input.cartId,
        offering_id: input.offeringId,
        variant_id: input.variantId,
        quantity: input.quantity,
        unit_price: parseDecimalInput(input.unitPrice, "unit_price"),
        meta: {
          reservation_expires_at: reservationExpiresAt.toISOString(),
          location_id: location.id,
        } as never,
        created_at: now,
      },
    });

    await tx.stockBalance.update({
      where: { id: balance.id },
      data: {
        qty_reserved: { increment: input.quantity },
        updated_at: now,
      },
    });

    await tx.stockMovement.create({
      data: {
        id: crypto.randomUUID(),
        tenant_id: input.tenantId,
        stock_item_id: stockItem.id,
        location_id: location.id,
        movement_type: "RESERVE",
        qty: input.quantity,
        reason: "Cart reservation",
        reference_type: "CART_ITEM",
        reference_id: item.id,
        created_by_user_id: input.actorUserId,
        created_at: now,
      },
    });

    await tx.cart.update({
      where: { id: input.cartId },
      data: { updated_at: now },
    });

    return item;
  });
}

export async function releaseExpiredReservations(tenantId: string) {
  const now = new Date();
  const activeItems = await prisma.cartItem.findMany({
    where: {
      tenant_id: tenantId,
      cart: { status: "ACTIVE" },
    },
  });

  let released = 0;

  for (const item of activeItems) {
    const meta = (item.meta as { reservation_expires_at?: string; location_id?: string } | null) ?? null;
    if (!meta?.reservation_expires_at || !meta.location_id) {
      continue;
    }
    const locationId: string = meta.location_id;

    const expiresAt = new Date(meta.reservation_expires_at);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt > now) {
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const stockItem = await tx.stockItem.findFirst({
        where: {
          tenant_id: tenantId,
          offering_id: item.offering_id,
          variant_id: item.variant_id,
        },
      });

      if (!stockItem) {
        return;
      }

      const balance = await tx.stockBalance.findFirst({
        where: {
          tenant_id: tenantId,
          stock_item_id: stockItem.id,
          location_id: locationId,
        },
      });

      if (!balance || balance.qty_reserved < item.quantity) {
        return;
      }

      await tx.stockBalance.update({
        where: { id: balance.id },
        data: {
          qty_reserved: { decrement: item.quantity },
          updated_at: now,
        },
      });

      await tx.stockMovement.create({
        data: {
          id: crypto.randomUUID(),
          tenant_id: tenantId,
          stock_item_id: stockItem.id,
          location_id: locationId,
          movement_type: "RELEASE",
          qty: item.quantity,
          reason: "Reservation expired",
          reference_type: "CART_ITEM",
          reference_id: item.id,
          created_at: now,
        },
      });

      await tx.cartItem.delete({
        where: { id: item.id },
      });

      released += 1;
    });
  }

  return { released_items: released };
}

export async function listOrders(tenantId: string, limit: number, cursor?: string) {
  const items = await prisma.order.findMany({
    where: {
      tenant_id: tenantId,
      ...cursorWhere(cursor),
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  return page(items, limit);
}

export async function placeOrderFromCart(input: {
  tenantId: string;
  cartId: string;
  actorUserId?: string;
}) {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findFirst({
      where: { id: input.cartId, tenant_id: input.tenantId, status: "ACTIVE" },
      include: { CartItem: true },
    });

    if (!cart) {
      throw new ApiError(404, "CART_NOT_FOUND", "Cart not found");
    }

    if (cart.CartItem.length === 0) {
      throw new ApiError(409, "EMPTY_CART", "Cart has no items");
    }

    const subtotal = cart.CartItem.reduce((acc, item) => {
      const unit = Number(item.unit_price.toString());
      return acc + unit * item.quantity;
    }, 0);

    const order = await tx.order.create({
      data: {
        id: crypto.randomUUID(),
        tenant_id: input.tenantId,
        customer_id: cart.customer_id,
        order_number: `ORD-${Date.now()}`,
        status: "PAID",
        channel: "WHATSAPP",
        currency_code: cart.currency_code,
        price_list_id: cart.price_list_id,
        subtotal: new Prisma.Decimal(subtotal),
        discount_total: new Prisma.Decimal(0),
        tax_total: new Prisma.Decimal(0),
        shipping_total: new Prisma.Decimal(0),
        total: new Prisma.Decimal(subtotal),
        placed_at: now,
        created_by_user_id: input.actorUserId,
        metadata: {} as never,
        created_at: now,
        updated_at: now,
      },
    });

    for (const item of cart.CartItem) {
      await tx.orderItem.create({
        data: {
          id: crypto.randomUUID(),
          tenant_id: input.tenantId,
          order_id: order.id,
          offering_id: item.offering_id,
          variant_id: item.variant_id,
          type: "PRODUCT",
          title_snapshot: "Snapshot",
          sku_snapshot: null,
          unit_price: item.unit_price,
          quantity: item.quantity,
          total_price: new Prisma.Decimal(Number(item.unit_price.toString()) * item.quantity),
          tax_amount: new Prisma.Decimal(0),
          discount_amount: new Prisma.Decimal(0),
          meta: (item.meta ?? {}) as never,
          created_at: now,
        },
      });

      const stockItem = await tx.stockItem.findFirst({
        where: {
          tenant_id: input.tenantId,
          offering_id: item.offering_id,
          variant_id: item.variant_id,
        },
      });

      if (!stockItem) {
        continue;
      }

      const metaLocationId = (item.meta as { location_id?: string } | null)?.location_id;
      const fallbackLocation = await getDefaultLocation(input.tenantId, tx);
      const locationId: string = metaLocationId ?? fallbackLocation.id;

      const balance = await tx.stockBalance.findFirst({
        where: {
          tenant_id: input.tenantId,
          stock_item_id: stockItem.id,
          location_id: locationId,
        },
      });

      if (!balance || balance.qty_reserved < item.quantity || balance.qty_on_hand < item.quantity) {
        throw new ApiError(409, "STOCK_INCONSISTENT", "Reserved stock cannot be converted to sale");
      }

      await tx.stockBalance.update({
        where: { id: balance.id },
        data: {
          qty_reserved: { decrement: item.quantity },
          qty_on_hand: { decrement: item.quantity },
          updated_at: now,
        },
      });

      await tx.stockMovement.create({
        data: {
          id: crypto.randomUUID(),
          tenant_id: input.tenantId,
          stock_item_id: stockItem.id,
          location_id: locationId,
          movement_type: "SALE",
          qty: item.quantity,
          reason: "Order placed",
          reference_type: "ORDER",
          reference_id: order.id,
          created_by_user_id: input.actorUserId,
          created_at: now,
        },
      });
    }

    await tx.cart.update({
      where: { id: cart.id },
      data: {
        status: "CONVERTED",
        updated_at: now,
      },
    });

    return order;
  });
}

export async function getOrderById(tenantId: string, id: string) {
  const order = await prisma.order.findFirst({ where: { id, tenant_id: tenantId } });
  if (!order) {
    throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found");
  }
  return order;
}

export async function updateOrder(tenantId: string, id: string, input: {
  status?: string;
  notes?: string | null;
}) {
  await getOrderById(tenantId, id);
  return prisma.order.update({
    where: { id },
    data: {
      status: input.status,
      notes: input.notes === undefined ? undefined : input.notes,
      updated_at: new Date(),
    },
  });
}

export async function listOrderItems(tenantId: string, orderId: string, limit: number, cursor?: string) {
  const order = await prisma.order.findFirst({ where: { id: orderId, tenant_id: tenantId }, select: { id: true } });
  if (!order) {
    throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  const items = await prisma.orderItem.findMany({
    where: {
      tenant_id: tenantId,
      order_id: orderId,
      ...cursorWhere(cursor),
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  return page(items, limit);
}

export async function listFulfillmentsByOrder(tenantId: string, orderId: string, limit: number, cursor?: string) {
  const order = await prisma.order.findFirst({ where: { id: orderId, tenant_id: tenantId }, select: { id: true } });
  if (!order) {
    throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  const items = await prisma.fulfillment.findMany({
    where: {
      tenant_id: tenantId,
      order_id: orderId,
      ...cursorWhere(cursor),
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  return page(items, limit);
}

export async function createFulfillment(input: {
  tenantId: string;
  orderId: string;
  status?: string;
  carrier?: string;
  trackingCode?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
}) {
  const order = await prisma.order.findFirst({ where: { id: input.orderId, tenant_id: input.tenantId }, select: { id: true } });
  if (!order) {
    throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  const now = new Date();
  return prisma.fulfillment.create({
    data: {
      id: crypto.randomUUID(),
      tenant_id: input.tenantId,
      order_id: input.orderId,
      status: input.status ?? "PENDING",
      carrier: input.carrier,
      tracking_code: input.trackingCode,
      shipped_at: input.shippedAt,
      delivered_at: input.deliveredAt,
      created_at: now,
      updated_at: now,
    },
  });
}

export async function updateFulfillment(tenantId: string, id: string, input: {
  status?: string;
  carrier?: string | null;
  trackingCode?: string | null;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
}) {
  const existing = await prisma.fulfillment.findFirst({ where: { id, tenant_id: tenantId }, select: { id: true } });
  if (!existing) {
    throw new ApiError(404, "FULFILLMENT_NOT_FOUND", "Fulfillment not found");
  }

  return prisma.fulfillment.update({
    where: { id },
    data: {
      status: input.status,
      carrier: input.carrier === undefined ? undefined : input.carrier,
      tracking_code: input.trackingCode === undefined ? undefined : input.trackingCode,
      shipped_at: input.shippedAt === undefined ? undefined : input.shippedAt,
      delivered_at: input.deliveredAt === undefined ? undefined : input.deliveredAt,
      updated_at: new Date(),
    },
  });
}
