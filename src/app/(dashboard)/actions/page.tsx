"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCompany } from "../layout";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

type ActionType = "approval" | "finance" | "resubmit" | "all";

export default function ActionsPage() {
  const { activeCompanyId } = useCompany();
  const [tab, setTab] = useState<ActionType>("all");

  const actions = useQuery(
    api.queries.myPendingActions,
    activeCompanyId ? { companyId: activeCompanyId } : "skip"
  );

  if (!activeCompanyId) {
    return <div className="text-slate-500 text-center py-16">No company selected.</div>;
  }

  const filtered = actions
    ? tab === "all"
      ? actions
      : actions.filter((a) => a.type === tab)
    : [];

  const approvalCount = actions?.filter((a) => a.type === "approval").length ?? 0;
  const financeCount = actions?.filter((a) => a.type === "finance").length ?? 0;
  const resubmitCount = actions?.filter((a) => a.type === "resubmit").length ?? 0;

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">My Actions</h1>

      <div className="flex gap-1 mb-6 border-b border-slate-800">
        <TabButton active={tab === "all"} onClick={() => setTab("all")} label={`All (${actions?.length ?? 0})`} />
        <TabButton active={tab === "approval"} onClick={() => setTab("approval")} label={`Approvals (${approvalCount})`} />
        <TabButton active={tab === "finance"} onClick={() => setTab("finance")} label={`Finance (${financeCount})`} />
        <TabButton active={tab === "resubmit"} onClick={() => setTab("resubmit")} label={`Resubmit (${resubmitCount})`} />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        {!actions ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-500">
            No pending actions. All clear.
          </div>
        ) : (
          <table className="w-full table-dense">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left">Request</th>
                <th className="text-left">Category</th>
                <th className="text-right">Amount</th>
                <th className="text-left">Requester</th>
                <th className="text-left">Waiting For</th>
                <th className="text-left">Type</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((action) => (
                <tr key={action.requestId} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="font-mono text-blue-400 text-xs">
                    <Link href={`/requests/${action.requestId}`} className="hover:underline">
                      {action.requestNumber}
                    </Link>
                  </td>
                  <td className="text-slate-300">{action.category}</td>
                  <td className="text-right font-mono">{formatCurrency(action.amount)}</td>
                  <td className="text-slate-400">{action.requester ?? "—"}</td>
                  <td className="text-slate-400 text-xs">{action.stepLabel ?? "—"}</td>
                  <td>
                    <StatusChip
                      status={action.type === "approval" ? "in_approval" : action.type === "finance" ? "awaiting_finance" : "rejected"}
                    />
                  </td>
                  <td className="text-right">
                    <Link href={`/requests/${action.requestId}`} className="text-xs text-blue-400 hover:text-blue-300">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm transition-colors border-b-2 ${
        active ? "border-blue-500 text-white" : "border-transparent text-slate-400 hover:text-slate-200"
      }`}
    >
      {label}
    </button>
  );
}
