import React from 'react';
import { useWorkflow } from '../context/useWorkflow';
import { formatNairaCompact, STATUS_CONFIG } from '../data/mockData';
import { Wallet, CreditCard, Activity, Users2, Zap } from 'lucide-react';

const STATUS_BAR_COLORS = {
  draft:            'bg-white/30',
  in_approval:      'bg-accentPurple',
  awaiting_finance: 'bg-accentAmber',
  partially_paid:   'bg-accentAmber/70',
  paid:             'bg-accentEmerald',
  rejected:         'bg-accentRose',
  recalled:         'bg-accentRose/70',
};

const STATUS_ACTIVE_RING = {
  draft:            'ring-white/20',
  in_approval:      'ring-accentPurple/40',
  awaiting_finance: 'ring-accentAmber/40',
  partially_paid:   'ring-accentAmber/30',
  paid:             'ring-accentEmerald/40',
  rejected:         'ring-accentRose/40',
  recalled:         'ring-accentRose/30',
};

const DashboardStats = ({ activeFilter, onFilterChange, stats: overrideStats }) => {
  const { selectors } = useWorkflow();
  const stats = overrideStats ?? selectors.getDashboardStats();

  return (
    <div className="space-y-4 sm:space-y-5 animate-slide-up">
      {/* Main Stats Grid */}
      <div className={`grid gap-2.5 xs:gap-3 sm:gap-4 ${stats.isFinance ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
        {stats.isFinance ? (
          <>
            <StatCard icon={<Wallet size={16} />} iconColor="text-accentBlue"
              label="Total Volume" value={formatNairaCompact(stats.totalValue)} sub={`${stats.requestCount} requests`} />

            <StatCard icon={<CreditCard size={16} />} iconColor="text-accentEmerald"
              label="Disbursed" value={formatNairaCompact(stats.disbursed)}
              sub={<ProgressBar pct={stats.disbursedPct} />} />

            <StatCard icon={<Activity size={16} />} iconColor="text-accentAmber"
              label="Pending Unpaid" value={formatNairaCompact(stats.pending)} sub="Awaiting approvals & payment" />

            <StatCard icon={<Users2 size={16} />} iconColor="text-accentPurple"
              label="Payees Paid" value={`${stats.paidPayees} / ${stats.totalPayees}`} sub="Total line items cleared" />
          </>
        ) : (
          <>
            <StatCard icon={<Wallet size={16} />} iconColor="text-accentBlue"
              label="Total Requests" value={stats.requestCount} sub="Within your organization" />

            <StatCard icon={<Zap size={16} />} iconColor="text-accentAmber"
              label="Actionable" value={stats.actionable} sub="Steps requiring your attention" />

            <StatCard icon={<Activity size={16} />} iconColor="text-accentPurple"
              label="Pending" value={stats.byStatus?.in_approval?.count || 0} sub="In approval pipeline" />
          </>
        )}
      </div>

      {/* Pipeline Overview */}
      <div className="glass-panel p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] font-semibold text-textSecondary uppercase tracking-wider">Pipeline</h3>
          {activeFilter && (
            <button
              onClick={() => onFilterChange(null)}
              className="text-[10px] font-semibold text-accentTeal hover:text-accentTeal/80 transition-colors"
            >
              Clear filter
            </button>
          )}
        </div>
        <div className="space-y-1">
          {/* All row */}
          <button
            onClick={() => onFilterChange(null)}
            className={`flex items-center gap-3 w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-left transition-all duration-200 group
              ${!activeFilter
                ? 'bg-white/[0.06] ring-1 ring-accentTeal/30'
                : 'hover:bg-white/[0.03] opacity-40'
              }
            `}
          >
            <span className={`text-[11px] sm:text-xs font-medium w-[90px] sm:w-[110px] truncate transition-colors ${!activeFilter ? 'text-textPrimary' : 'text-textSecondary group-hover:text-textPrimary/80'}`}>
              All
            </span>
            <div className="flex-1 h-[5px] bg-white/[0.04] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 bg-accentTeal/60"
                style={{ width: '100%' }}
              />
            </div>
            <span className={`text-[11px] sm:text-xs font-semibold w-5 text-right tabular-nums transition-colors ${!activeFilter ? 'text-textPrimary' : 'text-textPrimary/80'}`}>
              {stats.requestCount}
            </span>
          </button>

          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const data = stats.byStatus?.[key];
            if (!data || data.count === 0) return null;
            const pct = stats.requestCount > 0 ? Math.round((data.count / stats.requestCount) * 100) : 0;
            const isActive = activeFilter === key;
            const isDimmed = activeFilter && !isActive;

            return (
              <button
                key={key}
                onClick={() => onFilterChange(key)}
                className={`flex items-center gap-3 w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-left transition-all duration-200 group
                  ${isActive
                    ? `bg-white/[0.06] ring-1 ${STATUS_ACTIVE_RING[key] || 'ring-white/10'}`
                    : 'hover:bg-white/[0.03]'
                  }
                  ${isDimmed ? 'opacity-40' : 'opacity-100'}
                `}
              >
                <span className={`text-[11px] sm:text-xs font-medium w-[90px] sm:w-[110px] truncate transition-colors ${isActive ? 'text-textPrimary' : 'text-textSecondary group-hover:text-textPrimary/80'}`}>
                  {config.label}
                </span>
                <div className="flex-1 h-[5px] bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${STATUS_BAR_COLORS[key] || 'bg-textSecondary'}`}
                    style={{ width: `${pct}%`, minWidth: data.count > 0 ? '8px' : '0' }}
                  />
                </div>
                <span className={`text-[11px] sm:text-xs font-semibold w-5 text-right tabular-nums transition-colors ${isActive ? 'text-textPrimary' : 'text-textPrimary/80'}`}>
                  {data.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, iconColor, label, value, sub }) => (
  <div className="glass-panel p-3 xs:p-4 sm:p-5 relative">
    <div className="flex items-center justify-between mb-2 sm:mb-3">
      <span className="text-[10px] sm:text-[11px] font-semibold text-textSecondary uppercase tracking-wider">{label}</span>
      <span className={`${iconColor} opacity-50`}>{icon}</span>
    </div>
    <div className="text-sm xs:text-base sm:text-2xl font-bold text-textPrimary truncate tracking-tight">{value}</div>
    {typeof sub === 'string' ? (
      <div className="text-[10px] sm:text-[11px] text-textSecondary mt-1 line-clamp-2">{sub}</div>
    ) : (
      <div className="mt-2">{sub}</div>
    )}
  </div>
);

const ProgressBar = ({ pct }) => (
  <div>
    <div className="flex justify-between text-[10px] sm:text-[11px] text-textSecondary mb-1">
      <span>Progress</span>
      <span className="tabular-nums">{pct}%</span>
    </div>
    <div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden">
      <div
        className="h-full bg-accentEmerald rounded-full transition-all duration-1000"
        style={{ width: `${pct}%` }}
      />
    </div>
  </div>
);

export default DashboardStats;
