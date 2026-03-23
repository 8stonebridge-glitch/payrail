"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react";
import Link from "next/link";

interface RouteStep {
  requiredRole: string;
  label: string;
}

export default function PolicyBuilderPage() {
  const [category, setCategory] = useState("");
  const [amountMin, setAmountMin] = useState(0);
  const [amountMax, setAmountMax] = useState<number | "">("");
  const [requiresQuotes, setRequiresQuotes] = useState(false);
  const [minQuoteCount, setMinQuoteCount] = useState(3);
  const [requireJustification, setRequireJustification] = useState(true);
  const [steps, setSteps] = useState<RouteStep[]>([
    { requiredRole: "approver", label: "Department Head" },
  ]);

  const roles = ["approver", "senior_approver", "finance", "admin"];

  const addStep = () => {
    setSteps([...steps, { requiredRole: "approver", label: "" }]);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof RouteStep, value: string) => {
    const updated = [...steps];
    updated[index][field] = value;
    setSteps(updated);
  };

  // Placeholder policies list
  const existingPolicies = [
    { category: "IT Equipment", amountMin: 0, amountMax: 5000, stepsCount: 2 },
    { category: "IT Equipment", amountMin: 5000, amountMax: null, stepsCount: 4 },
    { category: "Marketing", amountMin: 0, amountMax: 10000, stepsCount: 3 },
    { category: "Travel", amountMin: 0, amountMax: null, stepsCount: 2 },
  ];

  return (
    <div>
      <Link
        href="/settings"
        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Settings
      </Link>

      <h1 className="text-xl font-semibold mb-6">Approval Policies</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Existing policies */}
        <div>
          <h2 className="text-sm font-medium text-slate-300 mb-3">
            Active Policies
          </h2>
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full table-dense">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left">Category</th>
                  <th className="text-left">Amount Range</th>
                  <th className="text-center">Steps</th>
                </tr>
              </thead>
              <tbody>
                {existingPolicies.map((p, i) => (
                  <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 cursor-pointer">
                    <td className="text-slate-200">{p.category}</td>
                    <td className="text-slate-400 font-mono text-xs">
                      ${p.amountMin.toLocaleString()} –{" "}
                      {p.amountMax ? `$${p.amountMax.toLocaleString()}` : "∞"}
                    </td>
                    <td className="text-center text-slate-400">{p.stepsCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Policy builder */}
        <div>
          <h2 className="text-sm font-medium text-slate-300 mb-3">
            New Policy
          </h2>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Category</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                placeholder="e.g., IT Equipment"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Min Amount</label>
                <input
                  type="number"
                  value={amountMin}
                  onChange={(e) => setAmountMin(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Max Amount (blank = ∞)</label>
                <input
                  type="number"
                  value={amountMax}
                  onChange={(e) => setAmountMax(e.target.value ? Number(e.target.value) : "")}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  placeholder="No limit"
                />
              </div>
            </div>

            {/* Quote requirements */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresQuotes}
                  onChange={(e) => setRequiresQuotes(e.target.checked)}
                  className="rounded border-slate-600"
                />
                Require quotes
              </label>
              {requiresQuotes && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Min:</span>
                  <input
                    type="number"
                    min={2}
                    value={minQuoteCount}
                    onChange={(e) => setMinQuoteCount(Number(e.target.value))}
                    className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                  />
                </div>
              )}
            </div>

            {/* Approval route */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-slate-400">Approval Steps</label>
                <button
                  onClick={addStep}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                >
                  <Plus className="w-3 h-3" /> Add Step
                </button>
              </div>
              <div className="space-y-2">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-5">{i + 1}.</span>
                    <select
                      value={step.requiredRole}
                      onChange={(e) => updateStep(i, "requiredRole", e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 flex-1"
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <input
                      value={step.label}
                      onChange={(e) => updateStep(i, "label", e.target.value)}
                      placeholder="Step label (e.g., CFO)"
                      className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200"
                    />
                    <button
                      onClick={() => removeStep(i)}
                      disabled={steps.length <= 1}
                      className="p-1 text-slate-500 hover:text-red-400 disabled:opacity-30"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
              Save Policy (Governed)
            </button>
            <p className="text-[10px] text-slate-500">
              Policy changes are subject to governance approval when threshold &gt; 1
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
