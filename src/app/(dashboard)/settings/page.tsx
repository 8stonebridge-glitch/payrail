"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCompany } from "../layout";
import { Building2, Users, FileKey } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { activeCompanyId } = useCompany();
  const company = useQuery(
    api.queries.getCompany,
    activeCompanyId ? { companyId: activeCompanyId } : "skip"
  );
  const policies = useQuery(
    api.queries.companyPolicies,
    activeCompanyId ? { companyId: activeCompanyId } : "skip"
  );
  const users = useQuery(
    api.queries.listCompanyUsers,
    activeCompanyId ? { companyId: activeCompanyId } : "skip"
  );

  if (!activeCompanyId) {
    return <div className="text-slate-500 text-center py-16">No company selected.</div>;
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Company Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-medium text-slate-300">Company</h2>
          </div>
          {company ? (
            <div className="space-y-2 text-sm">
              <div><span className="text-slate-500">Name:</span> <span className="text-slate-200">{company.name}</span></div>
              <div><span className="text-slate-500">Slug:</span> <span className="text-slate-200 font-mono">{company.slug}</span></div>
              <div><span className="text-slate-500">Governance Threshold:</span> <span className="text-slate-200">{company.governanceThreshold} admin(s) required</span></div>
            </div>
          ) : (
            <div className="skeleton h-16 rounded" />
          )}
        </div>

        {/* Users & Roles */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-green-400" />
            <h2 className="text-sm font-medium text-slate-300">Users & Roles</h2>
          </div>
          {users ? (
            <div className="space-y-2">
              {users.slice(0, 5).map((u: any) => (
                <div key={u.userId} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-slate-200">{u.displayName}</span>
                    <span className="text-slate-500 ml-2 text-xs">{u.email}</span>
                  </div>
                  <div className="flex gap-1">
                    {u.roles.map((r: string) => (
                      <span key={r} className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{r}</span>
                    ))}
                  </div>
                </div>
              ))}
              {users.length > 5 && <p className="text-xs text-slate-500">+{users.length - 5} more</p>}
            </div>
          ) : (
            <div className="skeleton h-16 rounded" />
          )}
        </div>

        {/* Policies */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <FileKey className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-medium text-slate-300">Approval Policies</h2>
          </div>
          {policies ? (
            policies.length === 0 ? (
              <p className="text-sm text-slate-500">No active policies. Create one to enable approval routing.</p>
            ) : (
              <table className="w-full table-dense">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left">Category</th>
                    <th className="text-left">Amount Range</th>
                    <th className="text-left">Quotes</th>
                    <th className="text-left">Steps</th>
                    <th className="text-left">Route</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map((p: any) => (
                    <tr key={p._id} className="border-b border-slate-800/50">
                      <td className="text-slate-200">{p.category}</td>
                      <td className="text-slate-400 font-mono text-xs">
                        {p.amountMin.toLocaleString()} — {p.amountMax ? p.amountMax.toLocaleString() : "∞"}
                      </td>
                      <td className="text-slate-400">{p.requiresQuotes ? `${p.minQuoteCount} required` : "No"}</td>
                      <td className="text-slate-400">{p.approvalRoute.length}</td>
                      <td className="text-xs text-slate-500">
                        {p.approvalRoute.map((s: any) => s.label).join(" → ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            <div className="skeleton h-24 rounded" />
          )}
        </div>
      </div>
    </div>
  );
}
