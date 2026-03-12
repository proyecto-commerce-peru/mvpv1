"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Loader2, Save, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

type ImageItem = {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
};

type Category = {
  id: string;
  name: string;
};

type PriceInfo = {
  id: string;
  listPrice: number | null;
  salePrice: number | null;
  isActive: boolean;
};

export default function ProductEditorClient({
  product,
  images,
  categories,
  selectedCategoryIds,
  price,
}: {
  product: Product;
  images: ImageItem[];
  categories: Category[];
  selectedCategoryIds: string[];
  price: PriceInfo | null;
}) {
  const [details, setDetails] = React.useState({
    title: product.title,
    handle: product.handle ?? "",
    status: product.status ?? "ACTIVE",
    description: product.description ?? "",
    coverImageUrl: product.coverImageUrl ?? "",
  });
  const [priceState, setPriceState] = React.useState({
    listPrice: price?.listPrice?.toString() ?? "",
    salePrice: price?.salePrice?.toString() ?? "",
  });
  const [imageList, setImageList] = React.useState<ImageItem[]>(images);
  const [newImageUrl, setNewImageUrl] = React.useState("");
  const [newImageAlt, setNewImageAlt] = React.useState("");
  const [categoryIds, setCategoryIds] = React.useState<string[]>(selectedCategoryIds);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const toggleCategory = (id: string) => {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const saveDetails = async () => {
    setSaving(true);
    setMessage(null);
    const response = await fetch(`/api/v1/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: details.title,
        handle: details.handle,
        status: details.status,
        description: details.description,
        coverImageUrl: details.coverImageUrl,
      }),
    });
    setSaving(false);
    setMessage(response.ok ? "Details saved." : "Failed to save details.");
  };

  const savePrice = async () => {
    setSaving(true);
    setMessage(null);
    const response = await fetch(`/api/v1/admin/products/${product.id}/prices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listPrice: priceState.listPrice,
        salePrice: priceState.salePrice,
      }),
    });
    setSaving(false);
    setMessage(response.ok ? "Price saved." : "Failed to save price.");
  };

  const addImage = async () => {
    if (!newImageUrl) return;
    setSaving(true);
    setMessage(null);
    const response = await fetch(`/api/v1/admin/products/${product.id}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: newImageUrl,
        altText: newImageAlt || null,
        sortOrder: imageList.length,
      }),
    });
    setSaving(false);
    if (response.ok) {
      const created = (await response.json()) as ImageItem;
      setImageList((prev) => [...prev, created]);
      setNewImageUrl("");
      setNewImageAlt("");
      setMessage("Image added.");
    } else {
      setMessage("Failed to add image.");
    }
  };

  const uploadImage = async (file: File) => {
    setSaving(true);
    setMessage(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("offeringId", product.id);
    formData.append("altText", newImageAlt);
    const response = await fetch("/api/v1/admin/uploads", {
      method: "POST",
      body: formData,
    });
    setSaving(false);
    if (response.ok) {
      const created = (await response.json()) as ImageItem;
      setImageList((prev) => [...prev, created]);
      setMessage("Image uploaded.");
    } else {
      setMessage("Failed to upload image.");
    }
  };

  const updateImage = async (image: ImageItem, sortOrder: number, altText: string) => {
    const response = await fetch(
      `/api/v1/admin/products/${product.id}/images/${image.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder, altText }),
      }
    );
    if (response.ok) {
      setImageList((prev) =>
        prev.map((item) =>
          item.id === image.id
            ? { ...item, sortOrder, altText }
            : item
        )
      );
    }
  };

  const deleteImage = async (imageId: string) => {
    const response = await fetch(
      `/api/v1/admin/products/${product.id}/images/${imageId}`,
      { method: "DELETE" }
    );
    if (response.ok) {
      setImageList((prev) => prev.filter((item) => item.id !== imageId));
    }
  };

  const saveCategories = async () => {
    setSaving(true);
    setMessage(null);
    const response = await fetch(
      `/api/v1/admin/products/${product.id}/categories`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryIds }),
      }
    );
    setSaving(false);
    setMessage(response.ok ? "Categories saved." : "Failed to save categories.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/products">
              <ChevronLeft className="size-4" />
              Back
            </Link>
          </Button>
          <div>
            <h2 className="text-xl font-semibold">{product.title}</h2>
            <p className="text-sm text-muted-foreground">Edit product details</p>
          </div>
        </div>
        {message ? (
          <p className="text-xs text-muted-foreground">{message}</p>
        ) : null}
      </div>

      <section className="rounded-sm border border-border bg-background p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Details</h3>
          <Button onClick={saveDetails} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save Details
          </Button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={details.title}
              onChange={(event) =>
                setDetails((prev) => ({ ...prev, title: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="handle">Handle</Label>
            <Input
              id="handle"
              value={details.handle}
              onChange={(event) =>
                setDetails((prev) => ({ ...prev, handle: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="h-9 rounded-sm border border-border bg-background px-3 text-sm"
              value={details.status}
              onChange={(event) =>
                setDetails((prev) => ({ ...prev, status: event.target.value }))
              }
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cover">Cover image URL</Label>
            <Input
              id="cover"
              value={details.coverImageUrl}
              onChange={(event) =>
                setDetails((prev) => ({
                  ...prev,
                  coverImageUrl: event.target.value,
                }))
              }
            />
          </div>
          <div className="md:col-span-2 grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={details.description}
              onChange={(event) =>
                setDetails((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
            />
          </div>
        </div>
      </section>

      <section className="rounded-sm border border-border bg-background p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Pricing</h3>
          <Button onClick={savePrice} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save Prices
          </Button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="listPrice">List price</Label>
            <Input
              id="listPrice"
              value={priceState.listPrice}
              onChange={(event) =>
                setPriceState((prev) => ({ ...prev, listPrice: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="salePrice">Sale price</Label>
            <Input
              id="salePrice"
              value={priceState.salePrice}
              onChange={(event) =>
                setPriceState((prev) => ({ ...prev, salePrice: event.target.value }))
              }
            />
          </div>
        </div>
      </section>

      <section className="rounded-sm border border-border bg-background p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Images</h3>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 rounded-sm border border-border px-3 py-2 text-xs font-medium text-muted-foreground">
              <UploadCloud className="size-4" />
              Upload
              <input
                type="file"
                className="hidden"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void uploadImage(file);
                  }
                }}
              />
            </label>
          </div>
        </div>
        <div className="mt-4 grid gap-3">
          {imageList.map((image) => (
            <div
              key={image.id}
              className="flex flex-wrap items-center gap-3 rounded-sm border border-border p-3"
            >
              <div className="relative h-12 w-12 overflow-hidden rounded-sm border border-border bg-muted">
                <Image
                  src={image.url}
                  alt={image.altText ?? ""}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <p className="text-xs text-muted-foreground">{image.url}</p>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <Input
                    value={image.altText ?? ""}
                    placeholder="Alt text"
                    onChange={(event) =>
                      updateImage(image, image.sortOrder, event.target.value)
                    }
                  />
                  <Input
                    value={image.sortOrder.toString()}
                    inputMode="numeric"
                    onChange={(event) => {
                      const next = Number.parseInt(event.target.value, 10) || 0;
                      updateImage(image, next, image.altText ?? "");
                    }}
                  />
                </div>
              </div>
              <Button variant="destructive" size="sm" onClick={() => deleteImage(image.id)}>
                Remove
              </Button>
            </div>
          ))}
          <div className="grid gap-2 md:grid-cols-[2fr_1fr_auto]">
            <Input
              placeholder="Image URL"
              value={newImageUrl}
              onChange={(event) => setNewImageUrl(event.target.value)}
            />
            <Input
              placeholder="Alt text"
              value={newImageAlt}
              onChange={(event) => setNewImageAlt(event.target.value)}
            />
            <Button onClick={addImage} disabled={saving || !newImageUrl}>
              Add Image
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-sm border border-border bg-background p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Categories</h3>
          <Button onClick={saveCategories} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save Categories
          </Button>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {categories.map((category) => (
            <label
              key={category.id}
              className={cn(
                "flex items-center gap-2 rounded-sm border border-border px-3 py-2 text-sm",
                categoryIds.includes(category.id) ? "bg-muted/40" : "bg-background"
              )}
            >
              <input
                type="checkbox"
                checked={categoryIds.includes(category.id)}
                onChange={() => toggleCategory(category.id)}
              />
              {category.name}
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
