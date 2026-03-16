import React from 'react';
import { useWorkflow } from '../context/useWorkflow';
import { CheckCircle, XCircle, Clock, FileText, DollarSign, RotateCcw, Cpu, ArrowRightCircle } from 'lucide-react';
import { formatDateTime } from '../data/mockData';

const TimelinePanel = ({ timeline }) => {
  const { selectors } = useWorkflow();

  const getIconAndStyle = (action) => {
    const a = action.toLowerCase();
    if (a.includes('approved'))  return { icon: <CheckCircle size={14} />, style: 'bg-accentEmerald/15 text-accentEmerald' };
    if (a.includes('rejected'))  return { icon: <XCircle size={14} />,     style: 'bg-accentRose/15 text-accentRose' };
    if (a.includes('submitted')) return { icon: <FileText size={14} />,    style: 'bg-accentBlue/15 text-accentBlue' };
    if (a.includes('paid'))      return { icon: <DollarSign size={14} />,  style: 'bg-accentEmerald/15 text-accentEmerald' };
    if (a.includes('recalled'))  return { icon: <RotateCcw size={14} />,   style: 'bg-accentAmber/15 text-accentAmber' };
    if (a.includes('resubmit'))  return { icon: <ArrowRightCircle size={14} />, style: 'bg-accentBlue/15 text-accentBlue' };
    if (a.includes('route') || a.includes('quote') || a.includes('complete') || a.includes('system'))
      return { icon: <Cpu size={14} />, style: 'bg-accentPurple/15 text-accentPurple' };
    return { icon: <Clock size={14} />, style: 'bg-surfaceHover text-textSecondary' };
  };

  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="space-y-0">
      {timeline.map((event, idx) => {
        const { icon, style } = getIconAndStyle(event.action);
        const actor = event.actorId === 'system'
          ? 'System'
          : selectors.getUserById(event.actorId)?.name || event.actorId;
        const isLast = idx === timeline.length - 1;

        return (
          <div key={event.id} className="flex gap-3 relative pb-4">
            {/* Connector line */}
            {!isLast && (
              <div className="absolute left-[13px] top-7 bottom-0 w-px bg-border" />
            )}

            {/* Dot */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${style}`}>
              {icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-textPrimary">{event.action}</p>
                  {event.role && (
                    <p className="text-[0.7rem] text-textSecondary font-semibold uppercase tracking-wider mt-0.5">
                      via {event.role}
                    </p>
                  )}
                  {event.note && (
                    <p className={`text-xs mt-1 px-2 py-1 rounded inline-block ${
                      event.action.toLowerCase().includes('reject')
                        ? 'bg-accentRose/10 text-accentRose border border-accentRose/20'
                        : 'text-textSecondary bg-surface'
                    }`}>
                      {event.note}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className="text-[0.65rem] text-textSecondary whitespace-nowrap">
                    {formatDateTime(event.date)}
                  </span>
                  {actor !== 'System' && (
                    <p className="text-[0.6rem] text-textSecondary/70 mt-0.5">{actor}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TimelinePanel;
