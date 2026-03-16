import React, { useMemo, useReducer } from 'react';
import {
  MOCK_USERS,
  MOCK_COMPANIES,
  MOCK_CATEGORIES,
  POLICIES,
  INITIAL_REQUESTS,
  INITIAL_REQUEST_RULES,
  INITIAL_SAVED_ACCOUNTS,
  INITIAL_SETTINGS_AUDIT_LOG,
  STATUSES,
  generateId,
  generateRef,
  getMatchedPolicy,
  getDashboardStats,
  canActOnStep,
  canPayLineItem,
  canRecall,
  canResubmit,
  getMyActions,
  getCategoriesForCompany,
} from '../data/mockData';
import { WorkflowStoreContext } from './workflowStoreContext';

const initialState = {
  currentUser: MOCK_USERS[0],
  requests: [],
  users: [],
  companies: [],
  categories: MOCK_CATEGORIES,
  policies: [],
  requestRules: {},
  savedAccounts: [],
  settingsAuditLog: [],
  toast: null,
  source: 'backend',
};

function buildApprovalSteps(policy) {
  return policy.steps.map((role, idx) => ({
    step: idx + 1,
    role,
    status: idx === 0 ? 'pending' : 'waiting',
  }));
}

function buildRouteLabel(policy) {
  return [...policy.steps, ...(policy.requiresFinance ? ['Finance'] : [])].join(' → ');
}

function getNextSequence(prefix, requests) {
  const numbers = requests
    .filter((request) => request.id.startsWith(`${prefix}-`))
    .map((request) => Number(request.id.split('-').pop()))
    .filter((value) => Number.isFinite(value));

  return (numbers.length ? Math.max(...numbers) : 0) + 1;
}

function buildRequestId(company, requestRules, requests) {
  if (requestRules.requestIdMode === 'generic') {
    const next = getNextSequence('REQ', requests);
    return `REQ-${String(next).padStart(3, '0')}`;
  }

  const next = getNextSequence(company.tag, requests);
  return `${company.tag}-${String(next).padStart(3, '0')}`;
}

function createAuditEntry({ module, entityType, entityId, action, summary, changedByUserId }) {
  return {
    id: `audit-${generateId()}`,
    module,
    entityType,
    entityId,
    action,
    changedByUserId,
    summary,
    createdAt: new Date().toISOString(),
  };
}

function withAuditLog(state, entry, nextStatePatch) {
  return {
    ...state,
    ...nextStatePatch,
    settingsAuditLog: [entry, ...state.settingsAuditLog],
  };
}

function nextEntityId(prefix, items) {
  const numbers = items
    .map((item) => Number(String(item.id || '').replace(prefix, '')))
    .filter((value) => Number.isFinite(value));
  return `${prefix}${(numbers.length ? Math.max(...numbers) : 0) + 1}`;
}

