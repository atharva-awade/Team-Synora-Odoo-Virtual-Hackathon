"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Periodically re-fetches the current server component tree so dashboard KPIs
// and alerts stay live without a manual reload.
export function LiveRefresh({ interval = 6000 }: { interval?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), interval);
    return () => clearInterval(t);
  }, [router, interval]);
  return null;
}
