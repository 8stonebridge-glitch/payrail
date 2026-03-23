"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { StatusChip, RejectionBadge, SubmissionBadge } from "@/components/ui/StatusChip";
import { ApprovalStepper } from "@/components/approval/ApprovalStepper";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useState } from "react";
import type { Id } from "../../../../../convex/_generated/dataModel";
import Link from "next/link";
import { ArrowLeft, Check, X, RefreshCw, DollarSign } from "lucide-react";

export default function RequestDetailPage() {
  const params = useParams();
  const requestId = params.id as Id<"requests">;

  const detail = useQuery(api.queries.requestDetail, { requestId });
  const approveStep = useMutation(api.approvals.approveStep);
  const rejectStep = useMutation(api.approvals.rejectStep);
  const resubmitRequest = useMutation(api.requests.resubmitRequest);
  const markPaid = useMutation(api.finance.markLineItemPaid);

  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [paymentRef, setPaymentRef] = useState("");
  const [payingItemId, setPayingItemId] = useState<Id<"requestLineItems"> | null>(null);
  const [isActing, setIsActing] = useState(false);

  if (!detail) {
    return (
      <div className="space-y-4 max-w-4xl">
        <div className="h-6 skeleton w-48" />
        <div className="h-32 skeleton rounded-lg" />
        <div className="h-64 skeleton rounded-lg" />
      </div>
    );
  }

  const handleApprove = async () => {
    const currentStep = detail.steps.find((s: any) => s.status === "waiting");
    if (!currentStep) return;
    setIsActing(true);
    try {
      await approveStep({ requestId, stepId: currentStep._id });
    } catch (e: any) {
      alert(e.message);
    }
    setIsActing(false);
  };

  const handleReject = async () => {
    const currentStep = detail.steps.find((s: any) => s.status === "waiting");
    if (!currentStep || !rejectionReason.trim()) return;
    setIsActing(true);
    try {
      await rejectStep({ requestId, stepId: currentStep._id, reason: rejectionReason.trim() });
      setShowRejectModal(false);
      setRejectionReason("");
    } catch (e: any) {
      alert(e.message);
    }
    setIsActing(false);
  };

  const handleResubmit = async () => {
    setIsActing(true);
    try {
      await resubmitRequest({ requestId });
    } catch (e: any) {
      alert(e.message);
    }
    setIsActing(false);
  };

  const handlePay = async (lineItemId: Id<"requestLineItems">) => {
    if (!paymentRef.trim()) return;
    setIsActing(true);
    try {
      await markPaid({ lineItemId, payoutReference: paymentRef.trim() });
      setPayingItemId(null);
      setPaymentRef("");
    } catch (e: any) {
      alert(e.message);
    }
    setIsActing(false);
  };

  return (
    <div className="max-w-4xl">
      <Link href="/requests" className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Requests
      </Link>

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-lg font-semibold">{detail.requestNumber}</h1>
              <StatusChip status={detail.status} />
              <RejectionBadge count={detail.rejectionCount} />
              <SubmissionBadge count={detail.submissionCount} />
            </div>
            <p className="text-sm text-slate-400">{detail.description}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold">{formatCurrency(detail.totalAmount, detail.currency)}</div>
            <div className="text-xs text-slate-400">{detail.category}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div><span className="text-slate-500">Requester</span><p className="text-slate-200">{detail.requesterName}</p></div>
          <div><span className="text-slate-500">Submitted</span><p className="text-slate-200">{detail.submittedAt ? formatDate(detail.submittedAt) : "—"}</p></div>
          <div><span className="text-slate-500">Quotes Required</span><p className="text-slate-200">{detail.quotesRequired ? `Yes (min ${detail.minQuotesRequired})` : "No"}</p></div>
        </div>

        {(detail.actions.canApprove || detail.actions.canResubmit || detail.actions.canPay) && (
          <div className="mt-6 pt-4 border-t border-slate-800 flex gap-3">
            {detail.actions.canApprove && (
              <>
                <button onClick={handleApprove} disabled={isActing} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-sm font-medium disabled:opacity-50">
                  <Check className="w-4 h-4" /> Approve
                </button>
                <button onClick={() => setShowRejectModal(true)} disabled={isActing} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-medium disabled:opacity-50">
                  <X className="w-4 h-4" /> Reject
                </button>
              </>
            )}
            {detail.actions.canResubmit && (
              <button onClick={handleResubmit} disabled={isActing} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-sm font-medium disabled:opacity-50">
                <RefreshCw className="w-4 h-4" /> Resubmit
              </button>
            )}
          </div>
        )}
      </div>

      {/* Approval Steps */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
        <h2 className="text-sm font-medium text-slate-300 mb-4">Approval Route</h2>
        <ApprovalStepper steps={detail.steps} orientation={detail.steps.length > 5 ? "vertical" : "horizontal"} />
      </div>

      {/* Quotes */}
      {detail.quotes.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-sm font-medium text-slate-300 mb-4">Quotes</h2>
          <div className="space-y-2">
            {detail.quotes.map((q: any) => (
              <div key={q._id} className={`flex items-center justify-between p-3 rounded-lg border ${q.isSelected ? "border-blue-500 bg-blue-500/5" : "border-slate-800"}`}>
                <div>
                  <span className="text-sm text-slate-200">{q.vendorName}</span>
                  {q.isSelected && <span className="ml-2 text-xs text-blue-400">Selected</span>}
                  {q.isLowest && <span className="ml-2 text-xs text-green-400">Lowest</span>}
                </div>
                <div className="font-mono text-sm">{formatCurrency(q.amount, q.currency)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Line Items */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
        <h2 className="text-sm font-medium text-slate-300 mb-4">Line Items</h2>
        <table className="w-full table-dense">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left">Description</th>
              <th className="text-left">Payee</th>
              <th className="text-right">Amount</th>
              <th className="text-left">Payout</th>
              {detail.actions.canPay && <th></th>}
            </tr>
          </thead>
          <tbody>
            {detail.lineItems.map((item: any) => (
              <tr key={item._id} className="border-b border-slate-800/50">
                <td className="text-slate-200">{item.description}</td>
                <td className="text-slate-400">{item.payeeName}</td>
                <td className="text-right font-mono">{formatCurrency(item.amount, item.currency)}</td>
                <td><StatusChip status={item.payoutStatus === "paid" ? "paid" : "awaiting_finance"} /></td>
                {detail.actions.canPay && (
                  <td className="text-right">
                    {item.payoutStatus !== "paid" && (
                      payingItemId === item._id ? (
                        <div className="flex items-center gap-2">
                          <input type="text" placeholder="Payment ref..." value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs w-32" />
                          <button onClick={() => handlePay(item._id)} disabled={isActing || !paymentRef.trim()} className="text-xs px-2 py-1 rounded bg-green-600 hover:bg-green-500 disabled:opacity-50">Confirm</button>
                          <button onClick={() => { setPayingItemId(null); setPaymentRef(""); }} className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setPayingItemId(item._id)} className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> Pay
                        </button>
                      )
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h2 className="text-sm font-medium text-slate-300 mb-4">Timeline</h2>
        {detail.timeline.length === 0 ? (
          <p className="text-sm text-slate-500">No events recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {detail.timeline.map((event: any) => (
              <div key={event._id} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-slate-600 mt-1.5 flex-shrink-0" />
                <div>
                  <div className="text-sm text-slate-200">
                    <span className="font-medium">{event.actorName}</span>{" "}
                    <span className="text-slate-400">{event.action.replace(/_/g, " ")}</span>
                  </div>
                  <div className="text-xs text-slate-500">{formatDate(event.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Reject Request</h3>
            <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Reason for rejection..." className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm mb-4 h-24 resize-none" />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowRejectModal(false); setRejectionReason(""); }} className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm">Cancel</button>
              <button onClick={handleReject} disabled={!rejectionReason.trim() || isActing} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-medium disabled:opacity-50">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
