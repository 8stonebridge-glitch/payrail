import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useWorkflow } from '../context/useWorkflow';
import { BANKS, formatDateTime } from '../data/mockData';
import { api } from '../../convex/_generated/api';
import {
  Settings,
  Building2,
  Users2,
  FileText,
  Shield,
  SlidersHorizontal,
  Wallet,
  History,
  Save,
  Plus,
  Search,
  ChevronRight,
  Check,
  X,
} from 'lucide-react';

const ROLE_OPTIONS = ['Admin', 'Supervisor', 'Head of Ops', 'CFO', 'CEO', 'MD', 'Finance', 'Team Lead', 'Ops Manager'];

const SETTINGS_SECTIONS = [
  { id: 'companies', label: 'Company Settings', icon: Building2 },
  { id: 'users', label: 'Users & Roles', icon: Users2 },
  { id: 'policies', label: 'Approval Policies', icon: FileText },
  { id: 'procurement', label: 'Procurement Rules', icon: Shield },
  { id: 'request-rules', label: 'Request Rules', icon: SlidersHorizontal },
  { id: 'saved-accounts', label: 'My Saved Accounts', icon: Wallet },
  { id: 'audit', label: 'Audit Log', icon: History },
];

function toggleValue(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function emptyCompany(categories) {
  return {
    name: '',
    tag: '',
    active: true,
    procurementEnabled: false,
    enabledCategories: categories.slice(0, 1),
  };
}

function emptyUser() {
  return {
    name: '',
    email: '',
    role: 'Supervisor',
    companies: [],
    active: true,
  };
}

function createEmptyPolicy(companies, categories) {
  const companyId = companies[0]?.id || '';
  return {
    companyId,
    name: '',
    category: categories[0] || '',
    min: 0,
    max: 0,
    steps: ['Supervisor'],
    requiresFinance: true,
    requiredQuotes: 0,
    quoteRuleLabel: '',
    requireJustificationIfNotLowest: false,
    allowSingleSourceException: false,
    active: true,
  };
}

function SettingsWorkspace({ onClose }) {
  const { state, actions, selectors } = useWorkflow();
  const [activeSection, setActiveSection] = useState('companies');
  const [selectedPolicyId, setSelectedPolicyId] = useState(state.policies[0]?.id || 'new');
  const canEditSettings = selectors.isSettingsAdmin();
  const effectiveSelectedPolicyId = selectedPolicyId === 'new' || state.policies.some((policy) => policy.id === selectedPolicyId)
    ? selectedPolicyId
    : state.policies[0]?.id || 'new';

  const backendViewer = useQuery(
    api.settings.resolveDemoUserByEmail,
    state.currentUser?.email ? { email: state.currentUser.email } : 'skip',
  );

  const backendCompanies = useQuery(
    api.settings.getCompanies,
    backendViewer?.userId ? { userId: backendViewer.userId } : 'skip',
  );
  const backendUsers = useQuery(
    api.settings.getUsersByCompany,
    backendViewer?.userId ? { userId: backendViewer.userId, companyId: undefined } : 'skip',
  );
  const backendPolicies = useQuery(
    api.settings.getPoliciesByCompany,
    backendViewer?.userId ? { userId: backendViewer.userId, companyId: undefined } : 'skip',
  );
  const backendRequestSettings = useQuery(
    api.settings.getRequestSettings,
    backendViewer?.userId ? { userId: backendViewer.userId, companyId: undefined } : 'skip',
  );
  const backendAuditLog = useQuery(
    api.settings.getSettingsAuditLog,
    selectors.isSettingsAdmin() && backendViewer?.userId ? { userId: backendViewer.userId, limit: 100 } : 'skip',
  );

  const saveCompanyMutation = useMutation(api.settings.saveCompany);
  const saveUserWithRolesMutation = useMutation(api.settings.saveUserWithRoles);
  const savePolicyMutation = useMutation(api.settings.savePolicy);
  const saveRequestSettingsMutation = useMutation(api.settings.saveRequestSettings);
  const addSavedAccountMutation = useMutation(api.settings.addSavedAccount);
  const deleteSavedAccountMutation = useMutation(api.settings.deleteSavedAccount);

  const backendReady =
    backendViewer?.userId &&
    backendCompanies &&
    backendUsers &&
    backendPolicies &&
    backendRequestSettings;

  const companies = backendReady ? backendCompanies : state.companies;
  const users = backendReady
    ? backendUsers.map((u) => ({ ...u, companies: (u.assignments || []).map((a) => a.companyId) }))
    : state.users;
  const policies = backendReady ? backendPolicies : state.policies;
  const requestRules = backendReady ? backendRequestSettings : state.requestRules;
  const auditLog = backendReady && backendAuditLog ? backendAuditLog : selectors.getSettingsAuditLog();

  const procurementPolicyCount = policies.filter((p) => p.requiredQuotes > 0).length;

  return (
    <div className="glass-panel overflow-hidden animate-slide-up">
      <div className="border-b border-border px-4 sm:px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accentBlue/15 text-accentBlue flex items-center justify-center flex-shrink-0">
            <Settings size={18} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-textPrimary">Settings Workspace</h2>
            <p className="text-sm text-textSecondary max-w-2xl">
              Configure companies, roles, approval policies, request rules, and saved accounts. Policy edits only affect new or resubmitted requests.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`badge ${canEditSettings ? 'bg-accentTeal/15 text-accentTeal border border-accentTeal/20' : 'bg-accentAmber/15 text-accentAmber border border-accentAmber/20'}`}>
            {canEditSettings ? 'Admin Edit Access' : 'View Only'}
          </span>
          <button onClick={onClose} className="btn btn-outline text-xs sm:text-sm">
            Back to Workflow
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b xl:border-b-0 xl:border-r border-border bg-black/20 p-3 sm:p-4">
          <div className="space-y-1">
            {SETTINGS_SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              const extraCount = section.id === 'procurement' ? procurementPolicyCount : null;

              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
                    isActive ? 'bg-white/[0.08] ring-1 ring-accentBlue/30' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${isActive ? 'bg-accentBlue/15 text-accentBlue' : 'bg-white/[0.04] text-textSecondary'}`}>
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${isActive ? 'text-textPrimary' : 'text-textSecondary'}`}>{section.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {extraCount !== null && (
                      <span className="text-[10px] font-semibold text-textSecondary bg-white/[0.05] rounded-full px-2 py-0.5">
                        {extraCount}
                      </span>
                    )}
                    <ChevronRight size={14} className={isActive ? 'text-accentBlue' : 'text-textSecondary/50'} />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 p-3 rounded-2xl bg-white/[0.03] border border-border">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-textSecondary mb-1.5">Settings principle</p>
            <p className="text-xs text-textSecondary leading-5">
              Requests keep their generated route and policy snapshot. Settings updates shape what gets created next, not what is already in flight.
            </p>
          </div>
        </aside>

        <main className="p-4 sm:p-6 min-w-0">
          {activeSection === 'companies' && (
            <CompanySettingsSection
              canEdit={canEditSettings}
              companies={companies}
              categories={state.categories}
              onSave={(company) => {
                if (backendReady && backendViewer?.userId) {
                  saveCompanyMutation({
                    actingUserId: backendViewer.userId,
                    companyId: company.id || undefined,
                    name: company.name,
                    tag: company.tag,
                    active: company.active ?? true,
                    procurementEnabled: company.procurementEnabled ?? false,
                    enabledCategories: company.enabledCategories || [],
                  }).then(() => actions.showToast(`Saved company ${company.name || company.tag}`, 'success'));
                } else {
                  actions.saveCompany(company);
                  actions.showToast(`Saved company ${company.name || company.tag}`, 'success');
                }
              }}
            />
          )}

          {activeSection === 'users' && (
            <UsersRolesSection
              canEdit={canEditSettings}
              users={users}
              companies={companies}
              onSave={(user) => {
                if (backendReady && backendViewer?.userId) {
                  saveUserWithRolesMutation({
                    actingUserId: backendViewer.userId,
                    userId: user.id || undefined,
                    name: user.name,
                    email: user.email,
                    active: user.active ?? true,
                    assignments: (user.companies || []).map((companyId) => ({
                      companyId,
                      role: user.role,
                      active: true,
                    })),
                  }).then(() => actions.showToast(`Saved user ${user.name}`, 'success'));
                } else {
                  actions.saveUser(user);
                  actions.showToast(`Saved user ${user.name}`, 'success');
                }
              }}
            />
          )}

          {activeSection === 'policies' && (
            <ApprovalPoliciesSection
              canEdit={canEditSettings}
              policies={policies}
              companies={companies}
              categories={state.categories}
              selectedPolicyId={effectiveSelectedPolicyId}
              onSelectPolicy={setSelectedPolicyId}
              onSave={(policy) => {
                if (backendReady && backendViewer?.userId) {
                  savePolicyMutation({
                    actingUserId: backendViewer.userId,
                    policyId: policy.id || undefined,
                    companyId: policy.companyId,
                    name: policy.name,
                    category: policy.category,
                    minAmount: policy.min,
                    maxAmount: policy.max,
                    active: policy.active ?? true,
                    businessSteps: policy.steps,
                    requiresFinanceDisbursement: policy.requiresFinance ?? true,
                    requiredQuotes: policy.requiredQuotes ?? 0,
                    quoteRuleLabel: policy.quoteRuleLabel || '',
                    requireJustificationIfNotLowest: policy.requireJustificationIfNotLowest ?? false,
                    allowSingleSourceException: policy.allowSingleSourceException ?? false,
                    allowDrafts: false,
                    allowRecall: true,
                    allowResubmission: true,
                  }).then(() => actions.showToast(`Saved policy ${policy.name}`, 'success'));
                } else {
                  actions.savePolicy(policy);
                  actions.showToast(`Saved policy ${policy.name}`, 'success');
                }
              }}
            />
          )}

          {activeSection === 'procurement' && (
            <ProcurementRulesSection
              policies={selectors.getProcurementPolicies()}
              companies={state.companies}
              onEditPolicy={(policyId) => {
                setSelectedPolicyId(policyId);
                setActiveSection('policies');
              }}
            />
          )}

          {activeSection === 'request-rules' && (
            <RequestRulesSection
              canEdit={canEditSettings}
              requestRules={requestRules}
              onSave={(rules) => {
                if (backendReady && backendViewer?.userId) {
                  saveRequestSettingsMutation({
                    actingUserId: backendViewer.userId,
                    companyId: undefined,
                    allowDrafts: rules.allowDrafts ?? false,
                    allowRecall: rules.allowRecall ?? true,
                    allowResubmission: rules.allowResubmission ?? true,
                    allowPartialPayment: true,
                    payoutPerLineItem: true,
                    requestIdMode: rules.requestIdMode || 'company_tag',
                    auditRetentionDays: rules.auditRetentionDays || 365,
                  }).then(() => actions.showToast('Request rules updated', 'success'));
                } else {
                  actions.saveRequestRules(rules);
                  actions.showToast('Request rules updated', 'success');
                }
              }}
            />
          )}

          {activeSection === 'saved-accounts' && (
            <SavedAccountsSection
              accounts={backendReady ? [] : selectors.getMySavedAccounts()}
              currentUser={state.currentUser}
              onSave={(account) => {
                if (backendReady && backendViewer?.userId) {
                  addSavedAccountMutation({
                    userId: backendViewer.userId,
                    payeeName: account.payeeName,
                    bankName: account.bankName,
                    accountNumber: account.accountNumber,
                  }).then(() => actions.showToast(`Saved beneficiary ${account.payeeName}`, 'success'));
                } else {
                  actions.saveSavedAccount(account);
                  actions.showToast(`Saved beneficiary ${account.payeeName}`, 'success');
                }
              }}
              onDelete={(accountId) => {
                if (backendReady && backendViewer?.userId) {
                  deleteSavedAccountMutation({ userId: backendViewer.userId, savedAccountId: accountId })
                    .then(() => actions.showToast('Saved account removed', 'warning'));
                } else {
                  actions.deleteSavedAccount(accountId);
                  actions.showToast('Saved account removed', 'warning');
                }
              }}
            />
          )}

          {activeSection === 'audit' && (
            <AuditLogSection
              auditLog={auditLog}
              getUserById={selectors.getUserById}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function SectionShell({ title, description, children, callout }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-textPrimary">{title}</h3>
          <p className="text-sm text-textSecondary max-w-3xl">{description}</p>
        </div>
        {callout}
      </div>
      {children}
    </div>
  );
}

function CompanySettingsSection({ canEdit, companies, categories, onSave }) {
  const [newCompany, setNewCompany] = useState(() => emptyCompany(categories));

  return (
    <SectionShell
      title="Company Settings"
      description="Manage active companies, the categories they can use, and whether procurement quote controls apply."
      callout={<AccessBadge canEdit={canEdit} />}
    >
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
        {companies.map((company) => (
          <EditableCompanyCard
            key={company.id}
            company={company}
            categories={categories}
            canEdit={canEdit}
            onSave={onSave}
          />
        ))}
      </div>

      <div className="glass-panel p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h4 className="font-semibold text-textPrimary">Add Company</h4>
            <p className="text-xs text-textSecondary">New companies become available in role assignments and policy setup.</p>
          </div>
          <span className="badge bg-accentBlue/15 text-accentBlue border border-accentBlue/20">New</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Company Name" value={newCompany.name} onChange={(value) => setNewCompany((current) => ({ ...current, name: value }))} disabled={!canEdit} />
          <TextField label="Company Tag" value={newCompany.tag} onChange={(value) => setNewCompany((current) => ({ ...current, tag: value.toUpperCase().slice(0, 5) }))} disabled={!canEdit} />
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleRow
            label="Active company"
            description="Inactive companies stay visible in settings but drop out of new request creation."
            checked={newCompany.active}
            onChange={(value) => setNewCompany((current) => ({ ...current, active: value }))}
            disabled={!canEdit}
          />
          <ToggleRow
            label="Procurement enabled"
            description="Use quote compliance and procurement-specific policies for this company."
            checked={newCompany.procurementEnabled}
            onChange={(value) => setNewCompany((current) => ({ ...current, procurementEnabled: value }))}
            disabled={!canEdit}
          />
        </div>

        <div className="mt-4">
          <CategorySelector
            label="Enabled Categories"
            categories={categories}
            value={newCompany.enabledCategories}
            onToggle={(category) => setNewCompany((current) => ({ ...current, enabledCategories: toggleValue(current.enabledCategories, category) }))}
            disabled={!canEdit}
          />
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={() => {
              if (!newCompany.name.trim() || !newCompany.tag.trim()) return;
              onSave(newCompany);
              setNewCompany(emptyCompany(categories));
            }}
            disabled={!canEdit || !newCompany.name.trim() || !newCompany.tag.trim()}
            className="btn btn-primary"
          >
            <Plus size={14} /> Add Company
          </button>
        </div>
      </div>
    </SectionShell>
  );
}

function EditableCompanyCard({ company, categories, canEdit, onSave }) {
  const [draft, setDraft] = useState(company);

  useEffect(() => {
    setDraft(company);
  }, [company]);

  return (
    <div className="glass-panel p-4 sm:p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-textPrimary">{company.name}</h4>
            <span className={`badge ${company.active ? 'bg-accentEmerald/15 text-accentEmerald border border-accentEmerald/20' : 'bg-accentRose/15 text-accentRose border border-accentRose/20'}`}>
              {company.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-xs text-textSecondary mt-1">Company tag: {company.tag}</p>
        </div>
        <button onClick={() => onSave(draft)} disabled={!canEdit} className="btn btn-outline text-xs">
          <Save size={13} /> Save
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField label="Company Name" value={draft.name} onChange={(value) => setDraft((current) => ({ ...current, name: value }))} disabled={!canEdit} />
        <TextField label="Company Tag" value={draft.tag} onChange={(value) => setDraft((current) => ({ ...current, tag: value.toUpperCase().slice(0, 5) }))} disabled={!canEdit} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ToggleRow
          label="Company active"
          description="Controls whether the company can be used in new requests."
          checked={draft.active}
          onChange={(value) => setDraft((current) => ({ ...current, active: value }))}
          disabled={!canEdit}
        />
        <ToggleRow
          label="Procurement enabled"
          description="Turns on procurement controls and quote requirements for this company."
          checked={draft.procurementEnabled}
          onChange={(value) => setDraft((current) => ({ ...current, procurementEnabled: value }))}
          disabled={!canEdit}
        />
      </div>

      <CategorySelector
        label="Enabled Categories"
        categories={categories}
        value={draft.enabledCategories || []}
        onToggle={(category) => setDraft((current) => ({ ...current, enabledCategories: toggleValue(current.enabledCategories || [], category) }))}
        disabled={!canEdit}
      />
    </div>
  );
}

function UsersRolesSection({ canEdit, users, companies, onSave }) {
  const [newUser, setNewUser] = useState(emptyUser());

  return (
    <SectionShell
      title="Users & Roles"
      description="Assign roles and company access. Admins can update who is allowed to act inside each company’s workflow."
      callout={<AccessBadge canEdit={canEdit} />}
    >
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
        {users.map((user) => (
          <EditableUserCard key={user.id} user={user} companies={companies} canEdit={canEdit} onSave={onSave} />
        ))}
      </div>

      <div className="glass-panel p-4 sm:p-5 space-y-4">
        <div>
          <h4 className="font-semibold text-textPrimary">Invite / Add User</h4>
          <p className="text-xs text-textSecondary mt-1">Add a new internal actor to the demo directory and attach them to one or more companies.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Full Name" value={newUser.name} onChange={(value) => setNewUser((current) => ({ ...current, name: value }))} disabled={!canEdit} />
          <TextField label="Email" value={newUser.email} onChange={(value) => setNewUser((current) => ({ ...current, email: value }))} disabled={!canEdit} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label="Role"
            value={newUser.role}
            options={ROLE_OPTIONS.map((role) => ({ label: role, value: role }))}
            onChange={(value) => setNewUser((current) => ({ ...current, role: value }))}
            disabled={!canEdit}
          />
          <ToggleRow
            label="Active user"
            description="Inactive users remain visible but should not be selected for new assignments."
            checked={newUser.active}
            onChange={(value) => setNewUser((current) => ({ ...current, active: value }))}
            disabled={!canEdit}
          />
        </div>

        <MultiSelectCompanyList
          companies={companies}
          value={newUser.companies}
          onToggle={(companyId) => setNewUser((current) => ({ ...current, companies: toggleValue(current.companies, companyId) }))}
          disabled={!canEdit}
        />

        <div className="flex justify-end">
          <button
            onClick={() => {
              if (!newUser.name.trim() || !newUser.email.trim()) return;
              onSave(newUser);
              setNewUser(emptyUser());
            }}
            disabled={!canEdit || !newUser.name.trim() || !newUser.email.trim() || newUser.companies.length === 0}
            className="btn btn-primary"
          >
            <Plus size={14} /> Add User
          </button>
        </div>
      </div>
    </SectionShell>
  );
}

function EditableUserCard({ user, companies, canEdit, onSave }) {
  const [draft, setDraft] = useState(user);

  useEffect(() => {
    setDraft(user);
  }, [user]);

  return (
    <div className="glass-panel p-4 sm:p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-textPrimary">{user.name}</h4>
            <span className={`badge ${user.active ? 'bg-accentBlue/15 text-accentBlue border border-accentBlue/20' : 'bg-accentRose/15 text-accentRose border border-accentRose/20'}`}>
              {user.role}
            </span>
          </div>
          <p className="text-xs text-textSecondary mt-1">{user.email}</p>
          <p className="text-[11px] text-textSecondary mt-1">Last active: {formatDateTime(user.lastActive)}</p>
        </div>
        <button onClick={() => onSave(draft)} disabled={!canEdit} className="btn btn-outline text-xs">
          <Save size={13} /> Save
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField label="Full Name" value={draft.name} onChange={(value) => setDraft((current) => ({ ...current, name: value }))} disabled={!canEdit} />
        <TextField label="Email" value={draft.email} onChange={(value) => setDraft((current) => ({ ...current, email: value }))} disabled={!canEdit} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          label="Role"
          value={draft.role}
          options={ROLE_OPTIONS.map((role) => ({ label: role, value: role }))}
          onChange={(value) => setDraft((current) => ({ ...current, role: value }))}
          disabled={!canEdit}
        />
        <ToggleRow
          label="User active"
          description="Inactive users remain in history but should not take new actions."
          checked={draft.active}
          onChange={(value) => setDraft((current) => ({ ...current, active: value }))}
          disabled={!canEdit}
        />
      </div>

      <MultiSelectCompanyList
        companies={companies}
        value={draft.companies || []}
        onToggle={(companyId) => setDraft((current) => ({ ...current, companies: toggleValue(current.companies || [], companyId) }))}
        disabled={!canEdit}
      />
    </div>
  );
}

function ApprovalPoliciesSection({ canEdit, policies, companies, categories, selectedPolicyId, onSelectPolicy, onSave }) {
  const selectedPolicy = selectedPolicyId === 'new'
    ? null
    : policies.find((policy) => policy.id === selectedPolicyId) || null;

  return (
    <SectionShell
      title="Approval Policies"
      description="Create and version the rules that decide who approves what, when procurement quotes are required, and when finance takes over."
      callout={<AccessBadge canEdit={canEdit} />}
    >
      <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-5">
        <div className="glass-panel p-3 sm:p-4 space-y-2 h-fit">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div>
              <p className="text-sm font-semibold text-textPrimary">Policy Library</p>
              <p className="text-xs text-textSecondary">{policies.length} configurable policies</p>
            </div>
            <button onClick={() => onSelectPolicy('new')} disabled={!canEdit} className="btn btn-primary text-xs px-3 py-2">
              <Plus size={13} /> New
            </button>
          </div>

          {policies.map((policy) => {
            const company = companies.find((item) => item.id === policy.companyId);
            const isActive = selectedPolicyId === policy.id;
            return (
              <button
                key={policy.id}
                onClick={() => onSelectPolicy(policy.id)}
                className={`w-full text-left rounded-xl border px-3 py-3 transition-all ${
                  isActive ? 'border-accentBlue/30 bg-accentBlue/[0.06]' : 'border-border bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm text-textPrimary truncate">{policy.name}</p>
                  <span className="badge bg-white/[0.05] text-textSecondary border border-border">v{policy.version || 1}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-textSecondary">
                  <span>{company?.tag || policy.companyId}</span>
                  <span>•</span>
                  <span>{policy.category}</span>
                  <span>•</span>
                  <span>{policy.steps.length} step{policy.steps.length === 1 ? '' : 's'}</span>
                </div>
              </button>
            );
          })}
        </div>

        <PolicyEditor
          key={selectedPolicy?.id || 'new-policy'}
          canEdit={canEdit}
          policy={selectedPolicy}
          companies={companies}
          categories={categories}
          onSave={onSave}
        />
      </div>
    </SectionShell>
  );
}

function PolicyEditor({ canEdit, policy, companies, categories, onSave }) {
  const [draft, setDraft] = useState(() => policy || createEmptyPolicy(companies, categories));

  const selectedCompany = companies.find((company) => company.id === draft.companyId);
  const availableCategories = selectedCompany?.enabledCategories?.length ? selectedCompany.enabledCategories : categories;
  const resolvedCategory = availableCategories.includes(draft.category) ? draft.category : availableCategories[0] || '';

  return (
    <div className="glass-panel p-4 sm:p-5 space-y-5 min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-textPrimary">{policy ? policy.name : 'Create New Policy'}</h4>
            {policy && (
              <span className="badge bg-accentPurple/15 text-accentPurple border border-accentPurple/20">Current v{policy.version || 1}</span>
            )}
          </div>
          <p className="text-xs text-textSecondary mt-1">
            {policy ? 'Saving will create the next policy version for future requests.' : 'Set the route, amount band, and quote controls for this policy.'}
          </p>
        </div>
        <button
          onClick={() => onSave({ ...draft, category: resolvedCategory, min: Number(draft.min), max: Number(draft.max), requiredQuotes: Number(draft.requiredQuotes) })}
          disabled={!canEdit || !draft.name.trim()}
          className="btn btn-primary text-xs"
        >
          <Save size={13} /> {policy ? 'Save v' + ((policy.version || 1) + 1) : 'Create Policy'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField label="Policy Name" value={draft.name} onChange={(value) => setDraft((current) => ({ ...current, name: value }))} disabled={!canEdit} />
        <SelectField
          label="Company"
          value={draft.companyId}
          options={companies.map((company) => ({ label: company.name, value: company.id }))}
          onChange={(value) => setDraft((current) => ({ ...current, companyId: value, category: '' }))}
          disabled={!canEdit}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SelectField
          label="Category"
          value={resolvedCategory}
          options={availableCategories.map((category) => ({ label: category, value: category }))}
          onChange={(value) => setDraft((current) => ({ ...current, category: value }))}
          disabled={!canEdit}
        />
        <NumberField label="Minimum Amount" value={draft.min} onChange={(value) => setDraft((current) => ({ ...current, min: value }))} disabled={!canEdit} />
        <NumberField label="Maximum Amount" value={draft.max} onChange={(value) => setDraft((current) => ({ ...current, max: value }))} disabled={!canEdit} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ToggleRow
          label="Policy active"
          description="Inactive policies stay in settings but are skipped during policy matching."
          checked={draft.active}
          onChange={(value) => setDraft((current) => ({ ...current, active: value }))}
          disabled={!canEdit}
        />
        <ToggleRow
          label="Finance disbursement required"
          description="Adds the finance payout phase after all business approvals complete."
          checked={draft.requiresFinance}
          onChange={(value) => setDraft((current) => ({ ...current, requiresFinance: value }))}
          disabled={!canEdit}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NumberField
          label="Required Quotes"
          value={draft.requiredQuotes}
          onChange={(value) => setDraft((current) => ({ ...current, requiredQuotes: value }))}
          disabled={!canEdit}
        />
        <TextField
          label="Quote Rule Label"
          value={draft.quoteRuleLabel || ''}
          onChange={(value) => setDraft((current) => ({ ...current, quoteRuleLabel: value }))}
          disabled={!canEdit}
          placeholder="This request requires 3 competitive quotes..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ToggleRow
          label="Justify non-lowest quote"
          description="Force a reason when the selected vendor is not the cheapest quote."
          checked={draft.requireJustificationIfNotLowest}
          onChange={(value) => setDraft((current) => ({ ...current, requireJustificationIfNotLowest: value }))}
          disabled={!canEdit}
        />
        <ToggleRow
          label="Allow single-source exception"
          description="Lets requesters proceed with a single-source justification instead of full quote count."
          checked={draft.allowSingleSourceException}
          onChange={(value) => setDraft((current) => ({ ...current, allowSingleSourceException: value }))}
          disabled={!canEdit}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-textPrimary">Approval Steps</p>
            <p className="text-xs text-textSecondary">Steps are fully dynamic and can be 1 step or 7+ steps.</p>
          </div>
          <button
            onClick={() => setDraft((current) => ({ ...current, steps: [...current.steps, ROLE_OPTIONS[0]] }))}
            disabled={!canEdit}
            className="btn btn-outline text-xs"
          >
            <Plus size={13} /> Add Step
          </button>
        </div>

        <div className="space-y-2">
          {draft.steps.map((step, index) => (
            <div key={`${step}-${index}`} className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-border bg-white/[0.02] px-3 py-3">
              <span className="text-[11px] font-semibold text-textSecondary uppercase tracking-wider w-16">Step {index + 1}</span>
              <div className="flex-1">
                <select
                  className="input-field"
                  value={step}
                  onChange={(event) => setDraft((current) => ({
                    ...current,
                    steps: current.steps.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)),
                  }))}
                  disabled={!canEdit}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setDraft((current) => ({ ...current, steps: current.steps.filter((_, itemIndex) => itemIndex !== index) }))}
                disabled={!canEdit || draft.steps.length === 1}
                className="btn btn-danger text-xs"
              >
                <X size={13} /> Remove
              </button>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-accentBlue/[0.05] border border-accentBlue/15 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accentBlue mb-2">Route preview</p>
          <div className="flex flex-wrap items-center gap-2 text-sm text-textPrimary">
            {[...draft.steps, ...(draft.requiresFinance ? ['Finance'] : [])].map((step, index, items) => (
              <React.Fragment key={`${step}-${index}`}>
                <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] border border-border">{step}</span>
                {index < items.length - 1 && <ChevronRight size={14} className="text-textSecondary/70" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProcurementRulesSection({ policies, companies, onEditPolicy }) {
  return (
    <SectionShell
      title="Procurement Rules"
      description="Review policies that enforce quote compliance. These rules are managed inside policy definitions and shape the request form dynamically."
      callout={<span className="badge bg-accentPurple/15 text-accentPurple border border-accentPurple/20">{policies.length} quote-enabled policies</span>}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {policies.map((policy) => {
          const company = companies.find((item) => item.id === policy.companyId);
          return (
            <div key={policy.id} className="glass-panel p-4 sm:p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-textPrimary">{policy.name}</h4>
                    <span className="badge bg-accentAmber/15 text-accentAmber border border-accentAmber/20">{policy.requiredQuotes} quotes</span>
                  </div>
                  <p className="text-xs text-textSecondary mt-1">{company?.name} • {policy.category}</p>
                </div>
                <button onClick={() => onEditPolicy(policy.id)} className="btn btn-outline text-xs">
                  Edit Policy
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <RuleChip label="Quote label" value={policy.quoteRuleLabel || 'Not set'} />
                <RuleChip label="Amount band" value={`₦${Number(policy.min).toLocaleString()} → ₦${Number(policy.max).toLocaleString()}`} />
                <RuleChip label="Non-lowest justification" value={policy.requireJustificationIfNotLowest ? 'Required' : 'Not required'} />
                <RuleChip label="Single-source exception" value={policy.allowSingleSourceException ? 'Allowed' : 'Blocked'} />
              </div>
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}

function RequestRulesSection({ canEdit, requestRules, onSave }) {
  const [draft, setDraft] = useState(requestRules);

  useEffect(() => {
    setDraft(requestRules);
  }, [requestRules]);

  return (
    <SectionShell
      title="Request Rules"
      description="These controls shape the global workflow behavior that sits on top of dynamic company policies."
      callout={<AccessBadge canEdit={canEdit} />}
    >
      <div className="glass-panel p-4 sm:p-5 space-y-4">
        <ToggleRow
          label="Allow request recall"
          description="Requesters and admins can pull back requests while they are still in approval."
          checked={draft.allowRecall}
          onChange={(value) => setDraft((current) => ({ ...current, allowRecall: value }))}
          disabled={!canEdit}
        />
        <ToggleRow
          label="Allow resubmission"
          description="Rejected or recalled requests can be regenerated against the latest active policy."
          checked={draft.allowResubmission}
          onChange={(value) => setDraft((current) => ({ ...current, allowResubmission: value }))}
          disabled={!canEdit}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label="Request ID Pattern"
            value={draft.requestIdMode}
            options={[
              { label: 'Company Tag (QML-001)', value: 'company_tag' },
              { label: 'Generic (REQ-001)', value: 'generic' },
            ]}
            onChange={(value) => setDraft((current) => ({ ...current, requestIdMode: value }))}
            disabled={!canEdit}
          />
          <NumberField
            label="Audit Retention (Days)"
            value={draft.auditRetentionDays}
            onChange={(value) => setDraft((current) => ({ ...current, auditRetentionDays: Number(value) || 0 }))}
            disabled={!canEdit}
          />
        </div>

        <div className="rounded-2xl bg-white/[0.03] border border-border p-4">
          <p className="text-xs font-semibold text-textPrimary">Current runtime behavior</p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-textSecondary">
            <InfoLine label="Recall" value={draft.allowRecall ? 'Enabled' : 'Disabled'} />
            <InfoLine label="Resubmission" value={draft.allowResubmission ? 'Enabled' : 'Disabled'} />
            <InfoLine label="New request IDs" value={draft.requestIdMode === 'company_tag' ? 'Company tag pattern' : 'Generic pattern'} />
            <InfoLine label="Audit window" value={`${draft.auditRetentionDays} days`} />
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={() => onSave(draft)} disabled={!canEdit} className="btn btn-primary">
            <Save size={14} /> Save Request Rules
          </button>
        </div>
      </div>
    </SectionShell>
  );
}

function SavedAccountsSection({ accounts, currentUser, onSave, onDelete }) {
  const [draft, setDraft] = useState({ payeeName: '', bankName: BANKS[0], accountNumber: '' });

  return (
    <SectionShell
      title="My Saved Accounts"
      description="These beneficiary shortcuts belong only to the active user. They are not shared across the organization."
      callout={<span className="badge bg-accentTeal/15 text-accentTeal border border-accentTeal/20">{currentUser.name}</span>}
    >
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5">
        <div className="glass-panel p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h4 className="font-semibold text-textPrimary">Saved beneficiaries</h4>
              <p className="text-xs text-textSecondary">{accounts.length} account shortcut{accounts.length === 1 ? '' : 's'}</p>
            </div>
          </div>

          {accounts.length === 0 ? (
            <EmptyState
              title="No saved accounts yet"
              description="Add frequently used beneficiaries so request creation can reuse them later."
            />
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div key={account.id} className="rounded-xl border border-border bg-white/[0.02] px-4 py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm text-textPrimary">{account.payeeName}</p>
                    <p className="text-xs text-textSecondary mt-1">{account.bankName} • {account.accountNumber}</p>
                    <p className="text-[11px] text-textSecondary mt-1">Last used {formatDateTime(account.lastUsedAt)}</p>
                  </div>
                  <button onClick={() => onDelete(account.id)} className="btn btn-danger text-xs self-start">
                    <X size={13} /> Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel p-4 sm:p-5 space-y-4 h-fit">
          <div>
            <h4 className="font-semibold text-textPrimary">Add saved account</h4>
            <p className="text-xs text-textSecondary mt-1">Useful for requesters who repeatedly pay the same vendors.</p>
          </div>

          <TextField label="Payee Name" value={draft.payeeName} onChange={(value) => setDraft((current) => ({ ...current, payeeName: value }))} />
          <SelectField
            label="Bank"
            value={draft.bankName}
            options={BANKS.map((bank) => ({ label: bank, value: bank }))}
            onChange={(value) => setDraft((current) => ({ ...current, bankName: value }))}
          />
          <TextField label="Account Number" value={draft.accountNumber} onChange={(value) => setDraft((current) => ({ ...current, accountNumber: value }))} />

          <button
            onClick={() => {
              if (!draft.payeeName.trim() || !draft.accountNumber.trim()) return;
              onSave(draft);
              setDraft({ payeeName: '', bankName: BANKS[0], accountNumber: '' });
            }}
            disabled={!draft.payeeName.trim() || !draft.accountNumber.trim()}
            className="btn btn-primary w-full"
          >
            <Plus size={14} /> Save Beneficiary
          </button>
        </div>
      </div>
    </SectionShell>
  );
}

function AuditLogSection({ auditLog, getUserById }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return auditLog;
    return auditLog.filter((entry) =>
      `${entry.summary} ${entry.module} ${entry.action}`.toLowerCase().includes(normalized)
    );
  }, [auditLog, query]);

  return (
    <SectionShell
      title="Audit Log"
      description="Settings changes are tracked so policy updates, role changes, and company edits can be traced back to the user who made them."
      callout={<span className="badge bg-white/[0.05] text-textSecondary border border-border">{auditLog.length} events</span>}
    >
      <div className="glass-panel p-4 sm:p-5 space-y-4">
        <div className="relative max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary/70" />
          <input
            className="input-field pl-10"
            placeholder="Search audit history..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="space-y-3">
          {filtered.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-border bg-white/[0.02] px-4 py-3">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge bg-accentBlue/15 text-accentBlue border border-accentBlue/20">{entry.module}</span>
                    <span className="badge bg-white/[0.05] text-textSecondary border border-border">{entry.action}</span>
                  </div>
                  <p className="text-sm font-semibold text-textPrimary mt-2">{entry.summary}</p>
                  <p className="text-xs text-textSecondary mt-1">
                    Changed by {getUserById(entry.changedByUserId)?.name || 'Unknown user'}
                  </p>
                </div>
                <p className="text-[11px] text-textSecondary whitespace-nowrap">{formatDateTime(entry.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

function AccessBadge({ canEdit }) {
  return (
    <span className={`badge ${canEdit ? 'bg-accentTeal/15 text-accentTeal border border-accentTeal/20' : 'bg-accentAmber/15 text-accentAmber border border-accentAmber/20'}`}>
      {canEdit ? 'Editable' : 'View Only'}
    </span>
  );
}

function TextField({ label, value, onChange, disabled = false, placeholder = '' }) {
  return (
    <label className="block">
      <span className="label-text">{label}</span>
      <input
        className="input-field"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
      />
    </label>
  );
}

function NumberField({ label, value, onChange, disabled = false }) {
  return (
    <label className="block">
      <span className="label-text">{label}</span>
      <input
        className="input-field"
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
    </label>
  );
}

function SelectField({ label, value, options, onChange, disabled = false }) {
  return (
    <label className="block">
      <span className="label-text">{label}</span>
      <select className="input-field" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function ToggleRow({ label, description, checked, onChange, disabled = false }) {
  return (
    <div className={`rounded-2xl border px-4 py-3 flex items-start justify-between gap-3 ${checked ? 'border-accentTeal/20 bg-accentTeal/[0.04]' : 'border-border bg-white/[0.02]'}`}>
      <div>
        <p className="text-sm font-semibold text-textPrimary">{label}</p>
        <p className="text-xs text-textSecondary mt-1 max-w-xl">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`w-12 h-7 rounded-full transition-all flex items-center px-1 ${checked ? 'bg-accentTeal' : 'bg-white/[0.08]'}`}
      >
        <span className={`w-5 h-5 rounded-full bg-black transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function CategorySelector({ label, categories, value, onToggle, disabled = false }) {
  return (
    <div>
      <span className="label-text">{label}</span>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const active = value.includes(category);
          return (
            <button
              key={category}
              onClick={() => onToggle(category)}
              disabled={disabled}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                active
                  ? 'bg-accentBlue/15 text-accentBlue border-accentBlue/20'
                  : 'bg-white/[0.03] text-textSecondary border-border hover:bg-white/[0.05]'
              }`}
            >
              {active && <Check size={12} className="inline mr-1.5" />}
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MultiSelectCompanyList({ companies, value, onToggle, disabled = false }) {
  return (
    <div>
      <span className="label-text">Assigned Companies</span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {companies.map((company) => {
          const active = value.includes(company.id);
          return (
            <button
              key={company.id}
              onClick={() => onToggle(company.id)}
              disabled={disabled}
              className={`rounded-xl border px-3 py-3 text-left transition-all ${
                active
                  ? 'bg-accentBlue/[0.06] border-accentBlue/20'
                  : 'bg-white/[0.02] border-border hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-textPrimary">{company.name}</p>
                  <p className="text-[11px] text-textSecondary mt-1">{company.tag}</p>
                </div>
                {active && <Check size={14} className="text-accentBlue" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RuleChip({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-white/[0.02] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-textSecondary">{label}</p>
      <p className="text-sm text-textPrimary mt-1">{value}</p>
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-black/30 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wider text-textSecondary">{label}</p>
      <p className="text-sm font-semibold text-textPrimary mt-1">{value}</p>
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center">
      <p className="font-semibold text-textPrimary">{title}</p>
      <p className="text-sm text-textSecondary mt-1">{description}</p>
    </div>
  );
}

export default SettingsWorkspace;
