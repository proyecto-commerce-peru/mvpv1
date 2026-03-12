"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  formatZodErrors,
  productCreateSchema,
  productUpdateSchema,
  type ProductCreateInput,
  type ProductUpdateInput,
} from "@/lib/schemas/products";
import { cn } from "@/lib/utils";

type Product = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  handle: string | null;
  coverImageUrl: string | null;
  currencyCode: string;
  price: number | null;
  sku: string | null;
  createdAt: string;
  updatedAt: string;
};

type ProductFormState = {
  title: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  handle: string;
  coverImageUrl: string;
  currencyCode: string;
  price: string;
  sku: string;
};

type ApiError = {
  error: string;
  message: string;
  details?: { errors?: Array<{ field: string; message: string }> };
};

const emptyForm: ProductFormState = {
  title: "",
  description: "",
  status: "ACTIVE",
  handle: "",
  coverImageUrl: "",
  currencyCode: "PEN",
  price: "",
  sku: "",
};

function formatMoney(value: number | null, currencyCode: string) {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(value);
}

async function fetchProducts(): Promise<Product[]> {
  const response = await fetch("/api/v1/admin/products", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch products.");
  }
  const data = (await response.json()) as { items: Product[] };
  return data.items;
}

async function createProduct(payload: Record<string, unknown>): Promise<Product> {
  const response = await fetch("/api/v1/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiError;
    throw error;
  }

  return (await response.json()) as Product;
}

async function updateProduct(
  id: string,
  payload: Record<string, unknown>
): Promise<Product> {
  const response = await fetch(`/api/v1/admin/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiError;
    throw error;
  }

  return (await response.json()) as Product;
}

async function deleteProduct(id: string): Promise<void> {
  const response = await fetch(`/api/v1/admin/products/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiError;
    throw error;
  }
}

function toFormState(product: Product): ProductFormState {
  return {
    title: product.title,
    description: product.description ?? "",
    status: product.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    handle: product.handle ?? "",
    coverImageUrl: product.coverImageUrl ?? "",
    currencyCode: product.currencyCode ?? "PEN",
    price: product.price !== null ? String(product.price) : "",
    sku: product.sku ?? "",
  };
}

function buildPayload(state: ProductFormState) {
  return {
    title: state.title.trim(),
    description: state.description.trim() || null,
    status: state.status,
    handle: state.handle.trim(),
    coverImageUrl: state.coverImageUrl.trim() || null,
    currencyCode: state.currencyCode.trim() || "PEN",
    price: state.price,
    sku: state.sku.trim() || null,
  };
}

function toFieldErrors(error: unknown) {
  if (error && typeof error === "object" && "issues" in error) {
    return formatZodErrors(error as Parameters<typeof formatZodErrors>[0]).reduce(
      (acc, issue) => {
        acc[issue.field] = issue.message;
        return acc;
      },
      {} as Record<string, string>
    );
  }
  return {};
}

