import { cn } from "@/lib/utils";
import { STATUS_STYLE, statusLabel } from "@/lib/constants";

export function StatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLE[status] ?? STATUS_STYLE.DRAFT,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {statusLabel(status)}
    </span>
  );
}
