"use client";

import * as React from "react";
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
import {
  categoryCreateSchema,
  categoryUpdateSchema,
  formatZodErrors,
} from "@/lib/schemas/products";
import { cn } from "@/lib/utils";

type Category = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type CategoryFormState = {
  name: string;
  slug: string;
  sortOrder: string;
  isActive: boolean;
};

type ApiError = {
  error: string;
  message: string;
  details?: { errors?: Array<{ field: string; message: string }> };
};

const emptyForm: CategoryFormState = {
  name: "",
  slug: "",
  sortOrder: "0",
  isActive: true,
};

async function fetchCategories(): Promise<Category[]> {
  const response = await fetch("/api/v1/admin/categories", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch categories.");
  }
  const data = (await response.json()) as { items: Category[] };
  return data.items;
}

async function createCategory(payload: Record<string, unknown>): Promise<Category> {
  const response = await fetch("/api/v1/admin/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiError;
    throw error;
  }

  return (await response.json()) as Category;
}

async function updateCategory(
  id: string,
  payload: Record<string, unknown>
): Promise<Category> {
  const response = await fetch(`/api/v1/admin/categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiError;
    throw error;
  }

  return (await response.json()) as Category;
}

async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`/api/v1/admin/categories/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiError;
    throw error;
  }
}

function toFormState(category: Category): CategoryFormState {
  return {
    name: category.name,
    slug: category.slug,
    sortOrder: String(category.sortOrder),
    isActive: category.isActive,
  };
}

function buildPayload(state: CategoryFormState) {
  return {
    name: state.name.trim(),
    slug: state.slug.trim() || undefined,
    sortOrder: state.sortOrder,
    isActive: state.isActive,
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

export default function CategoriesClient({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const [categories, setCategories] = React.useState<Category[]>(initialCategories);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<"create" | "edit">("create");
  const [activeCategoryId, setActiveCategoryId] = React.useState<string | null>(
    null
  );
  const [formState, setFormState] = React.useState<CategoryFormState>(emptyForm);
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
  const [formMessage, setFormMessage] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [deleteTarget, setDeleteTarget] = React.useState<Category | null>(null);
  const [deletePending, setDeletePending] = React.useState(false);

  const categoriesCountLabel = `${categories.length} categor${
    categories.length === 1 ? "y" : "ies"
  }`;

  const resetForm = React.useCallback(() => {
    setFormState(emptyForm);
    setFormErrors({});
    setFormMessage(null);
    setActiveCategoryId(null);
  }, []);

  const openCreate = React.useCallback(() => {
    setDialogMode("create");
    resetForm();
    setDialogOpen(true);
  }, [resetForm]);

  const openEdit = React.useCallback((category: Category) => {
    setDialogMode("edit");
    setActiveCategoryId(category.id);
    setFormState(toFormState(category));
    setFormErrors({});
    setFormMessage(null);
    setDialogOpen(true);
  }, []);

  const refreshCategories = React.useCallback(async () => {
    const next = await fetchCategories();
    setCategories(next);
  }, []);

  const handleSubmit = React.useCallback(async () => {
    setFormErrors({});
    setFormMessage(null);
    const payload = buildPayload(formState);
    const schema =
      dialogMode === "create" ? categoryCreateSchema : categoryUpdateSchema;
    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      setFormErrors(toFieldErrors(parsed.error));
      setFormMessage("Fix the highlighted fields.");
      return;
    }

    try {
      if (dialogMode === "create") {
        const created = await createCategory(parsed.data);
        setCategories((prev) => [created, ...prev]);
      } else if (activeCategoryId) {
        const updated = await updateCategory(activeCategoryId, parsed.data);
        setCategories((prev) =>
          [updated, ...prev.filter((item) => item.id !== updated.id)].sort(
            (a, b) => a.sortOrder - b.sortOrder
          )
        );
      }

      setDialogOpen(false);
      resetForm();
      startTransition(() => {
        void refreshCategories();
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
  }, [activeCategoryId, dialogMode, formState, refreshCategories, resetForm]);

  const confirmDelete = React.useCallback((category: Category) => {
    setDeleteTarget(category);
  }, []);

  const handleDelete = React.useCallback(async () => {
    if (!deleteTarget) return;
    setDeletePending(true);
    try {
      await deleteCategory(deleteTarget.id);
      setCategories((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      const apiError = error as ApiError;
      setFormMessage(apiError.message ?? "Unable to delete category.");
    } finally {
      setDeletePending(false);
    }
  }, [deleteTarget]);

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-border bg-background p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Categories
          </p>
          <h2 className="text-2xl font-semibold">Product categories</h2>
          <p className="text-sm text-muted-foreground">{categoriesCountLabel}</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="size-4" />
          New category
        </Button>
      </section>

      <section className="space-y-3 rounded-sm border border-border bg-background p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sort order</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No categories yet. Create your first category.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{category.name}</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {category.slug}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                        category.isActive
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-border bg-muted text-muted-foreground"
                      )}
                    >
                      <Check className="size-3" />
                      {category.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </TableCell>
                  <TableCell>{category.sortOrder}</TableCell>
                  <TableCell>
                    {new Date(category.updatedAt).toLocaleDateString("es-PE", {
                      dateStyle: "medium",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => openEdit(category)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => confirmDelete(category)}
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
              {dialogMode === "create" ? "Create category" : "Edit category"}
            </DialogTitle>
            <DialogDescription>
              Keep slugs short and readable for clean URLs.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Belts"
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, name: event.target.value }))
                }
              />
              {formErrors.name ? (
                <p className="text-xs text-destructive">{formErrors.name}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="belts"
                value={formState.slug}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, slug: event.target.value }))
                }
              />
              {formErrors.slug ? (
                <p className="text-xs text-destructive">{formErrors.slug}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sortOrder">Sort order</Label>
              <Input
                id="sortOrder"
                inputMode="numeric"
                placeholder="0"
                value={formState.sortOrder}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    sortOrder: event.target.value,
                  }))
                }
              />
              {formErrors.sortOrder ? (
                <p className="text-xs text-destructive">{formErrors.sortOrder}</p>
              ) : null}
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={formState.isActive}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    isActive: event.target.checked,
                  }))
                }
              />
              Active category
            </label>
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
              {pending ? "Saving" : "Save category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete category</DialogTitle>
            <DialogDescription>
              This will permanently remove the category.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-sm border border-border bg-muted/40 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">{deleteTarget?.name}</p>
            <p className="text-xs text-muted-foreground">{deleteTarget?.slug}</p>
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