function workflowReducer(state, action) {
  switch (action.type) {
    case 'SET_USER': {
      const user = state.users.find((item) => item.id === action.payload.id) || action.payload;
      return { ...state, currentUser: user };
    }

    case 'SET_TOAST':
      return { ...state, toast: action.payload };

    case 'CLEAR_TOAST':
      return { ...state, toast: null };

    case 'SAVE_COMPANY': {
      const { company } = action.payload;
      const existing = state.companies.find((item) => item.id === company.id);
      const normalized = {
        ...existing,
        ...company,
        id: company.id || nextEntityId('c', state.companies),
        active: company.active ?? existing?.active ?? true,
        procurementEnabled: company.procurementEnabled ?? existing?.procurementEnabled ?? false,
        enabledCategories: company.enabledCategories || existing?.enabledCategories || [],
      };

      const companies = existing
        ? state.companies.map((item) => (item.id === normalized.id ? normalized : item))
        : [...state.companies, normalized];

      const entry = createAuditEntry({
        module: 'companies',
        entityType: 'company',
        entityId: normalized.id,
        action: existing ? 'updated' : 'created',
        changedByUserId: state.currentUser.id,
        summary: `${existing ? 'Updated' : 'Created'} company ${normalized.name}`,
      });

      return withAuditLog(state, entry, { companies });
    }

    case 'SAVE_USER': {
      const { user } = action.payload;
      const existing = state.users.find((item) => item.id === user.id);
      const normalized = {
        ...existing,
        ...user,
        id: user.id || nextEntityId('u', state.users),
        avatar: user.avatar || existing?.avatar || user.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
        active: user.active ?? existing?.active ?? true,
        companies: user.companies || existing?.companies || [],
        lastActive: existing?.lastActive || new Date().toISOString(),
      };

      const users = existing
        ? state.users.map((item) => (item.id === normalized.id ? normalized : item))
        : [...state.users, normalized];

      const entry = createAuditEntry({
        module: 'users',
        entityType: 'user',
        entityId: normalized.id,
        action: existing ? 'updated' : 'created',
        changedByUserId: state.currentUser.id,
        summary: `${existing ? 'Updated' : 'Created'} user ${normalized.name}`,
      });

      return withAuditLog(state, entry, {
        users,
        currentUser: state.currentUser.id === normalized.id ? normalized : state.currentUser,
      });
    }

    case 'SAVE_POLICY': {
      const { policy } = action.payload;
      const existing = state.policies.find((item) => item.id === policy.id);
      const normalized = {
        ...existing,
        ...policy,
        id: policy.id || nextEntityId('p', state.policies),
        steps: policy.steps || existing?.steps || [],
        active: policy.active ?? existing?.active ?? true,
        version: existing ? (existing.version || 1) + 1 : 1,
        updatedAt: new Date().toISOString(),
      };

      const policies = existing
        ? state.policies.map((item) => (item.id === normalized.id ? normalized : item))
        : [...state.policies, normalized];

      const entry = createAuditEntry({
        module: 'policies',
        entityType: 'policy',
        entityId: normalized.id,
        action: existing ? 'updated' : 'created',
        changedByUserId: state.currentUser.id,
        summary: `${existing ? 'Updated' : 'Created'} policy ${normalized.name} (v${normalized.version})`,
      });

      return withAuditLog(state, entry, { policies });
    }

    case 'SAVE_REQUEST_RULES': {
      const nextRules = {
        ...state.requestRules,
        ...action.payload.rules,
      };

      const entry = createAuditEntry({
        module: 'request_rules',
        entityType: 'request_rule',
        entityId: 'global-request-rules',
        action: 'updated',
        changedByUserId: state.currentUser.id,
        summary: 'Updated global request rules',
      });

      return withAuditLog(state, entry, { requestRules: nextRules });
    }

    case 'SAVE_SAVED_ACCOUNT': {
      const { account } = action.payload;
      const existing = state.savedAccounts.find((item) => item.id === account.id);
      const normalized = {
        ...existing,
        ...account,
        id: account.id || `sa-${generateId()}`,
        userId: existing?.userId || state.currentUser.id,
        createdAt: existing?.createdAt || new Date().toISOString(),
        lastUsedAt: account.lastUsedAt || existing?.lastUsedAt || new Date().toISOString(),
      };

      const savedAccounts = existing
        ? state.savedAccounts.map((item) => (item.id === normalized.id ? normalized : item))
        : [normalized, ...state.savedAccounts];

      return { ...state, savedAccounts };
    }

    case 'DELETE_SAVED_ACCOUNT': {
      const { accountId } = action.payload;
      return {
        ...state,
        savedAccounts: state.savedAccounts.filter((account) => account.id !== accountId),
      };
    }

    case 'SUBMIT_REQUEST': {
      const { formData } = action.payload;
      const totalAmount = formData.payees.reduce((sum, payee) => sum + Number(payee.amount), 0);
      const policy = getMatchedPolicy(formData.companyId, formData.category, totalAmount, state.policies);
      if (!policy) return state;

      const company = state.companies.find((item) => item.id === formData.companyId);
      if (!company) return state;

      const nowDate = new Date().toISOString();
      const route = buildApprovalSteps(policy);
      const requestId = buildRequestId(company, state.requestRules, state.requests);

      const payees = formData.payees.map((payee, index) => ({
        id: `${requestId}-l${index}`,
        name: payee.name,
        bank: payee.bank,
        accountNumber: payee.accountNumber,
        amount: Number(payee.amount),
        isPaid: false,
      }));

      const quotes = (formData.quotes || []).map((quote, index) => ({
        id: `${requestId}-q${index}`,
        vendor: quote.vendor,
        amount: Number(quote.amount),
        quoteRef: quote.quoteRef || '',
        validityDate: quote.validityDate || '',
        notes: quote.notes || '',
        selected: index === formData.selectedVendorIndex,
      }));

      const timeline = [
        {
          id: generateId(),
          action: 'Submitted',
          actorId: state.currentUser.id,
          date: nowDate,
          note: `Policy: ${policy.name}`,
        },
        {
          id: generateId(),
          action: 'Route generated',
          actorId: 'system',
          date: nowDate,
          note: buildRouteLabel(policy),
        },
      ];

      if (quotes.length > 0) {
        timeline.push({
          id: generateId(),
          action: `${quotes.length} vendor quote${quotes.length > 1 ? 's' : ''} attached`,
          actorId: 'system',
          date: nowDate,
        });
      }

      const nextRequest = {
        id: requestId,
        companyId: formData.companyId,
        companyName: company.name,
        companyTag: company.tag,
        category: formData.category,
        description: formData.description,
        amount: totalAmount,
        status: route.length > 0 ? STATUSES.IN_APPROVAL : STATUSES.AWAITING_FINANCE,
        policyId: policy.id,
        policyName: policy.name,
        policyVersion: policy.version || 1,
        policySnapshot: {
          ...policy,
          steps: [...policy.steps],
        },
        requesterId: state.currentUser.id,
        date: nowDate,
        route,
        currentStepIndex: route.length > 0 ? 0 : null,
        payees,
        quotes,
        quoteJustification: formData.quoteJustification || '',
        timeline,
      };

      return { ...state, requests: [nextRequest, ...state.requests] };
    }

    case 'APPROVE_STEP': {
      const { requestId } = action.payload;
      return {
        ...state,
        requests: state.requests.map((request) => {
          if (request.id !== requestId || !canActOnStep(state.currentUser, request)) return request;

          const route = request.route.map((step) => ({ ...step }));
          const step = route[request.currentStepIndex];
          if (!step || step.status !== 'pending') return request;

          step.status = 'approved';
          step.actorId = state.currentUser.id;
          step.date = new Date().toISOString();

          const nextIndex = request.currentStepIndex + 1;
          const nextStep = route[nextIndex];
          if (nextStep) nextStep.status = 'pending';

          const timeline = [
            ...request.timeline,
            {
              id: generateId(),
              action: `${step.role} approved`,
              actorId: state.currentUser.id,
              role: step.role,
              date: new Date().toISOString(),
            },
          ];

          if (!nextStep) {
            timeline.push({
              id: generateId(),
              action: 'All business approvals complete',
              actorId: 'system',
              date: new Date().toISOString(),
            });
          }

          return {
            ...request,
            route,
            currentStepIndex: nextStep ? nextIndex : route.length,
            status: nextStep ? STATUSES.IN_APPROVAL : STATUSES.AWAITING_FINANCE,
            timeline,
          };
        }),
      };
    }

    case 'REJECT_STEP': {
      const { requestId, reason } = action.payload;
      return {
        ...state,
        requests: state.requests.map((request) => {
          if (request.id !== requestId || !canActOnStep(state.currentUser, request)) return request;

          const route = request.route.map((step) => ({ ...step }));
          const step = route[request.currentStepIndex];
          if (!step || step.status !== 'pending') return request;

          step.status = 'rejected';
          step.actorId = state.currentUser.id;
          step.date = new Date().toISOString();

          return {
            ...request,
            status: STATUSES.REJECTED,
            route,
            rejectionReason: reason,
            timeline: [
              ...request.timeline,
              {
                id: generateId(),
                action: `${step.role} rejected`,
                actorId: state.currentUser.id,
                role: state.currentUser.role,
                date: new Date().toISOString(),
                note: reason,
              },
            ],
          };
        }),
      };
    }

    case 'RECALL_REQUEST': {
      const { requestId } = action.payload;
      return {
        ...state,
        requests: state.requests.map((request) => {
          const allowed = state.requestRules.allowRecall && canRecall(state.currentUser, request);
          if (request.id !== requestId || !allowed) return request;

          return {
            ...request,
            status: STATUSES.RECALLED,
            route: request.route.map((step) => ({
              ...step,
              status: step.status === 'approved' ? step.status : 'skipped',
            })),
            timeline: [
              ...request.timeline,
              {
                id: generateId(),
                action: 'Request recalled',
                actorId: state.currentUser.id,
                date: new Date().toISOString(),
                note: 'Recalled by requester',
              },
            ],
          };
        }),
      };
    }

    case 'RESUBMIT_REQUEST': {
      const { requestId } = action.payload;
      return {
        ...state,
        requests: state.requests.map((request) => {
          const allowed = state.requestRules.allowResubmission && canResubmit(state.currentUser, request);
          if (request.id !== requestId || !allowed) return request;

          const policy = getMatchedPolicy(request.companyId, request.category, request.amount, state.policies);
          if (!policy) return request;

          const route = buildApprovalSteps(policy);

          return {
            ...request,
            status: route.length > 0 ? STATUSES.IN_APPROVAL : STATUSES.AWAITING_FINANCE,
            route,
            currentStepIndex: route.length > 0 ? 0 : null,
            policyId: policy.id,
            policyName: policy.name,
            policyVersion: policy.version || 1,
            policySnapshot: {
              ...policy,
              steps: [...policy.steps],
            },
            rejectionReason: undefined,
            timeline: [
              ...request.timeline,
              {
                id: generateId(),
                action: 'Resubmitted',
                actorId: state.currentUser.id,
                date: new Date().toISOString(),
              },
              {
                id: generateId(),
                action: 'Route regenerated',
                actorId: 'system',
                date: new Date().toISOString(),
                note: buildRouteLabel(policy),
              },
            ],
          };
        }),
      };
    }

    case 'PAY_LINE_ITEM': {
      const { requestId, payeeId } = action.payload;
      return {
        ...state,
        requests: state.requests.map((request) => {
          if (request.id !== requestId || !canPayLineItem(state.currentUser, request)) return request;

          const payees = request.payees.map((payee) =>
            payee.id === payeeId
              ? { ...payee, isPaid: true, paidDate: new Date().toISOString(), ref: generateRef() }
              : payee
          );

          const paidPayee = payees.find((payee) => payee.id === payeeId);
          const allPaid = payees.every((payee) => payee.isPaid);
          const somePaid = payees.some((payee) => payee.isPaid);

          const timeline = [
            ...request.timeline,
            {
              id: generateId(),
              action: `Paid: ${paidPayee?.name}`,
              actorId: state.currentUser.id,
              role: 'Finance',
              date: new Date().toISOString(),
              note: `${paidPayee?.bank} · ₦${Number(paidPayee?.amount).toLocaleString()}`,
            },
          ];

          if (allPaid) {
            timeline.push({
              id: generateId(),
              action: 'All payments complete',
              actorId: 'system',
              date: new Date().toISOString(),
            });
          }

          return {
            ...request,
            payees,
            timeline,
            status: allPaid ? STATUSES.PAID : somePaid ? STATUSES.PARTIALLY_PAID : request.status,
          };
        }),
      };
    }

    default:
      return state;
  }
}

