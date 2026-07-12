"use client";

import { useRouter } from "next/navigation";
import { Search, LogOut } from "lucide-react";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { ThemeToggle } from "./ThemeToggle";
import { MobileNav } from "./MobileNav";

export function Topbar({ user }: { user: { name: string; email: string; role: Role } }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-bg/70 px-4 backdrop-blur-md">
      <MobileNav role={user.role} />
      <div className="relative hidden w-72 sm:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          placeholder="Search vehicles, drivers, trips..."
          className="h-9 w-full rounded-lg border border-line bg-surface-2 pl-9 pr-3 text-sm text-ink placeholder:text-muted/60 focus:border-accent/50 focus:outline-none"
        />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right leading-tight sm:block">
          <div className="text-sm font-medium text-ink">{user.name}</div>
          <div className="text-[11px] text-muted">{user.email}</div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-line bg-surface-2 py-1 pl-1 pr-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-xs font-bold text-black">
            {initials}
          </div>
          <span className="text-xs font-medium text-ink">{ROLE_LABELS[user.role]}</span>
        </div>
        <ThemeToggle />
        <button
          onClick={logout}
          className="rounded-lg border border-line p-2 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
