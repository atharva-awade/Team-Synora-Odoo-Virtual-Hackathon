"use client";

import dynamic from "next/dynamic";

const LiveMap = dynamic(() => import("./LiveMap").then((m) => m.LiveMap), {
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center text-sm text-muted">Loading live map...</div>,
});

export function LiveMapPanel() {
  return (
    <div className="card overflow-hidden p-0" style={{ height: "72vh", minHeight: 480 }}>
      <LiveMap />
    </div>
  );
}
