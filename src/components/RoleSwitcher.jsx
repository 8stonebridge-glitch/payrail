import React from 'react';
import { useWorkflow } from '../context/useWorkflow';
import { Shield, Building2 } from 'lucide-react';

const RoleSwitcher = ({ onAfterChange }) => {
  const { state, actions } = useWorkflow();
  const { currentUser, users, companies } = state;

  const companyNames = currentUser.companies
    .map(cid => companies.find(c => c.id === cid)?.name)
    .filter(Boolean);

  return (
    <div className="glass-panel p-3 sm:p-4 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-black font-bold text-xs sm:text-sm flex-shrink-0" style={{ background: 'linear-gradient(135deg, #63e6be 0%, #38d9a9 100%)' }}>
            {currentUser.avatar}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-textPrimary truncate">{currentUser.name}</h2>
              {currentUser.role === 'Admin' && <Shield size={14} className="text-accentPurple flex-shrink-0" />}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="badge bg-accentBlue/15 text-accentBlue border-accentBlue/25 text-[0.6rem]">
                {currentUser.role}
              </span>
              <span className="flex items-center gap-1 text-[0.65rem] sm:text-xs text-textSecondary">
                <Building2 size={11} />
                {companyNames.length <= 2 ? companyNames.join(', ') : `${companyNames.length} companies`}
              </span>
            </div>
          </div>
        </div>

        <select
          className="input-field !w-full sm:!w-auto sm:min-w-[200px] text-sm"
          value={currentUser.id}
          onChange={(e) => {
            const user = users.find(u => u.id === e.target.value);
            if (user) {
              actions.setUser(user);
              onAfterChange?.(user);
            }
          }}
        >
          {users.map(u => (
            <option key={u.id} value={u.id}>
              {u.name} — {u.role}
            </option>
          ))}
        </select>
      </div>
      <p className="text-[0.65rem] text-textSecondary/60 mt-2.5 border-t border-border/50 pt-2">
        Demo role switcher — simulates different user personas for testing approval workflows
      </p>
    </div>
  );
};

export default RoleSwitcher;
