import React from 'react';
import { useQuery } from 'convex/react';
import { AlertCircle, CheckCircle2, Database, LoaderCircle } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { useWorkflow } from '../context/useWorkflow';

const BackendConnectionCard = () => {
  const { state } = useWorkflow();
  const demoUser = state.currentUser;

  const seedStatus = useQuery(api.seed.seedStatus, {});
  const backendViewer = useQuery(
    api.settings.resolveDemoUserByEmail,
    demoUser?.email ? { email: demoUser.email } : 'skip',
  );
  const backendStats = useQuery(
    api.requests.getDashboardStatsForUser,
    backendViewer?.userId ? { userId: backendViewer.userId } : 'skip',
  );

  const isLoading =
    seedStatus === undefined ||
    backendViewer === undefined ||
    (backendViewer?.userId && backendStats === undefined);

  return (
    <section className="glass-panel p-4 sm:p-5 animate-slide-up">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-textPrimary">
            <Database size={16} className="text-accentTeal" />
            <h3 className="text-sm sm:text-base font-semibold">Convex Backend</h3>
          </div>
          <p className="text-xs sm:text-sm text-textSecondary">
            Live backend check for the current demo persona. The main workflow is still local-state driven for now.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusPill
            tone={seedStatus?.isSeeded ? 'success' : 'warn'}
            icon={seedStatus?.isSeeded ? CheckCircle2 : AlertCircle}
            label={seedStatus?.isSeeded ? 'Seeded workspace' : 'Seed data missing'}
          />
          <StatusPill
            tone={backendViewer ? 'success' : 'warn'}
            icon={backendViewer ? CheckCircle2 : AlertCircle}
            label={backendViewer ? 'Demo user mapped' : 'No backend user match'}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <InfoCard
          title="Current demo user"
          value={demoUser?.name || 'No user selected'}
          meta={demoUser?.email || 'No email available'}
        />
        <InfoCard
          title="Backend user"
          value={
            isLoading
              ? 'Checking...'
              : backendViewer?.name || 'Not found in Convex'
          }
          meta={
            backendViewer?.assignments?.length
              ? backendViewer.assignments
                  .map((assignment) => `${assignment.role} (${assignment.companyTag})`)
                  .join(' · ')
              : 'No backend assignments yet'
          }
        />
        <InfoCard
          title="Visible backend requests"
          value={
            backendStats === undefined
              ? '...'
              : String(backendStats.requestCount)
          }
          meta={
            backendStats === undefined
              ? 'Waiting for backend stats'
              : `${backendStats.actionable} actionable · ${backendStats.paidPayees}/${backendStats.totalPayees} payees paid`
          }
        />
      </div>

      {isLoading && (
        <div className="mt-4 flex items-center gap-2 text-xs text-textSecondary">
          <LoaderCircle size={14} className="animate-spin text-accentBlue" />
          Checking Convex connection and demo identity mapping...
        </div>
      )}
    </section>
  );
};

const StatusPill = (props) => {
  const { tone, label } = props;
  const Icon = props.icon;
  const toneClasses = {
    success: 'bg-accentEmerald/[0.14] text-accentEmerald border-accentEmerald/20',
    warn: 'bg-accentAmber/[0.14] text-accentAmber border-accentAmber/20',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${toneClasses[tone]}`}>
      <Icon size={12} />
      {label}
    </div>
  );
};

const InfoCard = ({ title, value, meta }) => (
  <div className="rounded-2xl border border-border bg-white/[0.03] p-3 sm:p-4">
    <p className="text-[11px] uppercase tracking-[0.18em] text-textSecondary">{title}</p>
    <p className="mt-2 text-base font-semibold text-textPrimary">{value}</p>
    <p className="mt-1 text-xs text-textSecondary">{meta}</p>
  </div>
);

export default BackendConnectionCard;