export default function ProductsClient({
  initialProducts,
}: {
  initialProducts: Product[];
}) {
  const [products, setProducts] = React.useState<Product[]>(initialProducts);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<"create" | "edit">("create");
  const [activeProductId, setActiveProductId] = React.useState<string | null>(null);
  const [formState, setFormState] = React.useState<ProductFormState>(emptyForm);
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
  const [formMessage, setFormMessage] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [deleteTarget, setDeleteTarget] = React.useState<Product | null>(null);
  const [deletePending, setDeletePending] = React.useState(false);

  const productsCountLabel = `${products.length} product${products.length === 1 ? "" : "s"}`;

  const resetForm = React.useCallback(() => {
    setFormState(emptyForm);
    setFormErrors({});
    setFormMessage(null);
    setActiveProductId(null);
  }, []);

  const openCreate = React.useCallback(() => {
    setDialogMode("create");
    resetForm();
    setDialogOpen(true);
  }, [resetForm]);

  const openEdit = React.useCallback(
    (product: Product) => {
      setDialogMode("edit");
      setActiveProductId(product.id);
      setFormState(toFormState(product));
      setFormErrors({});
      setFormMessage(null);
      setDialogOpen(true);
    },
    []
  );

  const refreshProducts = React.useCallback(async () => {
    const next = await fetchProducts();
    setProducts(next);
  }, []);

  const handleSubmit = React.useCallback(async () => {
    setFormErrors({});
    setFormMessage(null);
    const payload = buildPayload(formState);
    const schema =
      dialogMode === "create" ? productCreateSchema : productUpdateSchema;
    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      setFormErrors(toFieldErrors(parsed.error));
      setFormMessage("Fix the highlighted fields.");
      return;
    }

    try {
      if (dialogMode === "create") {
        const created = await createProduct(parsed.data as ProductCreateInput);
        setProducts((prev) => [created, ...prev]);
      } else if (activeProductId) {
        const updated = await updateProduct(
          activeProductId,
          parsed.data as ProductUpdateInput
        );
        setProducts((prev) =>
          [updated, ...prev.filter((item) => item.id !== updated.id)].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
        );
      }

      setDialogOpen(false);
      resetForm();
      startTransition(() => {
        void refreshProducts();
      });
    } catch (error) {
      const apiError = error as ApiError;
      const nextErrors: Record<string, string> = {};
      apiError?.details?.errors?.forEach((item) => {
        nextErrors[item.field] = item.message;
      });
      setFormErrors(nextErrors);
      setFormMessage(apiError.message ?? "Something went wrong.");
    }
  }, [activeProductId, dialogMode, formState, refreshProducts, resetForm]);

  const confirmDelete = React.useCallback((product: Product) => {
    setDeleteTarget(product);
  }, []);

  const handleDelete = React.useCallback(async () => {
    if (!deleteTarget) return;
    setDeletePending(true);
    try {
      await deleteProduct(deleteTarget.id);
      setProducts((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      const apiError = error as ApiError;
      setFormMessage(apiError.message ?? "Unable to delete product.");
    } finally {
      setDeletePending(false);
    }
  }, [deleteTarget]);

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-border bg-background p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Products
          </p>
          <h2 className="text-2xl font-semibold">Product catalog</h2>
          <p className="text-sm text-muted-foreground">{productsCountLabel}</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="size-4" />
          New product
        </Button>
      </section>

      <section className="space-y-3 rounded-sm border border-border bg-background p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No products yet. Create your first listing.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {product.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {product.handle ?? "No handle"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                        product.status === "ACTIVE"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-border bg-muted text-muted-foreground"
                      )}
                    >
                      <Check className="size-3" />
                      {product.status}
                    </span>
                  </TableCell>
                  <TableCell>{formatMoney(product.price, product.currencyCode)}</TableCell>
                  <TableCell>{product.sku ?? "—"}</TableCell>
                  <TableCell>
                    {new Date(product.updatedAt).toLocaleDateString("es-PE", {
                      dateStyle: "medium",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => openEdit(product)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => confirmDelete(product)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {formMessage ? (
          <p className="rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {formMessage}
          </p>
        ) : null}
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create" ? "Create product" : "Edit product"}
            </DialogTitle>
            <DialogDescription>
              Keep handles short and clear so they read well in URLs.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formState.title}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, title: event.target.value }))
                }
              />
              {formErrors.title ? (
                <p className="text-xs text-destructive">{formErrors.title}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="handle">Handle</Label>
              <Input
                id="handle"
                value={formState.handle}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, handle: event.target.value }))
                }
              />
              {formErrors.handle ? (
                <p className="text-xs text-destructive">{formErrors.handle}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                inputMode="decimal"
                value={formState.price}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, price: event.target.value }))
                }
              />
              {formErrors.price ? (
                <p className="text-xs text-destructive">{formErrors.price}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formState.sku}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, sku: event.target.value }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formState.status}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    status: event.target.value as "ACTIVE" | "INACTIVE",
                  }))
                }
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formState.description}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="coverImageUrl">Cover image URL</Label>
              <Input
                id="coverImageUrl"
                value={formState.coverImageUrl}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    coverImageUrl: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button onClick={() => startTransition(() => void handleSubmit())} disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {pending ? "Saving" : "Save product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete product</DialogTitle>
            <DialogDescription>
              This will archive the product and remove it from the list.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">{deleteTarget?.title}</p>
            <p className="text-xs text-muted-foreground">{deleteTarget?.handle}</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deletePending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deletePending}
            >
              {deletePending ? <Loader2 className="size-4 animate-spin" /> : null}
              {deletePending ? "Deleting" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
