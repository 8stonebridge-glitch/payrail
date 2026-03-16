import React from 'react';
import { useWorkflow } from '../context/useWorkflow';
import StatusBadge from './StatusBadge';
import { formatNairaCompact, formatDate, CATEGORY_COLORS } from '../data/mockData';
import { FileText, Zap } from 'lucide-react';

const RequestList = ({ onSelect, statusFilter, requests: overrideRequests, highlightActionable = true }) => {
  const { selectors } = useWorkflow();
  const sourceRequests = overrideRequests ?? selectors.getVisibleRequests();
  const visibleRequests = statusFilter ? sourceRequests.filter(r => r.status === statusFilter) : sourceRequests;
  const actionIds = highlightActionable
    ? new Set(selectors.getMyActions().map(r => r.id))
    : new Set();

  if (visibleRequests.length === 0) {
    return (
      <div className="glass-panel p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-surfaceHover flex items-center justify-center mx-auto mb-4">
          <FileText size={24} className="text-textSecondary" />
        </div>
        <h3 className="text-lg font-semibold text-textPrimary">{statusFilter ? 'No matching requests' : 'No requests found'}</h3>
        <p className="text-textSecondary mt-1 text-sm">{statusFilter ? 'No requests with this status.' : 'Create a new payment request to get started.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-slide-up">
      {visibleRequests.map((req) => {
        const isActionable = actionIds.has(req.id);
        const catConfig = CATEGORY_COLORS[req.category] || { dot: 'bg-textSecondary', text: 'text-textSecondary' };

        return (
          <div
            key={req.id}
            onClick={() => onSelect(req)}
            className={`glass-panel px-3 py-3 sm:px-5 sm:py-4 cursor-pointer transition-all duration-300 hover:bg-surfaceHover/80 sm:hover:translate-x-1 hover:shadow-lg group
              ${isActionable ? 'border-l-[3px] border-l-accentBlue bg-accentBlue/[0.03]' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              {/* Left content */}
              <div className="min-w-0 flex-1">
                {/* ID + badges */}
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                  <span className="font-bold text-sm sm:text-base text-textPrimary">{req.id}</span>
                  <StatusBadge status={req.status} />
                  {isActionable && (
                    <span className="badge bg-accentBlue/20 text-accentBlue border-accentBlue/30 animate-pulse-glow text-[0.55rem]">
                      <Zap size={9} className="mr-0.5" /> Action Required
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-textSecondary truncate mb-1.5">{req.description}</p>

                {/* Meta row */}
                <div className="flex items-center gap-1.5 sm:gap-3 text-[0.6rem] sm:text-xs font-medium">
                  <span className={`flex items-center gap-1 ${catConfig.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${catConfig.dot}`} />
                    {req.category}
                  </span>
                  <span className="text-textSecondary/40">·</span>
                  <span className="text-textSecondary truncate">{req.companyName}</span>
                  <span className="text-textSecondary/40 hidden xs:inline">·</span>
                  <span className="text-textSecondary hidden xs:inline">{formatDate(req.date)}</span>
                </div>
              </div>

              {/* Right: Amount */}
              <div className="text-right flex-shrink-0">
                <div className="text-base sm:text-lg font-bold text-textPrimary whitespace-nowrap">{formatNairaCompact(req.amount)}</div>
                <div className="text-[0.6rem] sm:text-xs text-textSecondary mt-0.5">{req.payees.length} {req.payees.length === 1 ? 'Payee' : 'Payees'}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RequestList;
