"use client";

import { ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";

export default function RolesPage() {
  // Placeholder — will be wired to Convex queries
  const members = [
    { name: "Alice Chen", email: "alice@acme.com", roles: ["requester", "approver"] },
    { name: "Bob Smith", email: "bob@acme.com", roles: ["requester"] },
    { name: "Carol Davis", email: "carol@acme.com", roles: ["requester", "senior_approver"] },
    { name: "Dave Wilson", email: "dave@acme.com", roles: ["finance"] },
    { name: "Admin Jane", email: "jane@acme.com", roles: ["admin", "requester"] },
  ];

  const allRoles = ["requester", "approver", "senior_approver", "finance", "admin", "super_admin"];

  return (
    <div>
      <Link
        href="/settings"
        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Settings
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-semibold">Roles & Users</h1>
        <span className="text-xs text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full flex items-center gap-1">
          <Shield className="w-3 h-3" /> Governed
        </span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <table className="w-full table-dense">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left">User</th>
              <th className="text-left">Email</th>
              {allRoles.map((role) => (
                <th key={role} className="text-center text-[10px]">
                  {role.replace("_", " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.email} className="border-b border-slate-800/50">
                <td className="text-slate-200 font-medium">{member.name}</td>
                <td className="text-slate-400 text-xs">{member.email}</td>
                {allRoles.map((role) => (
                  <td key={role} className="text-center">
                    <input
                      type="checkbox"
                      checked={member.roles.includes(role)}
                      onChange={() => {/* governed mutation */}}
                      className="rounded border-slate-600"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500 mt-3">
        Role changes are subject to governance approval when the company governance threshold is greater than 1.
      </p>
    </div>
  );
}
