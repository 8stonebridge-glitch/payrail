"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCompany } from "../layout";
import {
  Bell,
  Wallet,
  AlertTriangle,
  CheckCircle,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";

export default function DashboardPage() {
  const { activeCompanyId } = useCompany();

  const stats = useQuery(
    api.queries.dashboardStats,
    activeCompanyId ? { companyId: activeCompanyId } : "skip"
  );

  const actions = useQuery(
    api.queries.myPendingActions,
    activeCompanyId ? { companyId: activeCompanyId } : "skip"
  );

  if (!activeCompanyId) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400">No company selected. Join a company to get started.</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-4">
        <div className="h-8 skeleton w-40" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 skeleton rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Bell}
          label="Pending Approvals"
          value={stats.pendingApprovals}
          color="text-amber-400"
          bg="bg-amber-400/10"
          href="/actions"
        />
        <StatCard
          icon={Wallet}
          label="Awaiting Finance"
          value={stats.awaitingFinance}
          color="text-teal-400"
          bg="bg-teal-400/10"
          href="/finance"
        />
        <StatCard
          icon={AlertTriangle}
          label="Rejected (Mine)"
          value={stats.rejectedRequests}
          color="text-red-400"
          bg="bg-red-400/10"
          href="/requests?status=rejected"
        />
        <StatCard
          icon={CheckCircle}
          label="Recently Paid"
          value={stats.recentlyPaid}
          color="text-emerald-400"
          bg="bg-emerald-400/10"
          href="/requests?status=paid"
        />
      </div>

      {/* My Pending Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-300">
            My Pending Actions
          </h2>
          <Link
            href="/actions"
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            View all →
          </Link>
        </div>
        {!actions || actions.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
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
                <th className="text-left">Type</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {actions.slice(0, 5).map((action) => (
                <tr
                  key={action.requestId}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30"
                >
                  <td className="font-mono text-blue-400 text-xs">
                    {action.requestNumber}
                  </td>
                  <td className="text-slate-300">{action.category}</td>
                  <td className="text-right font-mono">
                    {formatCurrency(action.amount)}
                  </td>
                  <td className="text-slate-400">
                    {action.requester ?? "—"}
                  </td>
                  <td>
                    <StatusChip
                      status={
                        action.type === "approval"
                          ? "in_approval"
                          : action.type === "finance"
                            ? "awaiting_finance"
                            : "rejected"
                      }
                    />
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/requests/${action.requestId}`}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
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

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
  href,
}: {
  icon: typeof LayoutDashboard;
  label: string;
  value: number;
  color: string;
  bg: string;
  href?: string;
}) {
  const content = (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div>
          <div className="text-2xl font-semibold">{value}</div>
          <div className="text-xs text-slate-400">{label}</div>
        </div>
      </div>
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}
