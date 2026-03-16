import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { ConvexProvider, ConvexReactClient, useMutation, useQuery } from "convex/react";

import { api } from "./convex/_generated/api";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

const DEMO_USERS = [
  { name: "Sunday Ajayi", role: "Admin", email: "sunday@payrail.local" },
  { name: "Emeka Obi", role: "Supervisor", email: "emeka@quickmove.com" },
  { name: "Bola Adeyemi", role: "Head of Ops", email: "bola@quickmove.com" },
  { name: "Tunde Bakare", role: "CFO", email: "tunde@payrail.local" },
  { name: "Ngozi Eze", role: "Finance", email: "ngozi@payrail.local" },
  { name: "Kalu Nwachukwu", role: "Team Lead", email: "kalu@aerocool.com" },
  { name: "Amina Ibrahim", role: "Ops Manager", email: "amina@aerocool.com" },
  { name: "Femi Adegoke", role: "MD", email: "femi@aerocool.com" },
];

const STATUS_LABELS = {
  draft: "Draft",
  in_approval: "In approval",
  awaiting_finance: "Awaiting finance",
  partially_paid: "Partially paid",
  paid: "Paid",
  rejected: "Rejected",
  recalled: "Recalled",
};

const STATUS_ORDER = [
  "in_approval",
  "awaiting_finance",
  "partially_paid",
  "paid",
  "rejected",
  "recalled",
];

const createPayee = () => ({
  payeeName: "",
  bankName: "",
  accountNumber: "",
  amount: "",
});

const createQuote = () => ({
  vendorName: "",
  quotedAmount: "",
  quoteReference: "",
  notes: "",
});

function formatMoney(amount) {
  if (amount === undefined || amount === null || Number.isNaN(Number(amount))) return "₦0";
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return `₦${Number(amount).toLocaleString()}`;
  }
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function getLowestQuoteIndex(quotes) {
  if (!quotes.length) return -1;
  let lowestIndex = -1;
  let lowestValue = Number.POSITIVE_INFINITY;

  quotes.forEach((quote, index) => {
    const value = Number(quote.quotedAmount);
    if (!Number.isFinite(value) || value <= 0) return;
    if (value < lowestValue) {
      lowestValue = value;
      lowestIndex = index;
    }
  });

  return lowestIndex;
}

function buildRoleMap(assignments = []) {
  const map = new Map();

  assignments.forEach((assignment) => {
    const roles = map.get(assignment.companyId) ?? new Set();
    roles.add(assignment.role);
    map.set(assignment.companyId, roles);
  });

  return map;
}

function hasRole(roleMap, companyId, role) {
  return roleMap.get(companyId)?.has(role) ?? false;
}

function canApproveRequest(request, userId, isAdmin, roleMap) {
  if (!request || request.status !== "in_approval") return false;
  if (isAdmin) return true;

  const currentStep =
    request.currentStepIndex === null ? null : request.route[request.currentStepIndex] ?? null;

  if (!currentStep || currentStep.status !== "pending") return false;
  return hasRole(roleMap, request.companyId, currentStep.role);
}

function canPayRequest(request, isAdmin, roleMap) {
  if (!request || !["awaiting_finance", "partially_paid"].includes(request.status)) return false;
  if (isAdmin) return true;
  return hasRole(roleMap, request.companyId, "Finance");
}

function canRecallRequest(request, userId, isAdmin) {
  if (!request) return false;
  if (!["in_approval", "awaiting_finance", "partially_paid"].includes(request.status)) return false;
  return isAdmin || request.requesterId === userId;
}

function canResubmitRequest(request, userId, isAdmin) {
  if (!request) return false;
  if (!["rejected", "recalled"].includes(request.status)) return false;
  return isAdmin || request.requesterId === userId;
}

function isActionableRequest(request, userId, isAdmin, roleMap) {
  return (
    canApproveRequest(request, userId, isAdmin, roleMap) ||
    canPayRequest(request, isAdmin, roleMap) ||
    canRecallRequest(request, userId, isAdmin) ||
    canResubmitRequest(request, userId, isAdmin)
  );
}

