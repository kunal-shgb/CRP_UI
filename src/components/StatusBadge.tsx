import { getStatusColor, type TicketStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", getStatusColor(status))}>
      {status}
    </span>
  );
}
