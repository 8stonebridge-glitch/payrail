import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(timestamp);
}

// Status display mapping
export const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  draft: { label: "Draft", color: "text-slate-400", bg: "bg-slate-400/10" },
  submitted: { label: "Submitted", color: "text-blue-400", bg: "bg-blue-400/10" },
  in_approval: { label: "In Approval", color: "text-blue-400", bg: "bg-blue-400/10" },
  approved: { label: "Approved", color: "text-green-400", bg: "bg-green-400/10" },
  awaiting_finance: { label: "Awaiting Finance", color: "text-teal-400", bg: "bg-teal-400/10" },
  partially_paid: { label: "Partially Paid", color: "text-purple-400", bg: "bg-purple-400/10" },
  paid: { label: "Paid", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  rejected: { label: "Rejected", color: "text-red-400", bg: "bg-red-400/10" },
  resubmitted: { label: "Resubmitted", color: "text-orange-400", bg: "bg-orange-400/10" },
};
