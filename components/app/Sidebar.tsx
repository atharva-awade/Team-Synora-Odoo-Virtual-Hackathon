"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type Role } from "@/lib/constants";
import { navFor } from "./nav-items";
import { Brand } from "./Brand";
import { cn } from "@/lib/utils";

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = navFor(role);

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface/50 p-4 backdrop-blur-xl md:flex">
      <div className="px-2 py-2">
        <Brand />
      </div>
      <nav className="mt-6 flex flex-col gap-1">
        {items.map((n) => {
          const active = pathname === n.href || pathname.startsWith(n.href + "/");
          const Icon = n.icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "border border-accent/30 bg-accent/10 text-ink"
                  : "border border-transparent text-muted hover:bg-surface-2/70 hover:text-ink",
              )}
            >
              <Icon className="h-4 w-4" />
              {n.label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-2 text-[10px] leading-relaxed text-muted">
        Team Synora
        <br />
        Odoo Virtual Hackathon 2026
      </div>
    </aside>
  );
}
