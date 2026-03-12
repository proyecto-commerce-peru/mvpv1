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
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,_oklch(0.98_0.02_85),_oklch(0.97_0.01_40),_oklch(0.94_0.02_85))] text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,_transparent_0%,_transparent_35%,_oklch(0.92_0.03_85/0.3)_50%,_transparent_65%,_transparent_100%)] opacity-60" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1400px] gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <aside className="hidden w-64 shrink-0 flex-col gap-6 rounded-3xl border border-border/70 bg-white/80 p-6 shadow-[0_24px_60px_-50px_rgba(0,0,0,0.45)] backdrop-blur md:flex">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-foreground text-background">
              <Boxes className="size-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                Seller Bot
              </p>
              <p className="text-lg font-semibold">Admin Desk</p>
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition",
                  "hover:border-border/80 hover:bg-white hover:text-foreground"
                )}
              >
                <item.icon className="size-4 text-muted-foreground transition group-hover:text-foreground" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/40 p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Quick tip</p>
            <p>Keep handles unique and short for clean URLs.</p>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col gap-6">
          <header className="flex items-center justify-between rounded-3xl border border-border/70 bg-white/80 px-6 py-4 shadow-[0_20px_50px_-40px_rgba(0,0,0,0.35)] backdrop-blur">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Products Console
              </p>
              <h1 className="text-2xl font-semibold">Manage your catalog</h1>
            </div>
            <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
              <span className="rounded-full border border-border/70 px-3 py-1">
                v1 API
              </span>
              <span className="rounded-full border border-border/70 px-3 py-1">
                Single tenant
              </span>
            </div>
          </header>
          <main className="flex-1 rounded-3xl border border-border/60 bg-white/90 p-6 shadow-[0_30px_80px_-60px_rgba(0,0,0,0.35)] backdrop-blur">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
