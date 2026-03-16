import React, { useState } from 'react';
import { useWorkflow } from '../context/useWorkflow';
import StatusBadge from './StatusBadge';
import TimelinePanel from './TimelinePanel';
import QuoteComparison from './QuoteComparison';
import { formatNaira, formatNairaCompact, formatDate, CATEGORY_COLORS } from '../data/mockData';
import {
  X, CheckCircle, XCircle, Clock, AlertCircle, Banknote, History,
  FileBarChart, RotateCcw, ArrowRightCircle, DollarSign, Shield,
} from 'lucide-react';

const RequestDetailsModal = ({
  request,
  onClose,
  readOnly = false,
  actionOverrides = {},
}) => {
  const { actions, selectors } = useWorkflow();
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!request) return null;

  const userCanApprove = selectors.canActOnStep(request);
  const userCanPay = selectors.canPayLineItem(request);
  const userCanRecall = selectors.canRecall(request);
  const userCanResubmit = selectors.canResubmit(request);

  const disbursed = request.payees.filter(p => p.isPaid).reduce((s, p) => s + p.amount, 0);
  const pending = request.amount - disbursed;
  const paidCount = request.payees.filter(p => p.isPaid).length;
  const catConfig = CATEGORY_COLORS[request.category] || { text: 'text-textSecondary' };

  const currentStep = request.route?.[request.currentStepIndex];

  const handleApprove = () => {
    if (readOnly) return;
    const approve = actionOverrides.approveStep || actions.approveStep;
    approve(request.id);
    actions.showToast(`Step approved successfully`, 'success');
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    if (readOnly) return;
    const reject = actionOverrides.rejectStep || actions.rejectStep;
    reject(request.id, rejectReason);
    actions.showToast('Request rejected', 'danger');
    setShowRejectForm(false);
    setRejectReason('');
  };

  const handleRecall = () => {
    if (readOnly) return;
    const recall = actionOverrides.recallRequest || actions.recallRequest;
    recall(request.id);
    actions.showToast('Request recalled', 'warning');
  };

  const handleResubmit = () => {
    if (readOnly) return;
    const resubmit = actionOverrides.resubmitRequest || actions.resubmitRequest;
    resubmit(request.id);
    actions.showToast('Request resubmitted', 'info');
  };

  const handlePay = (payeeId) => {
    if (readOnly) return;
    const pay = actionOverrides.payLineItem || actions.payLineItem;
    pay(request.id, payeeId);
    actions.showToast('Line item marked as paid', 'success');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 p-4 sm:p-6 overflow-y-auto animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-[1020px] bg-background border border-border rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] overflow-hidden my-4 animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-surface">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <h2 className="text-base sm:text-xl font-bold text-textPrimary">{request.id}</h2>
            <StatusBadge status={request.status} />
          </div>
          <button onClick={onClose} className="btn btn-ghost"><X size={20} /></button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6" style={{ maxHeight: 'calc(90dvh - 80px)' }}>

          {/* Description & Meta */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-[0.7rem] font-semibold text-textSecondary uppercase tracking-wider mb-1">Description</p>
                <p className="text-base font-medium text-textPrimary">{request.description}</p>
              </div>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div>
                  <p className="text-[0.65rem] sm:text-[0.7rem] font-semibold text-textSecondary uppercase tracking-wider mb-1">Category & Policy</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold text-sm ${catConfig.text}`}>{request.category}</span>
                    <span className="text-textSecondary/50">·</span>
                    <span className="text-xs text-textSecondary">{request.policyName}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[0.65rem] sm:text-[0.7rem] font-semibold text-textSecondary uppercase tracking-wider mb-1">Company</p>
                  <p className="font-medium text-sm text-textPrimary">{request.companyName}</p>
                </div>
              </div>

              {/* Rejection Notice */}
              {request.rejectionReason && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-accentRose/[0.08] border border-accentRose/20">
                  <XCircle size={16} className="text-accentRose flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-accentRose uppercase tracking-wider mb-0.5">Rejection Reason</p>
                    <p className="text-sm text-accentRose/80">{request.rejectionReason}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <MiniStat label="Total Amount" value={formatNairaCompact(request.amount)} color="accentBlue" />
              <MiniStat label="Disbursed" value={formatNairaCompact(disbursed)} color="accentEmerald" />
              <MiniStat label="Pending" value={formatNairaCompact(pending)} color="accentAmber" />
              <MiniStat label="Payees Paid" value={`${paidCount} / ${request.payees.length}`} color="accentPurple" />
            </div>
          </div>

          {/* Two Column: Approval + Payees */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Left: Approval Flow + Actions */}
            <div className="space-y-5">
              {/* Approval Route */}
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-border mb-4">
                  <History size={16} className="text-textSecondary" />
                  <h3 className="text-sm font-bold text-textPrimary">Approval Flow</h3>
                </div>
                <div className="space-y-3">
                  {request.route.map((step, idx) => {
                    let icon, textClass;
                    if (step.status === 'approved') {
                      icon = <CheckCircle size={16} className="text-accentEmerald" />;
                      textClass = 'text-textPrimary';
                    } else if (step.status === 'rejected') {
                      icon = <XCircle size={16} className="text-accentRose" />;
                      textClass = 'text-accentRose';
                    } else if (step.status === 'pending' && request.status === 'in_approval') {
                      icon = <AlertCircle size={16} className="text-accentBlue" />;
                      textClass = 'text-accentBlue';
                    } else {
                      icon = <Clock size={16} className="text-textSecondary/50" />;
                      textClass = 'text-textSecondary/60';
                    }

                    const actorName = step.actorName || (step.actorId ? selectors.getUserById(step.actorId)?.name : null);

                    return (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="mt-0.5">{icon}</div>
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${textClass}`}>
                            Step {step.step}: {step.role}
                          </p>
                          {step.status === 'approved' && (
                            <p className="text-xs text-textSecondary mt-0.5">
                              Approved {actorName ? `by ${actorName}` : ''} {step.date ? `· ${formatDate(step.date)}` : ''}
                            </p>
                          )}
                          {step.status === 'rejected' && (
                            <p className="text-xs text-accentRose/70 mt-0.5">
                              Rejected {actorName ? `by ${actorName}` : ''}
                            </p>
                          )}
                          {step.status === 'pending' && request.status === 'in_approval' && (
                            <p className="text-xs font-semibold text-accentBlue mt-0.5 animate-pulse-glow">Awaiting action</p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Finance step indicator */}
                  {request.status === 'awaiting_finance' && (
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5"><Shield size={16} className="text-accentAmber" /></div>
                      <div>
                        <p className="font-medium text-sm text-accentAmber">Finance Disbursement</p>
                        <p className="text-xs text-textSecondary mt-0.5">Awaiting line item payments</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Panel */}
              {userCanApprove && !readOnly && (
                <div className="p-4 rounded-xl bg-accentBlue/[0.05] border border-accentBlue/20">
                  <p className="text-xs font-bold text-accentBlue uppercase tracking-wider mb-3">
                    Action Required: {currentStep?.role}
                  </p>
                  {!showRejectForm ? (
                    <div className="flex flex-col xs:flex-row gap-2">
                      <button onClick={handleApprove} className="btn btn-success flex-1"><CheckCircle size={16} /> Approve</button>
                      <button onClick={() => setShowRejectForm(true)} className="btn btn-danger flex-1"><XCircle size={16} /> Reject</button>
                    </div>
                  ) : (
                    <div className="space-y-3 animate-slide-up">
                      <textarea
                        className="input-field min-h-[60px] resize-y"
                        placeholder="Reason for rejection..."
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => setShowRejectForm(false)} className="btn btn-outline flex-1">Cancel</button>
                        <button onClick={handleReject} disabled={!rejectReason.trim()} className="btn btn-danger flex-1">Confirm Rejection</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Recall / Resubmit */}
              {(userCanRecall || userCanResubmit) && !readOnly && (
                <div className="flex gap-2">
                  {userCanRecall && (
                    <button onClick={handleRecall} className="btn btn-amber flex-1">
                      <RotateCcw size={16} /> Recall Request
                    </button>
                  )}
                  {userCanResubmit && (
                    <button onClick={handleResubmit} className="btn btn-primary flex-1">
                      <ArrowRightCircle size={16} /> Resubmit
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right: Payees */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <div className="flex items-center gap-2">
                  <Banknote size={16} className="text-textSecondary" />
                  <h3 className="text-sm font-bold text-textPrimary">Payees ({request.payees.length})</h3>
                </div>
                <span className="text-xs text-textSecondary">{paidCount}/{request.payees.length} paid</span>
              </div>

              <div className="space-y-3">
                {request.payees.map(item => (
                  <div
                    key={item.id}
                    className={`glass-panel p-4 transition-all duration-200 ${item.isPaid ? 'border-l-[3px] border-l-accentEmerald' : 'border-l-[3px] border-l-border'}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-sm text-textPrimary">{item.name}</p>
                      <p className="font-bold text-sm text-textPrimary whitespace-nowrap">{formatNaira(item.amount)}</p>
                    </div>
                    <p className="text-xs text-textSecondary mb-2">{item.bank} · {item.accountNumber}</p>

                    {item.isPaid ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-accentEmerald">
                        <CheckCircle size={13} />
                        <span>Paid · Ref: {item.ref}</span>
                      </div>
                    ) : userCanPay && !readOnly ? (
                      <button
                        onClick={() => handlePay(item.id)}
                        className="btn btn-success w-full text-xs py-1.5 mt-1"
                      >
                        <DollarSign size={14} /> Mark as Paid
                      </button>
                    ) : (
                      <p className="text-xs font-semibold text-accentAmber">Unpaid</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quotation Comparison */}
          {request.quotes && request.quotes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-border mb-4">
                <FileBarChart size={16} className="text-textSecondary" />
                <h3 className="text-sm font-bold text-textPrimary">Quotation Comparison</h3>
              </div>
              <QuoteComparison quotes={request.quotes} quoteJustification={request.quoteJustification} />
            </div>
          )}

          {/* Audit Timeline */}
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-border mb-4">
              <History size={16} className="text-textSecondary" />
              <h3 className="text-sm font-bold text-textPrimary">Audit Trail</h3>
            </div>
            <TimelinePanel timeline={request.timeline} />
          </div>
        </div>
      </div>
    </div>
  );
};

const MINI_STAT_STYLES = {
  accentBlue:    { gradient: 'from-accentBlue',    text: 'text-textPrimary' },
  accentEmerald: { gradient: 'from-accentEmerald',  text: 'text-accentEmerald' },
  accentAmber:   { gradient: 'from-accentAmber',    text: 'text-accentAmber' },
  accentPurple:  { gradient: 'from-accentPurple',   text: 'text-accentPurple' },
};

const MiniStat = ({ label, value, color }) => {
  const styles = MINI_STAT_STYLES[color] || { gradient: 'from-accentBlue', text: 'text-textPrimary' };
  return (
    <div className="glass-panel p-2.5 sm:p-3.5 relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${styles.gradient} to-transparent`} />
      <p className="text-[0.6rem] sm:text-[0.65rem] font-semibold text-textSecondary uppercase tracking-wider mb-0.5 sm:mb-1">{label}</p>
      <p className={`text-sm sm:text-lg font-bold ${styles.text} truncate`}>{value}</p>
    </div>
  );
};

export default RequestDetailsModal;
