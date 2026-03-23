"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCompany } from "../layout";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DollarSign } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function FinancePage() {
  const { activeCompanyId } = useCompany();
  const queue = useQuery(
    api.queries.financeQueue,
    activeCompanyId ? { companyId: activeCompanyId } : "skip"
  );
  const markPaid = useMutation(api.finance.markLineItemPaid);

  const [payingItemId, setPayingItemId] = useState<Id<"requestLineItems"> | null>(null);
  const [paymentRef, setPaymentRef] = useState("");
  const [isActing, setIsActing] = useState(false);

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

  if (!activeCompanyId) {
    return <div className="text-slate-500 text-center py-16">No company selected.</div>;
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Finance Queue</h1>

      {!queue ? (
        <div className="p-8 text-center text-sm text-slate-500">Loading...</div>
      ) : queue.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
          <DollarSign className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No requests awaiting finance processing.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map((req: any) => (
            <div key={req._id} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Link href={`/requests/${req._id}`} className="font-mono text-blue-400 text-sm hover:underline">
                    {req.requestNumber}
                  </Link>
                  <StatusChip status={req.status} />
                  <span className="text-xs text-slate-400">
                    {req.paidCount}/{req.totalItems} items paid
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm">{formatCurrency(req.totalAmount, req.currency)}</div>
                  <div className="text-xs text-slate-400">{req.requesterName}</div>
                </div>
              </div>

              <table className="w-full table-dense">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left">Item</th>
                    <th className="text-left">Payee</th>
                    <th className="text-right">Amount</th>
                    <th className="text-left">Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {req.lineItems.map((item: any) => (
                    <tr key={item._id} className="border-b border-slate-800/50">
                      <td className="text-slate-200 text-sm">{item.description}</td>
                      <td className="text-slate-400 text-sm">{item.payeeName}</td>
                      <td className="text-right font-mono text-sm">{formatCurrency(item.amount, item.currency)}</td>
                      <td>
                        {item.payoutStatus === "paid" ? (
                          <StatusChip status="paid" />
                        ) : (
                          <StatusChip status="awaiting_finance" />
                        )}
                      </td>
                      <td className="text-right">
                        {item.payoutStatus !== "paid" && (
                          payingItemId === item._id ? (
                            <div className="flex items-center gap-2">
                              <input type="text" placeholder="Ref #" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs w-28" />
                              <button onClick={() => handlePay(item._id)} disabled={isActing || !paymentRef.trim()} className="text-xs px-2 py-1 rounded bg-green-600 hover:bg-green-500 disabled:opacity-50">Pay</button>
                              <button onClick={() => { setPayingItemId(null); setPaymentRef(""); }} className="text-xs px-2 py-1 rounded bg-slate-700">Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => setPayingItemId(item._id)} className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1">
                              <DollarSign className="w-3 h-3" /> Mark Paid
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
