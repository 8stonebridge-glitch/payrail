"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCompany } from "../layout";
import { formatDate } from "@/lib/utils";
import { Shield, Check, X } from "lucide-react";
import { useState } from "react";

export default function GovernancePage() {
  const { activeCompanyId } = useCompany();
  const changes = useQuery(
    api.queries.governanceInbox,
    activeCompanyId ? { companyId: activeCompanyId } : "skip"
  );
  const approveChange = useMutation(api.governance.approveGovernedChange);
  const rejectChange = useMutation(api.governance.rejectGovernedChange);

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rationale, setRationale] = useState("");
  const [isActing, setIsActing] = useState(false);

  const handleApprove = async (changeRequestId: any) => {
    setIsActing(true);
    try {
      await approveChange({ changeRequestId });
    } catch (e: any) {
      alert(e.message);
    }
    setIsActing(false);
  };

  const handleReject = async (changeRequestId: any) => {
    setIsActing(true);
    try {
      await rejectChange({ changeRequestId, rationale: rationale || undefined });
      setRejectingId(null);
      setRationale("");
    } catch (e: any) {
      alert(e.message);
    }
    setIsActing(false);
  };

  if (!activeCompanyId) {
    return <div className="text-slate-500 text-center py-16">No company selected.</div>;
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Governance Inbox</h1>

      {!changes ? (
        <div className="p-8 text-center text-sm text-slate-500">Loading...</div>
      ) : changes.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
          <Shield className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No pending governance changes.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {changes.map((change: any) => (
            <div key={change._id} className="bg-slate-900 border border-slate-800 rounded-lg p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 font-medium">
                      {change.changeType.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-slate-500">
                      {change.currentApprovals}/{change.requiredApprovals} approvals
                    </span>
                  </div>
                  <p className="text-sm text-slate-200">{change.changeDescription}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Proposed by {change.requesterName} · {formatDate(change.createdAt)}
                  </p>
                </div>
                {change.canAct && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleApprove(change._id)}
                      disabled={isActing}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-xs font-medium disabled:opacity-50"
                    >
                      <Check className="w-3 h-3" /> Approve
                    </button>
                    <button
                      onClick={() => setRejectingId(change._id)}
                      disabled={isActing}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-medium disabled:opacity-50"
                    >
                      <X className="w-3 h-3" /> Reject
                    </button>
                  </div>
                )}
              </div>

              {/* Votes */}
              {change.approvalVotes.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <p className="text-xs text-slate-500 mb-2">Votes:</p>
                  <div className="flex gap-3">
                    {change.approvalVotes.map((vote: any) => (
                      <span
                        key={vote._id}
                        className={`text-xs px-2 py-1 rounded ${
                          vote.decision === "approve"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {vote.decision === "approve" ? "✓" : "✗"} Admin
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reject modal inline */}
              {rejectingId === change._id && (
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <textarea
                    value={rationale}
                    onChange={(e) => setRationale(e.target.value)}
                    placeholder="Reason for rejection (optional)..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm h-16 resize-none mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReject(change._id)}
                      disabled={isActing}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-medium disabled:opacity-50"
                    >
                      Confirm Reject
                    </button>
                    <button
                      onClick={() => { setRejectingId(null); setRationale(""); }}
                      className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
