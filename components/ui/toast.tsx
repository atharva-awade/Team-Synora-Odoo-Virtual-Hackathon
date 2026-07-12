"use client";

import { create } from "zustand";
import { CheckCircle2, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; title: string; kind: ToastKind };

let counter = 0;

type ToastState = {
  toasts: Toast[];
  push: (title: string, kind?: ToastKind) => void;
  remove: (id: number) => void;
};

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  push: (title, kind = "success") => {
    const id = ++counter;
    set((s) => ({ toasts: [...s.toasts, { id, title, kind }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3600);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(title: string, kind: ToastKind = "success") {
  useToast.getState().push(title, kind);
}

export function Toaster() {
  const toasts = useToast((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "panel pointer-events-auto flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm shadow-xl animate-fade-in",
            t.kind === "success" && "text-emerald-300",
            t.kind === "error" && "text-rose-300",
            t.kind === "info" && "text-sky-300",
          )}
        >
          {t.kind === "success" && <CheckCircle2 className="h-4 w-4" />}
          {t.kind === "error" && <XCircle className="h-4 w-4" />}
          {t.kind === "info" && <Info className="h-4 w-4" />}
          <span className="text-ink">{t.title}</span>
        </div>
      ))}
    </div>
  );
}
