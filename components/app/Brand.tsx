import { Truck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-2 text-black shadow-lg shadow-accent/25">
        <Truck className="h-4 w-4" strokeWidth={2.4} />
      </div>
      <span className="text-lg font-semibold tracking-tight text-ink">
        Transit<span className="text-gradient">Ops</span>
      </span>
    </div>
  );
}
