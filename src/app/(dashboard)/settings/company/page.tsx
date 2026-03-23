"use client";

import { ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";

export default function CompanyPage() {
  return (
    <div className="max-w-xl">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Settings
      </Link>

      <h1 className="text-xl font-semibold mb-6">Company Settings</h1>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Company Name</label>
          <input
            defaultValue="Acme Corp"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Governance Threshold
          </label>
          <p className="text-[10px] text-slate-500 mb-2">
            How many admins must approve system changes (policy, role, rule changes).
            Set to 1 for immediate application. Set to 2+ for peer review.
          </p>
          <select
            defaultValue={2}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
          >
            <option value={1}>1 — Apply immediately (no peer review)</option>
            <option value={2}>2 — Require 1 additional admin approval</option>
            <option value={3}>3 — Require 2 additional admin approvals</option>
            <option value={4}>4 — Require 3 additional admin approvals</option>
          </select>
        </div>

        <div className="pt-3 border-t border-slate-800">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
            <Shield className="w-4 h-4" /> Save (Governed)
          </button>
          <p className="text-[10px] text-slate-500 mt-2">
            Governance threshold changes always require governed approval, even if the current threshold is 1.
          </p>
        </div>
      </div>
    </div>
  );
}
