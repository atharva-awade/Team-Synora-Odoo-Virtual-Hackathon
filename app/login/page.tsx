"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Brand } from "@/components/app/Brand";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { Button, Input, Field } from "@/components/ui/primitives";
import { ROLE_LABELS, ROLE_BLURB, ROLES, type Role } from "@/lib/constants";

const DEMO_EMAIL: Record<Role, string> = {
  FLEET_MANAGER: "fleet@synora.in",
  DISPATCHER: "dispatch@synora.in",
  SAFETY_OFFICER: "safety@synora.in",
  FINANCIAL_ANALYST: "finance@synora.in",
};
const DEMO_PASSWORD = "synora123";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("dispatch@synora.in");
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Login failed");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  function quick(role: Role) {
    setEmail(DEMO_EMAIL[role]);
    setPassword(DEMO_PASSWORD);
    setLoading(true);
    setError("");
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: DEMO_EMAIL[role], password: DEMO_PASSWORD }),
    }).then((res) => {
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError("Login failed");
        setLoading(false);
      }
    });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="fixed right-4 top-4 z-20">
        <ThemeToggle />
      </div>
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-surface/40 p-10 lg:flex grid-bg">
        <div className="pointer-events-none absolute -left-20 top-1/3 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <Brand />
        <div className="relative">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Run your fleet from a single <span className="text-gradient">command center</span>.
          </h1>
          <p className="mt-4 max-w-md text-sm text-muted">
            Vehicles, drivers, dispatch, maintenance and analytics. One login, four roles, real-time visibility.
          </p>
          <div className="mt-8 space-y-2">
            {ROLES.map((r) => (
              <div key={r} className="flex items-center gap-2 text-sm text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="font-medium text-ink">{ROLE_LABELS[r]}</span>
                <span className="text-muted">· {ROLE_BLURB[r]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-[11px] text-muted">Team Synora · Odoo Virtual Hackathon 2026</div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>
          <h2 className="text-2xl font-semibold">Sign in to your account</h2>
          <p className="mt-1 text-sm text-muted">Enter your credentials to continue.</p>

          <form onSubmit={login} className="mt-6 space-y-4">
            <Field label="Email">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@synora.in" />
            </Field>
            <Field label="Password">
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="********" />
            </Field>
            {error && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-300">
                {error}
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign In <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>

          <div className="mt-8">
            <div className="mb-3 text-[11px] uppercase tracking-wider text-muted">Quick access for the demo</div>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => quick(r)}
                  disabled={loading}
                  className="rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-left text-xs transition-colors hover:border-accent/40 disabled:opacity-50"
                >
                  <div className="font-medium text-ink">{ROLE_LABELS[r]}</div>
                  <div className="mt-0.5 text-[10px] text-muted">{DEMO_EMAIL[r]}</div>
                </button>
              ))}
            </div>
            <div className="mt-3 text-center text-[11px] text-muted">Password for all demo accounts: {DEMO_PASSWORD}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
