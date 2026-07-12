"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { type Role } from "@/lib/constants";
import { navFor } from "./nav-items";
import { Brand } from "./Brand";
import { cn } from "@/lib/utils";

export function MobileNav({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = navFor(role);

  // Close the drawer whenever the route changes.
  useEffect(() => { setOpen(false); }, [pathname]);

  // Esc to close + lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-line p-2 text-muted transition-colors hover:bg-surface-2 hover:text-ink md:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
          <aside className="glass-strong absolute left-0 top-0 flex h-full w-72 max-w-[80vw] flex-col p-4 animate-fade-in">
            <div className="flex items-center justify-between px-2 py-2">
              <Brand />
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Close navigation">
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="mt-4 flex flex-col gap-1">
              {items.map((n) => {
                const active = pathname === n.href || pathname.startsWith(n.href + "/");
                const Icon = n.icon;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "border border-accent/30 bg-accent/10 text-ink"
                        : "border border-transparent text-muted hover:bg-surface-2/70 hover:text-ink",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
