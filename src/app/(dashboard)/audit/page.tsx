"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCompany } from "../layout";
import { Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useState } from "react";

const ACTION_FILTERS = [
  { label: "All", value: undefined },
  { label: "Submissions", value: "request_submitted" },
  { label: "Approvals", value: "step_approved" },
  { label: "Rejections", value: "step_rejected" },
  { label: "Payments", value: "line_item_paid" },
  { label: "Governance", value: "governance_proposed" },
];

export default function AuditLogPage() {
  const { activeCompanyId } = useCompany();
  const [entityFilter, setEntityFilter] = useState<string | undefined>(undefined);

  const events = useQuery(
    api.queries.auditTimeline,
    activeCompanyId
      ? { companyId: activeCompanyId, entityType: entityFilter, limit: 100 }
      : "skip"
  );

  if (!activeCompanyId) {
    return <div className="text-slate-500 text-center py-16">No company selected.</div>;
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Audit Log</h1>

      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {ACTION_FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setEntityFilter(f.value)}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors whitespace-nowrap ${
              entityFilter === f.value
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg">
        {!events ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading...</div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No audit events found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {events.map((event: any) => (
              <div key={event._id} className="px-4 py-3 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-200">{event.actorName}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      {event.action.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500">{event.entityType} · {event.entityId.slice(0, 8)}...</span>
                    <span className="text-xs text-slate-600">{formatDate(event.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
