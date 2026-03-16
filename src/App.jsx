import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { WorkflowProvider } from './context/WorkflowContext';
import { useWorkflow } from './context/useWorkflow';
import RoleSwitcher from './components/RoleSwitcher';
import DashboardStats from './components/DashboardStats';
import RequestList from './components/RequestList';
import RequestDetailsModal from './components/RequestDetailsModal';
import RequestForm from './components/RequestForm';
import SettingsWorkspace from './components/SettingsWorkspace';
import BackendConnectionCard from './components/BackendConnectionCard';
import { Plus, Zap, X, SlidersHorizontal } from 'lucide-react';
import { STATUS_CONFIG } from './data/mockData';
import { api } from '../convex/_generated/api';

const MainApp = () => {
  const { state, actions } = useWorkflow();
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);
  const [activeView, setActiveView] = useState('workflow');

  const approveStepMutation = useMutation(api.requests.approveCurrentStep);
  const rejectStepMutation = useMutation(api.requests.rejectCurrentStep);
  const recallMutation = useMutation(api.requests.recallRequest);
  const resubmitMutation = useMutation(api.requests.resubmitRequest);
  const payLineItemMutation = useMutation(api.requests.payLineItem);

  const backendViewer = useQuery(
    api.settings.resolveDemoUserByEmail,
    state.currentUser?.email ? { email: state.currentUser.email } : 'skip',
  );
  const backendRequests = useQuery(
    api.requests.getVisibleRequestsForUser,
    backendViewer?.userId ? { userId: backendViewer.userId } : 'skip',
  );
  const backendStats = useQuery(
    api.requests.getDashboardStatsForUser,
    backendViewer?.userId ? { userId: backendViewer.userId } : 'skip',
  );

  const backendReady = Boolean(backendViewer?.userId && backendRequests && backendStats);
  const sourceRequests = backendReady ? backendRequests : [];
  const sourceStats = backendReady ? backendStats : null;

  const selectedRequest = selectedRequestId
    ? sourceRequests.find((request) => request.id === selectedRequestId) || null
    : null;

  const backendActions = backendViewer?.userId ? {
    approveStep: (requestId) => approveStepMutation({ userId: backendViewer.userId, requestId }),
    rejectStep: (requestId, reason) => rejectStepMutation({ userId: backendViewer.userId, requestId, reason }),
    recallRequest: (requestId) => recallMutation({ userId: backendViewer.userId, requestId }),
    resubmitRequest: (requestId) => resubmitMutation({ userId: backendViewer.userId, requestId }),
    payLineItem: (requestId, payeeId) => payLineItemMutation({ userId: backendViewer.userId, requestId, lineItemId: payeeId }),
  } : null;

  // Auto-close toast
  useEffect(() => {
    if (state.toast) {
      const timer = setTimeout(() => actions.clearToast(), 3500);
      return () => clearTimeout(timer);
    }
  }, [state.toast, actions]);

  // Scroll focused input into view when mobile keyboard opens
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    const handleFocusIn = (e) => {
      const el = e.target;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, []);

  const canCreateRequest = ['Admin', 'Supervisor', 'Team Lead', 'Head of Ops', 'Ops Manager', 'CEO', 'CFO', 'MD'].includes(state.currentUser.role);
  const disableActions = !backendReady;

  const handlePipelineClick = (statusKey) => {
    setStatusFilter(prev => prev === statusKey ? null : statusKey);
  };

  const handleRoleChange = () => {
    setSelectedRequestId(null);
    setShowNewRequestForm(false);
    setStatusFilter(null);
  };

  const handleViewToggle = () => {
    const nextView = activeView === 'workflow' ? 'settings' : 'workflow';
    if (nextView === 'settings') {
      setSelectedRequestId(null);
      setShowNewRequestForm(false);
      setStatusFilter(null);
    }
    setActiveView(nextView);
  };

  const filterLabel = statusFilter ? STATUS_CONFIG[statusFilter]?.label : null;

  return (
    <div className="min-h-[100dvh] overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-black font-extrabold text-sm" style={{ background: 'linear-gradient(135deg, #63e6be 0%, #38d9a9 100%)' }}>
              P
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-textPrimary tracking-tight">
                Payrail
              </h1>
              <p className="text-[11px] text-textSecondary font-medium tracking-wide">Approval Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleViewToggle}
              className={`btn ${activeView === 'settings' ? 'btn-primary' : 'btn-outline'} text-xs sm:text-sm`}
            >
              <SlidersHorizontal size={14} />
              {activeView === 'settings' ? 'Back to Workflow' : 'Settings'}
            </button>
          </div>
        </header>

        {/* Role Switcher */}
        <RoleSwitcher onAfterChange={handleRoleChange} />

        {import.meta.env.VITE_CONVEX_URL && <BackendConnectionCard />}

        {activeView === 'workflow' ? (
          <>
            {/* Dashboard Stats */}
            <DashboardStats
              activeFilter={statusFilter}
              onFilterChange={handlePipelineClick}
              stats={sourceStats || undefined}
            />

            {/* Section Header + New Request Button */}
            <div className="flex items-center justify-between pt-1 sm:pt-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-textPrimary flex items-center gap-2 flex-shrink-0">
                  <Zap size={16} className="text-accentTeal" />
                  {statusFilter ? '' : 'Recent '}Requests
                </h2>
                {filterLabel && (
                  <button
                    onClick={() => setStatusFilter(null)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] border border-border text-xs font-semibold text-textPrimary hover:bg-white/[0.1] transition-colors"
                  >
                    {filterLabel}
                    <X size={12} className="text-textSecondary" />
                  </button>
                )}
              </div>
              {canCreateRequest && (
                <button
                  onClick={() => setShowNewRequestForm(true)}
                  className="btn btn-teal text-xs sm:text-sm px-3 sm:px-4"
                >
                  <Plus size={14} /> New Request
                </button>
              )}
            </div>

            {/* Request List */}
            <RequestList
              onSelect={(request) => setSelectedRequestId(request.id)}
              statusFilter={statusFilter}
              requests={sourceRequests}
              highlightActionable={false}
            />
          </>
        ) : (
          <SettingsWorkspace onClose={() => setActiveView('workflow')} />
        )}

      </div>

      {/* Toast */}
      {state.toast && (
        <div className={`toast toast--${state.toast.type || 'success'}`}>
          {state.toast.message}
        </div>
      )}

      {/* Safe area bottom spacer for mobile */}
      <div className="h-4 sm:hidden" />

      {/* Modals */}
      {selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          onClose={() => setSelectedRequestId(null)}
          readOnly={disableActions}
          actionOverrides={disableActions ? {} : backendActions || {}}
        />
      )}

      {showNewRequestForm && (
        <RequestForm
          onClose={() => setShowNewRequestForm(false)}
          backendUserId={backendViewer?.userId || null}
        />
      )}
    </div>
  );
};

function App() {
  return (
    <WorkflowProvider>
      <MainApp />
    </WorkflowProvider>
  );
}

export default App;