function SectionCard({ title, subtitle, children, right }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

function PersonaBar({ activeEmail, onChange }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.personaBar}
    >
      {DEMO_USERS.map((user) => {
        const isActive = user.email === activeEmail;
        return (
          <Pressable
            key={user.email}
            onPress={() => onChange(user.email)}
            style={[styles.personaPill, isActive && styles.personaPillActive]}
          >
            <Text style={[styles.personaName, isActive && styles.personaNameActive]}>
              {user.name}
            </Text>
            <Text style={[styles.personaRole, isActive && styles.personaRoleActive]}>
              {user.role}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function FilterBar({ activeFilter, onChange, stats }) {
  const items = [
    { key: "all", label: "All", count: stats?.requestCount ?? 0 },
    ...STATUS_ORDER.map((status) => ({
      key: status,
      label: STATUS_LABELS[status],
      count: stats?.byStatus?.[status]?.count ?? 0,
    })).filter((item) => item.count > 0),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterBar}
    >
      {items.map((item) => {
        const isActive =
          item.key === "all" ? activeFilter === null : activeFilter === item.key;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key === "all" ? null : item.key)}
            style={[styles.filterChip, isActive && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
              {item.label}
            </Text>
            <View style={[styles.filterCount, isActive && styles.filterCountActive]}>
              <Text style={[styles.filterCountText, isActive && styles.filterCountTextActive]}>
                {item.count}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function RequestCard({ item, onPress, actionable }) {
  const currentStep =
    item.currentStepIndex === null ? null : item.route[item.currentStepIndex] ?? null;
  const paidCount = item.payees.filter((payee) => payee.isPaid).length;

  return (
    <Pressable
      style={[styles.requestCard, actionable && styles.requestCardActionable]}
      onPress={() => onPress(item._id)}
    >
      <View style={styles.requestTopRow}>
        <View style={styles.requestTitleStack}>
          <Text style={styles.requestId}>{item.id}</Text>
          <Text style={styles.requestCompany}>{item.companyName}</Text>
        </View>
        <View style={[styles.statusPill, styles[`status_${item.status}`]]}>
          <Text style={styles.statusPillText}>{STATUS_LABELS[item.status] ?? item.status}</Text>
        </View>
      </View>

      <Text style={styles.requestDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.requestMetaRow}>
        <Text style={styles.requestMeta}>{item.category}</Text>
        <Text style={styles.requestMetaDot}>•</Text>
        <Text style={styles.requestMeta}>{formatMoney(item.amount)}</Text>
        <Text style={styles.requestMetaDot}>•</Text>
        <Text style={styles.requestMeta}>{paidCount}/{item.payees.length} paid</Text>
      </View>

      <View style={styles.requestFooterRow}>
        <Text style={styles.requestFooterText}>
          {currentStep ? `Pending: ${currentStep.role}` : "Workflow complete"}
        </Text>
        {actionable ? <Text style={styles.requestActionLabel}>Action required</Text> : null}
      </View>
    </Pressable>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function RequestModal({
  request,
  onClose,
  onApprove,
  onReject,
  onRecall,
  onResubmit,
  onPay,
  busy,
  permissions,
}) {
  if (!request) return null;

  const currentStep =
    request.currentStepIndex === null ? null : request.route[request.currentStepIndex] ?? null;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe}>
        <StatusBar style="light" />
        <KeyboardAvoidingView
          style={styles.modalSafe}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalTop}>
              <View>
                <Text style={styles.modalEyebrow}>{request.companyName}</Text>
                <Text style={styles.modalTitle}>{request.id}</Text>
              </View>
              <Pressable onPress={onClose} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>Close</Text>
              </Pressable>
            </View>

            <Text style={styles.modalDescription}>{request.description}</Text>

            <SectionCard title="Summary" subtitle="Live state from Convex">
              <DetailRow label="Amount" value={formatMoney(request.amount)} />
              <DetailRow
                label="Status"
                value={STATUS_LABELS[request.status] ?? request.status}
              />
              <DetailRow label="Category" value={request.category} />
              <DetailRow label="Submitted" value={formatDate(request.date)} />
              {request.policyName ? (
                <DetailRow label="Policy" value={request.policyName} />
              ) : null}
              {currentStep ? (
                <DetailRow
                  label="Current step"
                  value={`${currentStep.role} (${currentStep.status})`}
                />
              ) : null}
            </SectionCard>

            <SectionCard
              title="Approval Flow"
              subtitle="Dynamic stages can be 1 step or many"
            >
              {request.route.map((step) => {
                const isCurrent =
                  request.status === "in_approval" &&
                  currentStep?._id === step._id &&
                  step.status === "pending";

                return (
                  <View key={step._id} style={styles.flowStep}>
                    <View style={styles.flowStepHeader}>
                      <Text style={styles.flowStepTitle}>
                        Step {step.step}: {step.role}
                      </Text>
                      <Text
                        style={[
                          styles.flowStepState,
                          isCurrent && styles.flowStepStateCurrent,
                        ]}
                      >
                        {step.status}
                      </Text>
                    </View>
                    {step.actorName || step.date || step.note ? (
                      <Text style={styles.flowStepMeta}>
                        {[step.actorName, step.date ? formatDate(step.date) : null, step.note]
                          .filter(Boolean)
                          .join(" • ")}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
              {["awaiting_finance", "partially_paid"].includes(request.status) ? (
                <Text style={styles.financeHint}>
                  Business approvals are complete. Finance is processing payees one by one.
                </Text>
              ) : null}
            </SectionCard>

            <SectionCard title="Payees" subtitle={`${request.payees.length} line items`}>
              {request.payees.map((payee) => (
                <View key={payee.id} style={styles.payeeCard}>
                  <View style={styles.payeeCardTop}>
                    <View style={styles.payeeCardText}>
                      <Text style={styles.payeeName}>{payee.name}</Text>
                      <Text style={styles.payeeMeta}>
                        {payee.bank} • {payee.accountNumber}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.payeeAmount}>{formatMoney(payee.amount)}</Text>
                      <Text style={payee.isPaid ? styles.payeePaid : styles.payeePending}>
                        {payee.isPaid ? `Paid • ${payee.ref ?? "ref pending"}` : "Unpaid"}
                      </Text>
                    </View>
                  </View>
                  {!payee.isPaid && permissions.canPay ? (
                    <Pressable
                      onPress={() => onPay(request._id, payee.id)}
                      style={[styles.inlineAction, styles.actionSuccess]}
                      disabled={busy}
                    >
                      <Text style={styles.inlineActionText}>Mark as paid</Text>
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </SectionCard>

            {request.timeline?.length ? (
              <SectionCard title="Audit Trail" subtitle="Newest first">
                {request.timeline.map((event) => (
                  <View key={event.id} style={styles.timelineItem}>
                    <Text style={styles.timelineAction}>{event.action}</Text>
                    <Text style={styles.timelineMeta}>
                      {[event.actorName || "System", formatDate(event.date), event.note]
                        .filter(Boolean)
                        .join(" • ")}
                    </Text>
                  </View>
                ))}
              </SectionCard>
            ) : null}

            <SectionCard title="Actions" subtitle="Only valid actions are shown">
              {permissions.canApprove ? (
                <View style={styles.dualActionRow}>
                  <Pressable
                    onPress={() => onApprove(request._id)}
                    style={[styles.primaryAction, styles.actionPrimary]}
                    disabled={busy}
                  >
                    <Text style={styles.primaryActionText}>Approve step</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onReject(request._id)}
                    style={[styles.primaryAction, styles.actionDanger]}
                    disabled={busy}
                  >
                    <Text style={styles.primaryActionText}>Reject step</Text>
                  </Pressable>
                </View>
              ) : null}

              {permissions.canRecall ? (
                <Pressable
                  onPress={() => onRecall(request._id)}
                  style={[styles.primaryAction, styles.actionWarning]}
                  disabled={busy}
                >
                  <Text style={styles.primaryActionText}>Recall request</Text>
                </Pressable>
              ) : null}

              {permissions.canResubmit ? (
                <Pressable
                  onPress={() => onResubmit(request._id)}
                  style={[styles.primaryAction, styles.actionPrimary]}
                  disabled={busy}
                >
                  <Text style={styles.primaryActionText}>Resubmit request</Text>
                </Pressable>
              ) : null}

              {!permissions.canApprove &&
              !permissions.canRecall &&
              !permissions.canResubmit &&
              !permissions.canPay ? (
                <Text style={styles.emptyHint}>
                  No action is available for this persona on the current request state.
                </Text>
              ) : null}
            </SectionCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function Field({ label, hint, children }) {
  return (
    <View style={styles.fieldWrap}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function ChoiceRow({ items, value, onChange }) {
  return (
    <View style={styles.choiceRow}>
      {items.map((item) => {
        const isActive = item.value === value;
        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            style={[styles.choiceChip, isActive && styles.choiceChipActive]}
          >
            <Text style={[styles.choiceChipText, isActive && styles.choiceChipTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function NewRequestModal({ visible, onClose, user, userId, companies, onSubmitted }) {
  const submitRequest = useMutation(api.requests.submitRequest);

  const [companyId, setCompanyId] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [payees, setPayees] = useState([createPayee()]);
  const [quotes, setQuotes] = useState([]);
  const [selectedQuoteIndex, setSelectedQuoteIndex] = useState(-1);
  const [quoteJustification, setQuoteJustification] = useState("");
  const [singleSourceException, setSingleSourceException] = useState(false);
  const [singleSourceReason, setSingleSourceReason] = useState("");
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const totalAmount = useMemo(
    () => payees.reduce((sum, payee) => sum + (Number(payee.amount) || 0), 0),
    [payees],
  );

  const selectedCompany = companies.find((company) => company._id === companyId) ?? null;
  const categories = selectedCompany?.enabledCategories ?? [];

  const policy = useQuery(
    api.settings.getActivePolicyForAmountBand,
    visible && userId && companyId && category && totalAmount > 0
      ? { userId, companyId, category, amount: totalAmount }
      : "skip",
  );

  const requiredQuotes = policy?.requiredQuotes ?? 0;
  const lowestQuoteIndex = getLowestQuoteIndex(quotes);
  const requiresJustification =
    policy?.requireJustificationIfNotLowest &&
    selectedQuoteIndex >= 0 &&
    selectedQuoteIndex !== lowestQuoteIndex &&
    lowestQuoteIndex >= 0;

  const canUseSingleSource = Boolean(policy?.allowSingleSourceException);
  const routeSteps = policy
    ? [
        ...(policy.businessSteps ?? []),
        ...(policy.requiresFinanceDisbursement ? ["Finance"] : []),
      ]
    : [];

  useEffect(() => {
    if (!visible) return;
    if (!companyId && companies.length > 0) setCompanyId(companies[0]._id);
  }, [visible, companyId, companies]);

  useEffect(() => {
    if (!visible) return;
    if (!categories.includes(category)) setCategory(categories[0] ?? "");
  }, [visible, categories, category]);

  useEffect(() => {
    if (!visible) return;
    if (requiredQuotes <= 0) {
      setQuotes([]);
      setSelectedQuoteIndex(-1);
      setQuoteJustification("");
      setSingleSourceException(false);
      setSingleSourceReason("");
      return;
    }

    setQuotes((current) => {
      if (current.length >= requiredQuotes) return current;
      return [...current, ...Array.from({ length: requiredQuotes - current.length }, createQuote)];
    });

    if (!canUseSingleSource) {
      setSingleSourceException(false);
      setSingleSourceReason("");
    }
  }, [visible, requiredQuotes, canUseSingleSource]);

  const resetForm = () => {
    setCompanyId(companies[0]?._id ?? "");
    setCategory(companies[0]?.enabledCategories?.[0] ?? "");
    setDescription("");
    setPayees([createPayee()]);
    setQuotes([]);
    setSelectedQuoteIndex(-1);
    setQuoteJustification("");
    setSingleSourceException(false);
    setSingleSourceReason("");
    setErrors([]);
    setSubmitting(false);
  };

  const closeComposer = () => {
    resetForm();
    onClose();
  };

  const updatePayee = (index, field, value) => {
    setPayees((current) =>
      current.map((payee, payeeIndex) =>
        payeeIndex === index ? { ...payee, [field]: value } : payee,
      ),
    );
  };

  const addPayee = () => setPayees((current) => [...current, createPayee()]);

  const removePayee = (index) => {
    setPayees((current) =>
      current.length === 1 ? current : current.filter((_, payeeIndex) => payeeIndex !== index),
    );
  };

  const updateQuote = (index, field, value) => {
    setQuotes((current) =>
      current.map((quote, quoteIndex) =>
        quoteIndex === index ? { ...quote, [field]: value } : quote,
      ),
    );
  };

  const addQuote = () => setQuotes((current) => [...current, createQuote()]);

  const removeQuote = (index) => {
    setQuotes((current) => current.filter((_, quoteIndex) => quoteIndex !== index));
    setSelectedQuoteIndex((current) => {
      if (current === index) return -1;
      if (current > index) return current - 1;
      return current;
    });
  };

  const validate = () => {
    const nextErrors = [];

    if (!companyId) nextErrors.push("Pick a company.");
    if (!category) nextErrors.push("Pick a category.");
    if (!description.trim()) nextErrors.push("Add a short description.");
    if (totalAmount <= 0) nextErrors.push("Add at least one payee with an amount.");

    payees.forEach((payee, index) => {
      if (!payee.payeeName.trim()) nextErrors.push(`Payee ${index + 1}: name is required.`);
      if (!payee.bankName.trim()) nextErrors.push(`Payee ${index + 1}: bank is required.`);
      if (!payee.accountNumber.trim()) {
        nextErrors.push(`Payee ${index + 1}: account number is required.`);
      }
      if (!(Number(payee.amount) > 0)) {
        nextErrors.push(`Payee ${index + 1}: amount must be greater than zero.`);
      }
    });

    if (totalAmount > 0 && !policy) {
      nextErrors.push("No active policy matches this company, category, and amount.");
    }

    if (requiredQuotes > 0 && !singleSourceException) {
      if (quotes.length < requiredQuotes) {
        nextErrors.push(`This request needs ${requiredQuotes} quotes.`);
      }

      const vendorNames = quotes.map((quote) => quote.vendorName.trim().toLowerCase()).filter(Boolean);
      if (new Set(vendorNames).size !== vendorNames.length) {
        nextErrors.push("Each quote must come from a different vendor.");
      }

      quotes.forEach((quote, index) => {
        if (!quote.vendorName.trim()) {
          nextErrors.push(`Quote ${index + 1}: vendor name is required.`);
        }
        if (!(Number(quote.quotedAmount) > 0)) {
          nextErrors.push(`Quote ${index + 1}: amount must be greater than zero.`);
        }
      });

      if (selectedQuoteIndex < 0) {
        nextErrors.push("Select the recommended vendor.");
      }

      if (requiresJustification && !quoteJustification.trim()) {
        nextErrors.push("Explain why you selected a vendor that is not the lowest quote.");
      }
    }

    if (requiredQuotes > 0 && singleSourceException) {
      if (!canUseSingleSource) {
        nextErrors.push("This policy does not allow a single-source exception.");
      }
      if (!singleSourceReason.trim()) {
        nextErrors.push("Add a reason for using the single-source exception.");
      }
    }

    setErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const handleSubmit = async () => {
    if (!userId || !validate()) return;

    setSubmitting(true);

    try {
      await submitRequest({
        userId,
        companyId,
        category,
        description: description.trim(),
        payees: payees.map((payee) => ({
          payeeName: payee.payeeName.trim(),
          bankName: payee.bankName.trim(),
          accountNumber: payee.accountNumber.trim(),
          amount: Number(payee.amount),
        })),
        quotes:
          requiredQuotes > 0 && !singleSourceException
            ? quotes.map((quote) => ({
                vendorName: quote.vendorName.trim(),
                quotedAmount: Number(quote.quotedAmount),
                quoteReference: quote.quoteReference.trim(),
                validityDate: undefined,
                notes: quote.notes.trim() || undefined,
              }))
            : undefined,
        selectedQuoteIndex:
          requiredQuotes > 0 && !singleSourceException && selectedQuoteIndex >= 0
            ? selectedQuoteIndex
            : undefined,
        quoteJustification:
          requiredQuotes > 0 && !singleSourceException && quoteJustification.trim()
            ? quoteJustification.trim()
            : undefined,
        singleSourceExceptionEnabled: requiredQuotes > 0 ? singleSourceException : false,
        singleSourceExceptionReason:
          requiredQuotes > 0 && singleSourceException && singleSourceReason.trim()
            ? singleSourceReason.trim()
            : undefined,
      });

      resetForm();
      onSubmitted();
    } catch (error) {
      setErrors([error?.message ?? "Failed to submit request."]);
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible animationType="slide" onRequestClose={closeComposer}>
      <SafeAreaView style={styles.modalSafe}>
        <StatusBar style="light" />
        <KeyboardAvoidingView
          style={styles.modalSafe}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalTop}>
              <View>
                <Text style={styles.modalEyebrow}>New request</Text>
                <Text style={styles.modalTitle}>Create payment request</Text>
              </View>
              <Pressable onPress={closeComposer} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>Close</Text>
              </Pressable>
            </View>

            <Text style={styles.modalDescription}>
              Submit against live company policy rules. Quotes and approvals change with the
              amount band.
            </Text>

            <SectionCard title="Requester" subtitle="Active demo persona">
              <DetailRow label="Name" value={user?.name ?? "Unknown"} />
              <DetailRow
                label="Roles"
                value={user?.assignments?.map((assignment) => assignment.role).join(", ") || "—"}
              />
            </SectionCard>

            <SectionCard title="Request Details" subtitle="Choose the right company and category">
              <Field label="Company">
                <ChoiceRow
                  items={companies.map((company) => ({
                    label: company.tag,
                    value: company._id,
                  }))}
                  value={companyId}
                  onChange={(nextCompanyId) => {
                    setCompanyId(nextCompanyId);
                    setCategory("");
                  }}
                />
              </Field>

              <Field label="Category">
                <ChoiceRow
                  items={categories.map((item) => ({ label: item, value: item }))}
                  value={category}
                  onChange={setCategory}
                />
              </Field>

              <Field label="Description" hint="Visible on the request card">
                <TextInput
                  multiline
                  numberOfLines={4}
                  placeholder="Explain what this payment is for..."
                  placeholderTextColor="#7b889c"
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                />
              </Field>
            </SectionCard>

            <SectionCard
              title="Payees"
              subtitle="Each payee becomes its own line item for Finance"
              right={
                <Pressable onPress={addPayee} style={styles.linkButton}>
                  <Text style={styles.linkButtonText}>Add payee</Text>
                </Pressable>
              }
            >
              {payees.map((payee, index) => (
                <View key={`payee-${index}`} style={styles.editorCard}>
                  <View style={styles.editorHeader}>
                    <Text style={styles.editorTitle}>Payee {index + 1}</Text>
                    {payees.length > 1 ? (
                      <Pressable onPress={() => removePayee(index)}>
                        <Text style={styles.removeText}>Remove</Text>
                      </Pressable>
                    ) : null}
                  </View>

                  <Field label="Payee name">
                    <TextInput
                      placeholder="Vendor or beneficiary"
                      placeholderTextColor="#7b889c"
                      style={styles.input}
                      value={payee.payeeName}
                      onChangeText={(value) => updatePayee(index, "payeeName", value)}
                    />
                  </Field>

                  <Field label="Bank">
                    <TextInput
                      placeholder="e.g. Zenith Bank"
                      placeholderTextColor="#7b889c"
                      style={styles.input}
                      value={payee.bankName}
                      onChangeText={(value) => updatePayee(index, "bankName", value)}
                    />
                  </Field>

                  <Field label="Account number">
                    <TextInput
                      placeholder="0123456789"
                      placeholderTextColor="#7b889c"
                      keyboardType="number-pad"
                      style={styles.input}
                      value={payee.accountNumber}
                      onChangeText={(value) => updatePayee(index, "accountNumber", value)}
                    />
                  </Field>

                  <Field label="Amount">
                    <TextInput
                      placeholder="0"
                      placeholderTextColor="#7b889c"
                      keyboardType="numeric"
                      style={styles.input}
                      value={payee.amount}
                      onChangeText={(value) => updatePayee(index, "amount", value)}
                    />
                  </Field>
                </View>
              ))}

              <View style={styles.totalStrip}>
                <Text style={styles.totalStripLabel}>Request total</Text>
                <Text style={styles.totalStripValue}>{formatMoney(totalAmount)}</Text>
              </View>
            </SectionCard>

            <SectionCard title="Matched Policy" subtitle="Dynamic world rules from settings">
              {companyId && category && totalAmount > 0 && policy === undefined ? (
                <View style={styles.loadingInline}>
                  <ActivityIndicator color="#82cfff" />
                  <Text style={styles.loadingText}>Checking the active approval policy...</Text>
                </View>
              ) : null}

              {policy ? (
                <View style={styles.policyBox}>
                  <Text style={styles.policyName}>{policy.name}</Text>
                  <Text style={styles.policyCopy}>
                    {formatMoney(policy.minAmount)} to {formatMoney(policy.maxAmount)} •{" "}
                    {requiredQuotes} quote{requiredQuotes === 1 ? "" : "s"}
                  </Text>

                  <View style={styles.routeRow}>
                    {routeSteps.map((step, index) => (
                      <View key={`${step}-${index}`} style={styles.routeStepWrap}>
                        <View style={styles.routeStep}>
                          <Text style={styles.routeStepText}>{step}</Text>
                        </View>
                        {index < routeSteps.length - 1 ? (
                          <Text style={styles.routeArrow}>→</Text>
                        ) : null}
                      </View>
                    ))}
                  </View>

                  {policy.quoteRuleLabel ? (
                    <Text style={styles.policyRule}>{policy.quoteRuleLabel}</Text>
                  ) : null}

                  {policy.requireJustificationIfNotLowest ? (
                    <Text style={styles.policySubRule}>
                      Selecting a non-lowest vendor requires justification.
                    </Text>
                  ) : null}
                </View>
              ) : totalAmount > 0 ? (
                <Text style={styles.emptyHint}>
                  No matching policy yet. Check the company, category, and amount band.
                </Text>
              ) : (
                <Text style={styles.emptyHint}>
                  Add payees and amount first so we can match the correct route.
                </Text>
              )}
            </SectionCard>

            {requiredQuotes > 0 ? (
              <SectionCard
                title="Quotes"
                subtitle="This section expands or contracts from policy rules"
                right={
                  <Pressable onPress={addQuote} style={styles.linkButton}>
                    <Text style={styles.linkButtonText}>Add quote</Text>
                  </Pressable>
                }
              >
                {canUseSingleSource ? (
                  <Pressable
                    onPress={() => setSingleSourceException((current) => !current)}
                    style={[
                      styles.toggleCard,
                      singleSourceException && styles.toggleCardActive,
                    ]}
                  >
                    <View>
                      <Text style={styles.toggleTitle}>Single-source exception</Text>
                      <Text style={styles.toggleCopy}>
                        Use this only when the policy allows it and you can explain why.
                      </Text>
                    </View>
                    <Text style={styles.toggleState}>
                      {singleSourceException ? "On" : "Off"}
                    </Text>
                  </Pressable>
                ) : null}

                {singleSourceException ? (
                  <Field label="Exception reason">
                    <TextInput
                      multiline
                      numberOfLines={3}
                      placeholder="Why are we proceeding with a single source vendor?"
                      placeholderTextColor="#7b889c"
                      style={[styles.input, styles.textArea]}
                      value={singleSourceReason}
                      onChangeText={setSingleSourceReason}
                    />
                  </Field>
                ) : (
                  <>
                    {quotes.map((quote, index) => {
                      const isLowest = lowestQuoteIndex === index;
                      const isSelected = selectedQuoteIndex === index;

                      return (
                        <View key={`quote-${index}`} style={styles.editorCard}>
                          <View style={styles.editorHeader}>
                            <Text style={styles.editorTitle}>Quote {index + 1}</Text>
                            <View style={styles.editorHeaderRight}>
                              {isLowest ? <Text style={styles.lowestTag}>Lowest</Text> : null}
                              {quotes.length > requiredQuotes ? (
                                <Pressable onPress={() => removeQuote(index)}>
                                  <Text style={styles.removeText}>Remove</Text>
                                </Pressable>
                              ) : null}
                            </View>
                          </View>

                          <Field label="Vendor">
                            <TextInput
                              placeholder="Vendor name"
                              placeholderTextColor="#7b889c"
                              style={styles.input}
                              value={quote.vendorName}
                              onChangeText={(value) => updateQuote(index, "vendorName", value)}
                            />
                          </Field>

                          <Field label="Quoted amount">
                            <TextInput
                              placeholder="0"
                              placeholderTextColor="#7b889c"
                              keyboardType="numeric"
                              style={styles.input}
                              value={quote.quotedAmount}
                              onChangeText={(value) => updateQuote(index, "quotedAmount", value)}
                            />
                          </Field>

                          <Field label="Reference">
                            <TextInput
                              placeholder="Quote reference"
                              placeholderTextColor="#7b889c"
                              style={styles.input}
                              value={quote.quoteReference}
                              onChangeText={(value) => updateQuote(index, "quoteReference", value)}
                            />
                          </Field>

                          <Field label="Notes" hint="Optional">
                            <TextInput
                              multiline
                              numberOfLines={3}
                              placeholder="Any vendor notes"
                              placeholderTextColor="#7b889c"
                              style={[styles.input, styles.textArea]}
                              value={quote.notes}
                              onChangeText={(value) => updateQuote(index, "notes", value)}
                            />
                          </Field>

                          <Pressable
                            onPress={() => setSelectedQuoteIndex(index)}
                            style={[
                              styles.inlineAction,
                              isSelected ? styles.actionPrimary : styles.actionMuted,
                            ]}
                          >
                            <Text
                              style={[
                                styles.inlineActionText,
                                isSelected && styles.inlineActionTextLight,
                              ]}
                            >
                              {isSelected ? "Recommended vendor selected" : "Use this vendor"}
                            </Text>
                          </Pressable>
                        </View>
                      );
                    })}

                    {requiresJustification ? (
                      <Field label="Why this vendor was chosen">
                        <TextInput
                          multiline
                          numberOfLines={3}
                          placeholder="Explain why the selected quote is not the lowest."
                          placeholderTextColor="#7b889c"
                          style={[styles.input, styles.textArea]}
                          value={quoteJustification}
                          onChangeText={setQuoteJustification}
                        />
                      </Field>
                    ) : null}
                  </>
                )}
              </SectionCard>
            ) : null}

            {errors.length > 0 ? (
              <View style={styles.errorBox}>
                {errors.map((error) => (
                  <Text key={error} style={styles.errorLine}>
                    • {error}
                  </Text>
                ))}
              </View>
            ) : null}

            <Pressable
              onPress={handleSubmit}
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? "Submitting..." : "Submit request"}
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function HomeScreen() {
  const [activeEmail, setActiveEmail] = useState(DEMO_USERS[0].email);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [showComposer, setShowComposer] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const user = useQuery(api.settings.resolveDemoUserByEmail, { email: activeEmail });
  const userId = user?.userId;

  const requests = useQuery(
    api.requests.getVisibleRequestsForUser,
    userId ? { userId } : "skip",
  );
  const stats = useQuery(
    api.requests.getDashboardStatsForUser,
    userId ? { userId } : "skip",
  );
  const companies = useQuery(
    api.settings.getCompanies,
    userId ? { userId } : "skip",
  );

  const approve = useMutation(api.requests.approveCurrentStep);
  const reject = useMutation(api.requests.rejectCurrentStep);
  const recall = useMutation(api.requests.recallRequest);
  const resubmit = useMutation(api.requests.resubmitRequest);
  const payLineItem = useMutation(api.requests.payLineItem);

  const isAdmin = Boolean(user?.assignments?.some((assignment) => assignment.role === "Admin"));
  const roleMap = useMemo(() => buildRoleMap(user?.assignments ?? []), [user]);
  const requestList = requests ?? [];
  const filteredRequests = useMemo(() => {
    if (!statusFilter) return requestList;
    return requestList.filter((request) => request.status === statusFilter);
  }, [requestList, statusFilter]);

  const selectedRequest =
    selectedRequestId ? requestList.find((request) => request._id === selectedRequestId) ?? null : null;

  const actionableIds = useMemo(
    () =>
      new Set(
        requestList
          .filter((request) => isActionableRequest(request, userId, isAdmin, roleMap))
          .map((request) => request._id),
      ),
    [requestList, userId, isAdmin, roleMap],
  );

  const loading =
    user === undefined || requests === undefined || stats === undefined || companies === undefined;

  const ensureUser = () => {
    if (!userId) {
      setErrorMessage("This persona is not mapped to a Convex user.");
      return false;
    }
    return true;
  };

  const run = async (task) => {
    setBusy(true);
    setErrorMessage("");
    try {
      await task();
    } catch (error) {
      setErrorMessage(error?.message ?? "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const onPersonaChange = (email) => {
    setActiveEmail(email);
    setSelectedRequestId(null);
    setShowComposer(false);
    setStatusFilter(null);
    setErrorMessage("");
  };

  const handleApprove = (requestId) =>
    ensureUser() && run(() => approve({ userId, requestId }));

  const handleReject = (requestId) =>
    ensureUser() &&
    run(() =>
      reject({
        userId,
        requestId,
        reason: "Rejected from Expo client",
      }),
    );

  const handleRecall = (requestId) =>
    ensureUser() && run(() => recall({ userId, requestId }));

  const handleResubmit = (requestId) =>
    ensureUser() && run(() => resubmit({ userId, requestId }));

  const handlePay = (requestId, lineItemId) =>
    ensureUser() && run(() => payLineItem({ userId, requestId, lineItemId }));

  const requestPermissions = selectedRequest
    ? {
        canApprove: canApproveRequest(selectedRequest, userId, isAdmin, roleMap),
        canPay: canPayRequest(selectedRequest, isAdmin, roleMap),
        canRecall: canRecallRequest(selectedRequest, userId, isAdmin),
        canResubmit: canResubmitRequest(selectedRequest, userId, isAdmin),
      }
    : {
        canApprove: false,
        canPay: false,
        canRecall: false,
        canResubmit: false,
      };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <RNStatusBar barStyle="light-content" />

      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <RequestCard
            item={item}
            onPress={setSelectedRequestId}
            actionable={actionableIds.has(item._id)}
          />
        )}
        contentContainerStyle={styles.pageContent}
        ListHeaderComponent={
          <>
            <View style={styles.heroCard}>
              <View style={styles.heroOrbOne} />
              <View style={styles.heroOrbTwo} />
              <Text style={styles.heroEyebrow}>Payrail v2</Text>
              <Text style={styles.heroTitle}>Web + mobile approval testing client</Text>
              <Text style={styles.heroCopy}>
                Live Convex data, dynamic workflow routes, and quote rules that follow the
                current settings.
              </Text>
              <View style={styles.heroActions}>
                <Pressable
                  onPress={() => setShowComposer(true)}
                  style={[styles.heroButton, styles.heroButtonPrimary]}
                  disabled={!userId}
                >
                  <Text style={styles.heroButtonPrimaryText}>New request</Text>
                </Pressable>
                <View style={styles.heroStatBubble}>
                  <Text style={styles.heroStatNumber}>{stats?.actionable ?? "…"}</Text>
                  <Text style={styles.heroStatLabel}>actionable</Text>
                </View>
              </View>
            </View>

            <SectionCard
              title="Switch Persona"
              subtitle="Demo role switcher for user testing"
            >
              <PersonaBar activeEmail={activeEmail} onChange={onPersonaChange} />
              {user ? (
                <Text style={styles.personaMeta}>
                  {user.name} •{" "}
                  {user.assignments.map((assignment) => `${assignment.role} (${assignment.companyTag})`).join(", ")}
                </Text>
              ) : null}
            </SectionCard>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Visible requests</Text>
                <Text style={styles.statValue}>{stats?.requestCount ?? "…"}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Disbursed</Text>
                <Text style={styles.statValue}>{formatMoney(stats?.disbursed ?? 0)}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Pending</Text>
                <Text style={styles.statValue}>{formatMoney(stats?.pending ?? 0)}</Text>
              </View>
            </View>

            <SectionCard
              title="Pipeline"
              subtitle="Filter the request list by stored top-level status"
              right={loading ? <ActivityIndicator color="#82cfff" /> : null}
            >
              <FilterBar activeFilter={statusFilter} onChange={setStatusFilter} stats={stats} />
            </SectionCard>

            <View style={styles.listHeading}>
              <Text style={styles.listHeadingText}>
                {statusFilter ? STATUS_LABELS[statusFilter] : "All requests"}
              </Text>
              <Text style={styles.listHeadingMeta}>{filteredRequests.length} shown</Text>
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorLine}>• {errorMessage}</Text>
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No requests in this slice</Text>
              <Text style={styles.emptyStateCopy}>
                Try another persona, switch filters, or create a new request.
              </Text>
            </View>
          ) : (
            <View style={styles.loadingEmpty}>
              <ActivityIndicator color="#82cfff" />
            </View>
          )
        }
      />

      <RequestModal
        request={selectedRequest}
        onClose={() => setSelectedRequestId(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onRecall={handleRecall}
        onResubmit={handleResubmit}
        onPay={handlePay}
        permissions={requestPermissions}
        busy={busy}
      />

      <NewRequestModal
        visible={showComposer}
        onClose={() => setShowComposer(false)}
        user={user}
        userId={userId}
        companies={companies ?? []}
        onSubmitted={() => {
          setShowComposer(false);
          setStatusFilter(null);
          setErrorMessage("");
        }}
      />
    </SafeAreaView>
  );
}

export default function App() {
  if (!convex) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.missingEnv}>
          Missing EXPO_PUBLIC_CONVEX_URL in expo-app/.env.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <ConvexProvider client={convex}>
      <HomeScreen />
    </ConvexProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#07111f",
  },
  pageContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: "#0f1b31",
    borderRadius: 28,
    padding: 20,
    marginBottom: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1b2c4d",
  },
  heroOrbOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#164e63",
    opacity: 0.25,
    top: -40,
    right: -20,
  },
  heroOrbTwo: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#1d4ed8",
    opacity: 0.18,
    bottom: -30,
    left: -20,
  },
  heroEyebrow: {
    color: "#7dd3fc",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  heroTitle: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 32,
    maxWidth: 280,
  },
  heroCopy: {
    color: "#bfd2ea",
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 300,
  },
  heroActions: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  heroButton: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  heroButtonPrimary: {
    backgroundColor: "#f59e0b",
  },
  heroButtonPrimaryText: {
    color: "#101623",
    fontWeight: "800",
    fontSize: 14,
  },
  heroStatBubble: {
    backgroundColor: "rgba(10, 20, 37, 0.7)",
    borderWidth: 1,
    borderColor: "#28446f",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  heroStatNumber: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "800",
  },
  heroStatLabel: {
    color: "#8fb0cf",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionCard: {
    backgroundColor: "#0c1729",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#182842",
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
    gap: 12,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    color: "#f8fafc",
    fontWeight: "800",
    fontSize: 17,
  },
  sectionSubtitle: {
    color: "#8ea6c2",
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  personaBar: {
    gap: 8,
  },
  personaPill: {
    minWidth: 136,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#101f37",
    borderWidth: 1,
    borderColor: "#223456",
  },
  personaPillActive: {
    backgroundColor: "#123d6e",
    borderColor: "#4d9fff",
  },
  personaName: {
    color: "#e5eef8",
    fontWeight: "700",
    fontSize: 14,
  },
  personaNameActive: {
    color: "#ffffff",
  },
  personaRole: {
    color: "#8ea6c2",
    fontSize: 12,
    marginTop: 4,
  },
  personaRoleActive: {
    color: "#d7ebff",
  },
  personaMeta: {
    color: "#8ea6c2",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#0c1729",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#182842",
  },
  statLabel: {
    color: "#8ea6c2",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  statValue: {
    color: "#f8fafc",
    marginTop: 8,
    fontSize: 18,
    fontWeight: "800",
  },
  filterBar: {
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#101f37",
    borderWidth: 1,
    borderColor: "#203252",
  },
  filterChipActive: {
    backgroundColor: "#1d4ed8",
    borderColor: "#5aa6ff",
  },
  filterChipText: {
    color: "#d1dff1",
    fontWeight: "700",
    fontSize: 13,
  },
  filterChipTextActive: {
    color: "#ffffff",
  },
  filterCount: {
    backgroundColor: "#152743",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  filterCountActive: {
    backgroundColor: "rgba(7, 17, 31, 0.28)",
  },
  filterCountText: {
    color: "#8ea6c2",
    fontSize: 11,
    fontWeight: "800",
  },
  filterCountTextActive: {
    color: "#ffffff",
  },
  listHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  listHeadingText: {
    color: "#f8fafc",
    fontWeight: "800",
    fontSize: 17,
  },
  listHeadingMeta: {
    color: "#8ea6c2",
    fontSize: 12,
  },
  requestCard: {
    backgroundColor: "#0c1729",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#182842",
    marginBottom: 12,
  },
  requestCardActionable: {
    borderColor: "#4d9fff",
    backgroundColor: "#0e1d34",
  },
  requestTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  requestTitleStack: {
    flex: 1,
  },
  requestId: {
    color: "#f8fafc",
    fontWeight: "800",
    fontSize: 16,
  },
  requestCompany: {
    color: "#86a3c7",
    marginTop: 2,
    fontSize: 12,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPillText: {
    color: "#f8fafc",
    fontWeight: "800",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  status_in_approval: {
    backgroundColor: "#1d4ed8",
  },
  status_awaiting_finance: {
    backgroundColor: "#f59e0b",
  },
  status_partially_paid: {
    backgroundColor: "#f59e0b",
  },
  status_paid: {
    backgroundColor: "#16a34a",
  },
  status_rejected: {
    backgroundColor: "#dc2626",
  },
  status_recalled: {
    backgroundColor: "#ea580c",
  },
  status_draft: {
    backgroundColor: "#475569",
  },
  requestDescription: {
    color: "#dbe8f6",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  requestMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
    marginTop: 14,
  },
  requestMeta: {
    color: "#86a3c7",
    fontSize: 12,
  },
  requestMetaDot: {
    color: "#3f5474",
  },
  requestFooterRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  requestFooterText: {
    color: "#c4d7ec",
    fontSize: 12,
    flex: 1,
  },
  requestActionLabel: {
    color: "#7dd3fc",
    fontSize: 12,
    fontWeight: "800",
  },
  modalSafe: {
    flex: 1,
    backgroundColor: "#07111f",
  },
  modalContent: {
    padding: 16,
    paddingBottom: 40,
  },
  modalTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  modalEyebrow: {
    color: "#7dd3fc",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontSize: 11,
    fontWeight: "800",
  },
  modalTitle: {
    color: "#f8fafc",
    fontSize: 26,
    fontWeight: "800",
    marginTop: 4,
  },
  modalClose: {
    borderWidth: 1,
    borderColor: "#28446f",
    backgroundColor: "#102039",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalCloseText: {
    color: "#e9f2fb",
    fontWeight: "700",
  },
  modalDescription: {
    color: "#bfd2ea",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 7,
  },
  detailLabel: {
    color: "#86a3c7",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    maxWidth: "38%",
  },
  detailValue: {
    color: "#edf5ff",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
  },
  flowStep: {
    borderTopWidth: 1,
    borderTopColor: "#162741",
    paddingTop: 10,
    marginTop: 10,
  },
  flowStepHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  flowStepTitle: {
    color: "#edf5ff",
    fontWeight: "700",
    fontSize: 14,
    flex: 1,
  },
  flowStepState: {
    color: "#8ea6c2",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  flowStepStateCurrent: {
    color: "#7dd3fc",
  },
  flowStepMeta: {
    color: "#86a3c7",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  financeHint: {
    color: "#fbbf24",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
  },
  payeeCard: {
    borderTopWidth: 1,
    borderTopColor: "#162741",
    paddingTop: 10,
    marginTop: 10,
  },
  payeeCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  payeeCardText: {
    flex: 1,
  },
  payeeName: {
    color: "#edf5ff",
    fontWeight: "700",
    fontSize: 14,
  },
  payeeMeta: {
    color: "#86a3c7",
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  payeeAmount: {
    color: "#edf5ff",
    fontWeight: "800",
    fontSize: 14,
    textAlign: "right",
  },
  payeePaid: {
    color: "#4ade80",
    fontSize: 12,
    marginTop: 4,
  },
  payeePending: {
    color: "#fbbf24",
    fontSize: 12,
    marginTop: 4,
  },
  timelineItem: {
    borderTopWidth: 1,
    borderTopColor: "#162741",
    paddingTop: 10,
    marginTop: 10,
  },
  timelineAction: {
    color: "#edf5ff",
    fontWeight: "700",
    fontSize: 14,
  },
  timelineMeta: {
    color: "#86a3c7",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  dualActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  primaryAction: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  primaryActionText: {
    fontWeight: "800",
    fontSize: 14,
    color: "#08101b",
  },
  actionPrimary: {
    backgroundColor: "#7dd3fc",
  },
  actionDanger: {
    backgroundColor: "#f87171",
  },
  actionWarning: {
    backgroundColor: "#fbbf24",
  },
  actionSuccess: {
    backgroundColor: "#22c55e",
  },
  actionMuted: {
    backgroundColor: "#14253f",
    borderWidth: 1,
    borderColor: "#2c466e",
  },
  inlineAction: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  inlineActionText: {
    color: "#08101b",
    fontWeight: "800",
    fontSize: 13,
  },
  inlineActionTextLight: {
    color: "#08101b",
  },
  fieldWrap: {
    marginBottom: 12,
  },
  fieldLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    gap: 10,
  },
  fieldLabel: {
    color: "#d7e7f8",
    fontWeight: "700",
    fontSize: 13,
  },
  fieldHint: {
    color: "#86a3c7",
    fontSize: 11,
  },
  input: {
    borderRadius: 14,
    backgroundColor: "#101f37",
    borderWidth: 1,
    borderColor: "#233658",
    color: "#f8fafc",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  choiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  choiceChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#233658",
    backgroundColor: "#101f37",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  choiceChipActive: {
    backgroundColor: "#1d4ed8",
    borderColor: "#5aa6ff",
  },
  choiceChipText: {
    color: "#d7e7f8",
    fontWeight: "700",
    fontSize: 13,
  },
  choiceChipTextActive: {
    color: "#ffffff",
  },
  editorCard: {
    backgroundColor: "#101b2d",
    borderWidth: 1,
    borderColor: "#1e2f4d",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  editorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  editorHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  editorTitle: {
    color: "#f8fafc",
    fontWeight: "800",
    fontSize: 15,
  },
  lowestTag: {
    color: "#4ade80",
    fontWeight: "800",
    fontSize: 12,
  },
  removeText: {
    color: "#fca5a5",
    fontWeight: "700",
    fontSize: 12,
  },
  totalStrip: {
    marginTop: 6,
    borderRadius: 16,
    backgroundColor: "#0d2444",
    borderWidth: 1,
    borderColor: "#21456d",
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalStripLabel: {
    color: "#9cc3eb",
    fontSize: 13,
    fontWeight: "700",
  },
  totalStripValue: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "800",
  },
  policyBox: {
    backgroundColor: "#0d2444",
    borderWidth: 1,
    borderColor: "#21456d",
    borderRadius: 18,
    padding: 14,
  },
  policyName: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "800",
  },
  policyCopy: {
    color: "#9cc3eb",
    fontSize: 12,
    marginTop: 4,
  },
  routeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  routeStepWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  routeStep: {
    backgroundColor: "#102b4f",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  routeStepText: {
    color: "#edf5ff",
    fontSize: 12,
    fontWeight: "700",
  },
  routeArrow: {
    color: "#7dd3fc",
    fontWeight: "800",
  },
  policyRule: {
    color: "#d8e8fa",
    marginTop: 12,
    fontSize: 13,
    lineHeight: 19,
  },
  policySubRule: {
    color: "#fbbf24",
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
  },
  toggleCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    backgroundColor: "#101b2d",
    borderWidth: 1,
    borderColor: "#1e2f4d",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  toggleCardActive: {
    borderColor: "#7dd3fc",
    backgroundColor: "#102b4f",
  },
  toggleTitle: {
    color: "#f8fafc",
    fontWeight: "800",
    fontSize: 14,
  },
  toggleCopy: {
    color: "#8ea6c2",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    maxWidth: 230,
  },
  toggleState: {
    color: "#7dd3fc",
    fontWeight: "800",
    fontSize: 13,
  },
  linkButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#102039",
    borderWidth: 1,
    borderColor: "#28446f",
  },
  linkButtonText: {
    color: "#b7dbff",
    fontWeight: "700",
    fontSize: 12,
  },
  loadingInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: "#8ea6c2",
    fontSize: 13,
  },
  emptyHint: {
    color: "#8ea6c2",
    fontSize: 13,
    lineHeight: 19,
  },
  errorBox: {
    backgroundColor: "#30111a",
    borderWidth: 1,
    borderColor: "#6d2237",
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  errorLine: {
    color: "#fecdd3",
    fontSize: 13,
    lineHeight: 19,
  },
  submitButton: {
    backgroundColor: "#f59e0b",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#101623",
    fontWeight: "800",
    fontSize: 15,
  },
  emptyState: {
    borderRadius: 22,
    backgroundColor: "#0c1729",
    borderWidth: 1,
    borderColor: "#182842",
    padding: 18,
    alignItems: "center",
  },
  emptyStateTitle: {
    color: "#f8fafc",
    fontWeight: "800",
    fontSize: 16,
  },
  emptyStateCopy: {
    color: "#8ea6c2",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 6,
  },
  loadingEmpty: {
    paddingVertical: 32,
    alignItems: "center",
  },
  missingEnv: {
    color: "#fecdd3",
    textAlign: "center",
    paddingHorizontal: 24,
    marginTop: 40,
    fontSize: 15,
  },
});