export function WorkflowProvider({ children }) {
  const [state, dispatch] = useReducer(workflowReducer, initialState);

  const actions = useMemo(() => ({
    setUser: (user) => dispatch({ type: 'SET_USER', payload: user }),
    showToast: (message, type = 'success') => dispatch({ type: 'SET_TOAST', payload: { message, type } }),
    clearToast: () => dispatch({ type: 'CLEAR_TOAST' }),
    submitRequest: (formData) => dispatch({ type: 'SUBMIT_REQUEST', payload: { formData } }),
    approveStep: (requestId) => dispatch({ type: 'APPROVE_STEP', payload: { requestId } }),
    rejectStep: (requestId, reason) => dispatch({ type: 'REJECT_STEP', payload: { requestId, reason } }),
    recallRequest: (requestId) => dispatch({ type: 'RECALL_REQUEST', payload: { requestId } }),
    resubmitRequest: (requestId) => dispatch({ type: 'RESUBMIT_REQUEST', payload: { requestId } }),
    payLineItem: (requestId, payeeId) => dispatch({ type: 'PAY_LINE_ITEM', payload: { requestId, payeeId } }),
    saveCompany: (company) => dispatch({ type: 'SAVE_COMPANY', payload: { company } }),
    saveUser: (user) => dispatch({ type: 'SAVE_USER', payload: { user } }),
    savePolicy: (policy) => dispatch({ type: 'SAVE_POLICY', payload: { policy } }),
    saveRequestRules: (rules) => dispatch({ type: 'SAVE_REQUEST_RULES', payload: { rules } }),
    saveSavedAccount: (account) => dispatch({ type: 'SAVE_SAVED_ACCOUNT', payload: { account } }),
    deleteSavedAccount: (accountId) => dispatch({ type: 'DELETE_SAVED_ACCOUNT', payload: { accountId } }),
  }), []);

  const selectors = useMemo(() => ({
    canActOnStep: (request) => canActOnStep(state.currentUser, request),
    canPayLineItem: (request) => canPayLineItem(state.currentUser, request),
    canRecall: (request) => state.requestRules.allowRecall && canRecall(state.currentUser, request),
    canResubmit: (request) => state.requestRules.allowResubmission && canResubmit(state.currentUser, request),
    getMyActions: () => getMyActions(state.requests, state.currentUser),
    getDashboardStats: () => getDashboardStats(state.requests, state.currentUser),
    getVisibleRequests: () => state.requests,
    getUserById: (id) => state.users.find((user) => user.id === id),
    getCompanyById: (id) => state.companies.find((company) => company.id === id),
    getPoliciesByCompany: (companyId) => state.policies.filter((policy) => policy.companyId === companyId),
    getProcurementPolicies: () => state.policies.filter((policy) => policy.requiredQuotes > 0),
    getMatchedPolicy: (companyId, category, amount) => getMatchedPolicy(companyId, category, amount, state.policies),
    getCategoriesForCompany: (companyId) => getCategoriesForCompany(companyId, state.policies, state.companies),
    getMySavedAccounts: () => state.savedAccounts.filter((account) => account.userId === state.currentUser.id),
    getSettingsAuditLog: () => state.settingsAuditLog,
    isSettingsAdmin: () => state.currentUser.role === 'Admin',
  }), [state]);

  return (
    <WorkflowStoreContext.Provider value={{ state, actions, selectors }}>
      {children}
    </WorkflowStoreContext.Provider>
  );
}
