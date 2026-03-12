import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-sm border border-border bg-background p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Admin overview
        </p>
        <h2 className="mt-2 text-3xl font-semibold leading-tight">
          Build a clean, high-converting catalog with reliable product data.
        </h2>
        <p className="mt-3 text-base text-muted-foreground">
          Use the products workspace to curate listings, set pricing, and keep
          your storefront consistent. This v1 console focuses on speed and
          clarity.
        </p>
        <div className="mt-6 flex items-center gap-4">
          <Button asChild>
            <Link href="/admin/products">
              Open Products
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            API base: /api/v1/admin/products
          </p>
        </div>
      </section>
    </div>
  );
}
