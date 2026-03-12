import Link from "next/link";
import { Boxes, LayoutGrid, Package } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutGrid },
  { href: "/admin/products", label: "Products", icon: Package },
];

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-muted/40 text-foreground">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-background px-6 py-8 md:flex">
        <div className="flex items-center gap-3 pb-6">
          <span className="grid size-10 place-items-center rounded-lg border border-border bg-muted">
            <Boxes className="size-5 text-muted-foreground" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Seller Bot
            </p>
            <p className="text-sm font-semibold">Admin</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition",
                "hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="size-4 text-muted-foreground" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">Quick tip</p>
          <p>Keep handles unique and short for clean URLs.</p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Admin Console
            </p>
            <h1 className="text-lg font-semibold">Manage your catalog</h1>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
            <span className="rounded-full border border-border px-3 py-1">v1 API</span>
            <span className="rounded-full border border-border px-3 py-1">
              Single tenant
            </span>
          </div>
        </header>
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
