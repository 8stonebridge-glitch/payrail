"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCompany } from "../layout";
import { Archive, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useState } from "react";

const TABLE_FILTERS = [
  { label: "All", value: undefined },
  { label: "Requests", value: "requests" },
  { label: "Approval Steps", value: "requestApprovalSteps" },
  { label: "Policies", value: "approvalPolicies" },
  { label: "Users", value: "users" },
];

export default function ArchivePage() {
  const { activeCompanyId } = useCompany();
  const [tableFilter, setTableFilter] = useState<string | undefined>(undefined);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const records = useQuery(
    api.queries.archiveSearch,
    activeCompanyId
      ? { companyId: activeCompanyId, tableFilter }
      : "skip"
  );

  if (!activeCompanyId) {
    return <div className="text-slate-500 text-center py-16">No company selected.</div>;
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Archived Records</h1>

      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {TABLE_FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setTableFilter(f.value)}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors whitespace-nowrap ${
              tableFilter === f.value
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg">
        {!records ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading...</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center">
            <Archive className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No archived records found.</p>
            <p className="text-xs text-slate-600 mt-1">
              Deleted records are preserved here for audit purposes.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {records.map((record: any) => (
              <div key={record._id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        {record.originalTable}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {record.originalId.slice(0, 12)}...
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Archived by {record.archivedByName} · {formatDate(record.archivedAt)} · {record.reason}
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedId(expandedId === record._id ? null : record._id)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    {expandedId === record._id ? "Hide" : "View"} Data
                  </button>
                </div>
                {expandedId === record._id && (
                  <pre className="mt-3 bg-slate-950 border border-slate-800 rounded p-3 text-xs text-slate-300 overflow-x-auto max-h-64">
                    {JSON.stringify(JSON.parse(record.data), null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
