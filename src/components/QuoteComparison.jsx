import React from 'react';
import { formatNaira, getLowestQuoteIndex } from '../data/mockData';
import { Award, Star, AlertTriangle } from 'lucide-react';

const QuoteComparison = ({ quotes, quoteJustification }) => {
  if (!quotes || quotes.length === 0) return null;

  const lowestIdx = getLowestQuoteIndex(quotes);
  const selectedIdx = quotes.findIndex(q => q.selected);
  const selectedIsNotLowest = selectedIdx >= 0 && lowestIdx >= 0 && selectedIdx !== lowestIdx;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface">
              <th className="px-3 py-2.5 text-left text-[0.65rem] font-semibold text-textSecondary uppercase tracking-wider border-b border-border">Vendor</th>
              <th className="px-3 py-2.5 text-right text-[0.65rem] font-semibold text-textSecondary uppercase tracking-wider border-b border-border">Amount</th>
              <th className="px-3 py-2.5 text-left text-[0.65rem] font-semibold text-textSecondary uppercase tracking-wider border-b border-border hidden sm:table-cell">Ref</th>
              <th className="px-3 py-2.5 text-left text-[0.65rem] font-semibold text-textSecondary uppercase tracking-wider border-b border-border hidden md:table-cell">Valid Until</th>
              <th className="px-3 py-2.5 text-left text-[0.65rem] font-semibold text-textSecondary uppercase tracking-wider border-b border-border hidden lg:table-cell">Notes</th>
              <th className="px-3 py-2.5 text-center text-[0.65rem] font-semibold text-textSecondary uppercase tracking-wider border-b border-border">Status</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q, i) => {
              const isSelected = q.selected;
              const isLowest = i === lowestIdx;

              return (
                <tr key={q.id || i} className={`border-b border-border last:border-0 ${isSelected ? 'bg-accentBlue/[0.06]' : ''} hover:bg-white/[0.02] transition-colors`}>
                  <td className="px-3 py-3 font-medium text-textPrimary">
                    {q.vendor}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold whitespace-nowrap">
                    <span className={isLowest ? 'text-accentEmerald' : 'text-textPrimary'}>
                      {formatNaira(q.amount)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-textSecondary text-xs hidden sm:table-cell font-mono">
                    {q.quoteRef || '—'}
                  </td>
                  <td className="px-3 py-3 text-textSecondary text-xs hidden md:table-cell">
                    {q.validityDate || '—'}
                  </td>
                  <td className="px-3 py-3 text-textSecondary text-xs hidden lg:table-cell max-w-[200px] truncate">
                    {q.notes || '—'}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {isLowest && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-bold bg-accentEmerald/15 text-accentEmerald border border-accentEmerald/25">
                          <Award size={10} /> Lowest
                        </span>
                      )}
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-bold bg-accentBlue/15 text-accentBlue border border-accentBlue/25">
                          <Star size={10} /> Selected
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Justification */}
      {selectedIsNotLowest && quoteJustification && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-accentAmber/[0.08] border border-accentAmber/20">
          <AlertTriangle size={16} className="text-accentAmber flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-accentAmber uppercase tracking-wider mb-1">Vendor Selection Justification</p>
            <p className="text-sm text-accentAmber/80">{quoteJustification}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteComparison;
