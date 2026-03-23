"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useCompany } from "../../layout";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface LineItemInput {
  description: string;
  payeeName: string;
  amount: string;
}

interface QuoteInput {
  vendorName: string;
  amount: string;
  isSelected: boolean;
}

const CATEGORIES = [
  "IT Equipment",
  "Office Supplies",
  "Marketing",
  "Travel",
  "Professional Services",
  "Software",
  "Facilities",
  "Other",
];

export default function NewRequestPage() {
  const { activeCompanyId } = useCompany();
  const router = useRouter();
  const submitRequest = useMutation(api.requests.submitRequest);

  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [lineItems, setLineItems] = useState<LineItemInput[]>([
    { description: "", payeeName: "", amount: "" },
  ]);
  const [quotes, setQuotes] = useState<QuoteInput[]>([]);
  const [justification, setJustification] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"details" | "items" | "quotes" | "review">("details");

  const totalAmount = lineItems.reduce(
    (sum, li) => sum + (parseFloat(li.amount) || 0),
    0
  );

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", payeeName: "", amount: "" }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItemInput, value: string) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const addQuote = () => {
    setQuotes([...quotes, { vendorName: "", amount: "", isSelected: false }]);
  };

  const removeQuote = (index: number) => {
    setQuotes(quotes.filter((_, i) => i !== index));
  };

  const updateQuote = (index: number, field: keyof QuoteInput, value: string | boolean) => {
    const updated = [...quotes];
    if (field === "isSelected") {
      // Only one can be selected
      updated.forEach((q, i) => (q.isSelected = i === index));
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setQuotes(updated);
  };

  const handleSubmit = async () => {
    if (!activeCompanyId) return;
    setIsSubmitting(true);
    setError("");

    try {
      await submitRequest({
        companyId: activeCompanyId,
        category,
        description,
        currency,
        lineItems: lineItems
          .filter((li) => li.description && li.amount)
          .map((li) => ({
            description: li.description,
            payeeName: li.payeeName || "TBD",
            amount: parseFloat(li.amount) || 0,
          })),
        quotes: quotes
          .filter((q) => q.vendorName && q.amount)
          .map((q) => ({
            vendorName: q.vendorName,
            amount: parseFloat(q.amount) || 0,
            isSelected: q.isSelected,
          })),
        justificationIfNotLowest: justification || undefined,
      });
      router.push("/requests");
    } catch (e: any) {
      setError(e.message || "Failed to submit request");
    }
    setIsSubmitting(false);
  };

  if (!activeCompanyId) {
    return <div className="text-slate-500 text-center py-16">No company selected.</div>;
  }

  return (
    <div className="max-w-2xl">
      <Link href="/requests" className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Requests
      </Link>

      <h1 className="text-xl font-semibold mb-6">New Request</h1>

      {/* Step indicators */}
      <div className="flex gap-2 mb-6">
        {["details", "items", "quotes", "review"].map((s) => (
          <button
            key={s}
            onClick={() => setStep(s as any)}
            className={`px-3 py-1.5 text-xs rounded-full capitalize ${
              step === s ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Step: Details */}
      {step === "details" && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
          <div>
            <label className="text-sm text-slate-400 block mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm">
              <option value="">Select category...</option>
              {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what this request is for..." className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm h-24 resize-none" />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1">Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm">
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="NGN">NGN</option>
            </select>
          </div>
          <button onClick={() => setStep("items")} disabled={!category || !description} className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium disabled:opacity-50">
            Next: Line Items →
          </button>
        </div>
      )}

      {/* Step: Line Items */}
      {step === "items" && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
          {lineItems.map((item, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Description</label>
                <input type="text" value={item.description} onChange={(e) => updateLineItem(idx, "description", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm" placeholder="Item description" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Payee</label>
                <input type="text" value={item.payeeName} onChange={(e) => updateLineItem(idx, "payeeName", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm" placeholder="Payee name" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Amount</label>
                <input type="number" value={item.amount} onChange={(e) => updateLineItem(idx, "amount", e.target.value)} className="w-24 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm" placeholder="0.00" />
              </div>
              <button onClick={() => removeLineItem(idx)} disabled={lineItems.length <= 1} className="p-2 text-slate-500 hover:text-red-400 disabled:opacity-30">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button onClick={addLineItem} className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
            <Plus className="w-4 h-4" /> Add line item
          </button>
          <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
            <span className="text-sm text-slate-400">Total: <span className="font-mono text-slate-200">{totalAmount.toFixed(2)} {currency}</span></span>
            <button onClick={() => setStep("quotes")} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium">
              Next: Quotes →
            </button>
          </div>
        </div>
      )}

      {/* Step: Quotes */}
      {step === "quotes" && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
          <p className="text-sm text-slate-400">Add quotes from vendors if required by policy. Select the one you want to use.</p>
          {quotes.map((q, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-end">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Vendor</label>
                <input type="text" value={q.vendorName} onChange={(e) => updateQuote(idx, "vendorName", e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm" placeholder="Vendor name" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Amount</label>
                <input type="number" value={q.amount} onChange={(e) => updateQuote(idx, "amount", e.target.value)} className="w-24 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm" placeholder="0.00" />
              </div>
              <div className="flex items-center gap-2">
                <input type="radio" checked={q.isSelected} onChange={() => updateQuote(idx, "isSelected", true)} className="accent-blue-500" />
                <span className="text-xs text-slate-400">Select</span>
              </div>
              <button onClick={() => removeQuote(idx)} className="p-2 text-slate-500 hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button onClick={addQuote} className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
            <Plus className="w-4 h-4" /> Add quote
          </button>
          {quotes.some((q) => q.isSelected && parseFloat(q.amount) > Math.min(...quotes.filter(qq => qq.amount).map(qq => parseFloat(qq.amount) || Infinity))) && (
            <div>
              <label className="text-xs text-slate-400 block mb-1">Justification (non-lowest quote selected)</label>
              <textarea value={justification} onChange={(e) => setJustification(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm h-16 resize-none" placeholder="Why not the lowest quote?" />
            </div>
          )}
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button onClick={() => setStep("review")} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium">
              Next: Review →
            </button>
          </div>
        </div>
      )}

      {/* Step: Review */}
      {step === "review" && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-medium text-slate-300">Review & Submit</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-500">Category</span><p className="text-slate-200">{category}</p></div>
            <div><span className="text-slate-500">Total</span><p className="text-slate-200 font-mono">{totalAmount.toFixed(2)} {currency}</p></div>
          </div>
          <div className="text-sm"><span className="text-slate-500">Description</span><p className="text-slate-200">{description}</p></div>
          <div className="text-sm">
            <span className="text-slate-500">Line Items ({lineItems.filter(li => li.description).length})</span>
            <ul className="mt-1 space-y-1">
              {lineItems.filter(li => li.description).map((li, i) => (
                <li key={i} className="text-slate-300 text-xs">{li.description} — {li.payeeName} — {li.amount} {currency}</li>
              ))}
            </ul>
          </div>
          {quotes.length > 0 && (
            <div className="text-sm">
              <span className="text-slate-500">Quotes ({quotes.length})</span>
              <ul className="mt-1 space-y-1">
                {quotes.map((q, i) => (
                  <li key={i} className="text-slate-300 text-xs">
                    {q.vendorName} — {q.amount} {currency} {q.isSelected ? "(selected)" : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="pt-4 border-t border-slate-800">
            <button onClick={handleSubmit} disabled={isSubmitting || !category || !description || lineItems.every(li => !li.description)} className="w-full px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-sm font-medium disabled:opacity-50">
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
