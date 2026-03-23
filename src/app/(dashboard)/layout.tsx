"use client";

import { Sidebar } from "@/components/ui/Sidebar";
import { UserButton } from "@clerk/nextjs";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, createContext, useContext } from "react";
import type { Id } from "../../../convex/_generated/dataModel";

interface CompanyContext {
  activeCompanyId: Id<"companies"> | null;
  setActiveCompanyId: (id: Id<"companies">) => void;
  userRoles: string[];
  companies: Array<{ _id: Id<"companies">; name: string; roles: string[] }>;
}

const CompanyCtx = createContext<CompanyContext>({
  activeCompanyId: null,
  setActiveCompanyId: () => {},
  userRoles: [],
  companies: [],
});

export function useCompany() {
  return useContext(CompanyCtx);
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const companiesData = useQuery(
    api.queries.myCompanies,
    isAuthenticated ? undefined : "skip"
  );
  const [activeIdx, setActiveIdx] = useState(0);

  const companies = (companiesData ?? []) as Array<{
    _id: Id<"companies">;
    name: string;
    slug: string;
    roles: string[];
  }>;

  const activeCompany = companies[activeIdx] ?? null;
  const activeCompanyId = activeCompany?._id ?? null;
  const userRoles = activeCompany?.roles ?? [];

  // Get badge counts
  const stats = useQuery(
    api.queries.dashboardStats,
    activeCompanyId ? { companyId: activeCompanyId } : "skip"
  );

  const badges: Record<string, number> = {
    actions: stats?.pendingApprovals ?? 0,
    governance: 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <CompanyCtx.Provider
      value={{
        activeCompanyId,
        setActiveCompanyId: (id) => {
          const idx = companies.findIndex((c) => c._id === id);
          if (idx >= 0) setActiveIdx(idx);
        },
        userRoles,
        companies,
      }}
    >
      <div className="flex min-h-screen">
        <Sidebar userRoles={userRoles} badges={badges} />
        <main className="flex-1 ml-56">
          {/* Top bar */}
          <header className="h-14 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-20">
            <div className="flex items-center gap-3">
              {companies.length > 1 ? (
                <select
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200"
                  value={activeIdx}
                  onChange={(e) => setActiveIdx(Number(e.target.value))}
                >
                  {companies.map((c, i) => (
                    <option key={c._id} value={i}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : activeCompany ? (
                <span className="text-sm text-slate-300 font-medium">
                  {activeCompany.name}
                </span>
              ) : (
                <span className="text-sm text-slate-500">Loading...</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </header>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </CompanyCtx.Provider>
  );
}
