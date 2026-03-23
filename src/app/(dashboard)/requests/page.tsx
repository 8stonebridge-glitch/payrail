"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCompany } from "../layout";
import { StatusChip, RejectionBadge, SubmissionBadge } from "@/components/ui/StatusChip";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";

const STATUS_FILTERS = [
  { label: "All", value: undefined },
  { label: "Draft", value: "draft" },
  { label: "In Approval", value: "in_approval" },
  { label: "Submitted", value: "submitted" },
  { label: "Approved", value: "approved" },
  { label: "Awaiting Finance", value: "awaiting_finance" },
  { label: "Partially Paid", value: "partially_paid" },
  { label: "Paid", value: "paid" },
  { label: "Rejected", value: "rejected" },
];

export default function RequestListPage() {
  const { activeCompanyId } = useCompany();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") ?? undefined;
  const [statusFilter, setStatusFilter] = useState<string | undefined>(initialStatus);

  const requests = useQuery(
    api.queries.requestList,
    activeCompanyId
      ? { companyId: activeCompanyId, statusFilter }
      : "skip"
  );

  if (!activeCompanyId) {
    return <div className="text-slate-500 text-center py-16">No company selected.</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Requests</h1>
        <Link
          href="/requests/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Request
        </Link>
      </div>

      {/* Status filters */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors whitespace-nowrap ${
              statusFilter === f.value
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Request table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        {!requests ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-slate-500 mb-4">No requests found.</p>
            <Link href="/requests/new" className="text-sm text-blue-400 hover:text-blue-300">
              Create your first request →
            </Link>
          </div>
        ) : (
          <table className="w-full table-dense">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left">Request #</th>
                <th className="text-left">Category</th>
                <th className="text-left">Description</th>
                <th className="text-right">Amount</th>
                <th className="text-left">Requester</th>
                <th className="text-left">Status</th>
                <th className="text-left">Current Step</th>
                <th className="text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req: any) => (
                <tr key={req._id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td>
                    <Link href={`/requests/${req._id}`} className="font-mono text-blue-400 text-xs hover:underline">
                      {req.requestNumber}
                    </Link>
                  </td>
                  <td className="text-slate-300">{req.category}</td>
                  <td className="text-slate-400 max-w-[200px] truncate">{req.description}</td>
                  <td className="text-right font-mono">{formatCurrency(req.totalAmount, req.currency)}</td>
                  <td className="text-slate-400">{req.requesterName}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <StatusChip status={req.status} />
                      <RejectionBadge count={req.rejectionCount} />
                      <SubmissionBadge count={req.submissionCount} />
                    </div>
                  </td>
                  <td className="text-xs text-slate-400">{req.currentStepLabel ?? "—"}</td>
                  <td className="text-xs text-slate-500">{formatRelativeTime(req.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
