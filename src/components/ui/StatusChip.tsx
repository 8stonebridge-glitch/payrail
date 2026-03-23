"use client";

import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "@/lib/utils";

interface StatusChipProps {
  status: string;
  className?: string;
}

export function StatusChip({ status, className }: StatusChipProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    color: "text-slate-400",
    bg: "bg-slate-400/10",
  };

  return (
    <span
      className={cn("status-chip", config.bg, config.color, className)}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", config.color.replace("text-", "bg-"))}
      />
      {config.label}
    </span>
  );
}

export function RejectionBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="status-chip bg-red-500/10 text-red-400">
      Rejected {count}×
    </span>
  );
}

export function SubmissionBadge({ count }: { count: number }) {
  if (count <= 1) return null;
  return (
    <span className="status-chip bg-orange-500/10 text-orange-400">
      Submission #{count}
    </span>
  );
}
