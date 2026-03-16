import React, { useState, useMemo } from 'react';
import { useMutation } from 'convex/react';
import { useWorkflow } from '../context/useWorkflow';
import {
  BANKS, getMatchedPolicy, getCategoriesForCompany,
  formatNaira, getLowestQuoteIndex,
} from '../data/mockData';
import { api } from '../../convex/_generated/api';
import { X, Plus, Trash2, FileText, ShoppingCart, AlertTriangle, Info, CheckCircle, Award, Star, ArrowRight, Building2, Tag, AlignLeft, ChevronDown, Pencil } from 'lucide-react';

const emptyAccount = () => ({ accountNumber: '', amount: '' });
const emptyPayee = () => ({ name: '', bank: '', accounts: [emptyAccount()] });
const emptyQuote = () => ({ vendor: '', amount: '', quoteRef: '', validityDate: '', notes: '' });

const RequestForm = ({ onClose, backendUserId = null }) => {
  const { state, actions } = useWorkflow();
  const submitRequestMutation = useMutation(api.requests.submitRequest);
  const userCompanies = state.currentUser.role === 'Admin'
    ? state.companies.filter(c => c.active !== false)
    : state.companies.filter(c => c.active !== false && state.currentUser.companies.includes(c.id));

  const [companyId, setCompanyId] = useState(userCompanies[0]?.id || '');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [payees, setPayees] = useState([emptyPayee()]);
  const [quotes, setQuotes] = useState([]);
  const [selectedVendorIndex, setSelectedVendorIndex] = useState(-1);
  const [quoteJustification, setQuoteJustification] = useState('');
  const [singleSourceException, setSingleSourceException] = useState(false);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const categories = useMemo(
    () => getCategoriesForCompany(companyId, state.policies, state.companies),
    [companyId, state.policies, state.companies]
  );

  // Flatten all accounts across all payees for total
  const totalAmount = payees.reduce((s, p) => s + p.accounts.reduce((a, acc) => a + (Number(acc.amount) || 0), 0), 0);

  // Per-payee total helper
  const getPayeeTotal = (payee) => payee.accounts.reduce((s, acc) => s + (Number(acc.amount) || 0), 0);

  const matchedPolicy = useMemo(
    () => (companyId && category && totalAmount > 0) ? getMatchedPolicy(companyId, category, totalAmount, state.policies) : null,
    [companyId, category, totalAmount, state.policies]
  );

  const requiredQuotes = matchedPolicy?.requiredQuotes || 0;
  const lowestIdx = getLowestQuoteIndex(quotes);
  const selectedIsNotLowest = selectedVendorIndex >= 0 && lowestIdx >= 0 && selectedVendorIndex !== lowestIdx;
  const needsJustification = selectedIsNotLowest && matchedPolicy?.requireJustificationIfNotLowest;

  const handleCompanyChange = (cid) => { setCompanyId(cid); setCategory(''); setQuotes([]); setSelectedVendorIndex(-1); };

  // Payee-level operations
  const updatePayeeField = (i, field, value) => setPayees(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  const addPayee = () => setPayees(prev => [...prev, emptyPayee()]);
  const removePayee = (i) => setPayees(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev);

  // Account-level operations (within a payee)
  const addAccount = (payeeIdx) => setPayees(prev => prev.map((p, idx) => idx === payeeIdx ? { ...p, accounts: [...p.accounts, emptyAccount()] } : p));
  const removeAccount = (payeeIdx, accIdx) => setPayees(prev => prev.map((p, idx) => {
    if (idx !== payeeIdx) return p;
    return { ...p, accounts: p.accounts.length > 1 ? p.accounts.filter((_, ai) => ai !== accIdx) : p.accounts };
  }));
  const updateAccount = (payeeIdx, accIdx, field, value) => setPayees(prev => prev.map((p, idx) => {
    if (idx !== payeeIdx) return p;
    return { ...p, accounts: p.accounts.map((acc, ai) => ai === accIdx ? { ...acc, [field]: value } : acc) };
  }));

  const updateQuote = (i, f, v) => setQuotes(prev => prev.map((q, idx) => idx === i ? { ...q, [f]: v } : q));
  const addQuote = () => setQuotes(prev => [...prev, emptyQuote()]);
  const removeQuote = (i) => {
    setQuotes(prev => prev.filter((_, idx) => idx !== i));
    if (selectedVendorIndex === i) setSelectedVendorIndex(-1);
    else if (selectedVendorIndex > i) setSelectedVendorIndex(selectedVendorIndex - 1);
  };

  // Flatten payees with multiple accounts into individual line items for submission
  const flattenPayees = () => {
    const flat = [];
    payees.forEach(p => {
      p.accounts.forEach(acc => {
        flat.push({ name: p.name, bank: p.bank, accountNumber: acc.accountNumber, amount: acc.amount });
      });
    });
    return flat;
  };

  const validate = () => {
    const errs = [];
    if (!companyId) errs.push('Select a company');
    if (!category) errs.push('Select a category');
    if (!description.trim()) errs.push('Enter a description');
    if (totalAmount <= 0) errs.push('Add at least one payee with a valid amount');
    payees.forEach((p, i) => {
      if (!p.name.trim()) errs.push(`Payee ${i + 1}: name required`);
      if (!p.bank) errs.push(`Payee ${i + 1}: bank required`);
      p.accounts.forEach((acc, j) => {
        const label = p.accounts.length > 1 ? `Payee ${i + 1}, Account ${j + 1}` : `Payee ${i + 1}`;
        if (!acc.accountNumber.trim()) errs.push(`${label}: account number required`);
        if (!acc.amount || Number(acc.amount) <= 0) errs.push(`${label}: valid amount required`);
      });
    });
    if (!matchedPolicy) errs.push('No matching policy found for this company/category/amount');
    if (requiredQuotes > 0 && !singleSourceException) {
      if (quotes.length < requiredQuotes) errs.push(`${requiredQuotes} quotes required, only ${quotes.length} provided`);
      const vendors = quotes.map(q => q.vendor.trim().toLowerCase()).filter(Boolean);
      if (new Set(vendors).size < vendors.length) errs.push('All quotes must be from different vendors');
      quotes.forEach((q, i) => {
        if (!q.vendor.trim()) errs.push(`Quote ${i + 1}: vendor name required`);
        if (!q.amount || Number(q.amount) <= 0) errs.push(`Quote ${i + 1}: valid amount required`);
      });
      if (selectedVendorIndex < 0 && quotes.length > 0) errs.push('Select a recommended vendor');
      if (needsJustification && !quoteJustification.trim()) errs.push('Justification required — selected vendor is not the lowest quote');
    }
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;
    if (!backendUserId) {
      actions.showToast('Cannot submit — backend user not resolved', 'danger');
      return;
    }
    const payload = {
      companyId,
      category,
      description,
      payees: flattenPayees().map(p => ({
        payeeName: p.name,
        bankName: p.bank,
        accountNumber: p.accountNumber,
        amount: Number(p.amount),
      })),
      quotes: quotes.map(q => ({
        vendorName: q.vendor,
        quotedAmount: Number(q.amount),
        quoteReference: q.quoteRef || '',
        validityDate: q.validityDate || '',
        notes: q.notes || '',
      })),
      selectedQuoteIndex: selectedVendorIndex >= 0 ? selectedVendorIndex : undefined,
      quoteJustification: quoteJustification || undefined,
      singleSourceExceptionEnabled: singleSourceException,
      singleSourceExceptionReason: singleSourceException ? 'Single source selected' : undefined,
    };

    try {
      setSubmitting(true);
      await submitRequestMutation({ userId: backendUserId, ...payload });
      actions.showToast('Request submitted to backend', 'success');
      onClose();
    } catch (err) {
      console.error(err);
      actions.showToast('Failed to submit request', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fade-in flex items-end sm:items-start sm:justify-center sm:p-6 sm:overflow-y-auto" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full sm:max-w-[780px] bg-surface border-t sm:border border-border sm:rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] sm:my-4 animate-slide-up flex flex-col max-h-[95dvh] sm:max-h-[90dvh] rounded-t-2xl sm:rounded-2xl overflow-hidden">

        {/* Header — always visible */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-background/50 flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-black font-bold text-xs" style={{ background: 'linear-gradient(135deg, #63e6be 0%, #38d9a9 100%)' }}>
              <FileText size={15} />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-bold text-textPrimary">New Payment Request</h2>
              <p className="text-[10px] text-textSecondary hidden sm:block">Fill in details below to submit for approval</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-colors">
            <X size={14} className="text-textSecondary" />
          </button>
        </div>

        {/* Body — scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 overflow-y-auto flex-1">

            {/* ── Section 1: Request Details ── */}
            <FormSection number="1" title="Request Details" icon={<AlignLeft size={13} />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <FormField label="Company" icon={<Building2 size={11} />}>
                  <select className="input-field" value={companyId} onChange={e => handleCompanyChange(e.target.value)}>
                    {userCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </FormField>
                <FormField label="Category" icon={<Tag size={11} />}>
                  <select className="input-field" value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="">Select category...</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FormField>
              </div>

              <FormField label="Description">
                <textarea className="input-field min-h-[72px] resize-y" placeholder="Purpose of this payment request..." value={description} onChange={e => setDescription(e.target.value)} />
              </FormField>

              {/* Policy Match */}
              {matchedPolicy && (
                <div className="flex items-start gap-3 p-3 sm:p-3.5 rounded-xl bg-accentBlue/[0.06] border border-accentBlue/15">
                  <div className="w-7 h-7 rounded-lg bg-accentBlue/[0.12] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Info size={13} className="text-accentBlue" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-textPrimary">{matchedPolicy.name}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {[...matchedPolicy.steps, ...(matchedPolicy.requiresFinance ? ['Finance'] : [])].map((step, idx, arr) => (
                        <span key={idx} className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-textSecondary">
                          <span className="px-1.5 py-0.5 rounded bg-white/[0.05] font-medium text-textPrimary/80">{step}</span>
                          {idx < arr.length - 1 && <ArrowRight size={9} className="text-textSecondary/40" />}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </FormSection>

            {/* ── Section 2: Payees / Line Items ── */}
              <FormSection number="2" title="Payees / Line Items" icon={<ShoppingCart size={13} />}
              action={<button type="button" onClick={addPayee} className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-accentTeal hover:text-accentTeal/80 transition-colors"><Plus size={12} /> Add payee</button>}
            >
              <div className="space-y-3">
                {payees.map((p, i) => {
                  const payeeTotal = getPayeeTotal(p);
                  return (
                    <div key={i} className="rounded-xl border border-border bg-background/50 overflow-hidden">
                      {/* Payee header */}
                      <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-white/[0.02] border-b border-border">
                        <span className="text-[10px] sm:text-[11px] font-semibold text-textSecondary uppercase tracking-wider">Payee {i + 1}</span>
                        {payees.length > 1 && (
                          <button type="button" onClick={() => removePayee(i)} className="flex items-center gap-1 text-[10px] text-accentRose/60 hover:text-accentRose transition-colors">
                            <Trash2 size={11} /> Remove
                          </button>
                        )}
                      </div>

                      <div className="p-3 sm:p-4 space-y-3">
                        {/* Payee identity — name & bank */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <FormField label="Payee Name" compact>
                            <input className="input-field" placeholder="e.g. NNPC Retail" value={p.name} onChange={e => updatePayeeField(i, 'name', e.target.value)} />
                          </FormField>
                          <FormField label="Bank" compact>
                            <BankInput value={p.bank} onChange={(val) => updatePayeeField(i, 'bank', val)} />
                          </FormField>
                        </div>

                        {/* Account entries */}
                        <div className="space-y-2">
                          {p.accounts.map((acc, j) => (
                            <div key={j} className="flex items-end gap-2">
                              <div className="flex-1 grid grid-cols-2 gap-2">
                                <FormField label={j === 0 ? 'Account Number' : ''} compact>
                                  <input className="input-field" placeholder="0123456789" value={acc.accountNumber} onChange={e => updateAccount(i, j, 'accountNumber', e.target.value)} />
                                </FormField>
                                <FormField label={j === 0 ? 'Amount (₦)' : ''} compact>
                                  <input className="input-field" type="number" placeholder="0.00" value={acc.amount} onChange={e => updateAccount(i, j, 'amount', e.target.value)} />
                                </FormField>
                              </div>
                              {p.accounts.length > 1 && (
                                <button type="button" onClick={() => removeAccount(i, j)} className="p-2 rounded-lg text-textSecondary/30 hover:text-accentRose hover:bg-accentRose/[0.06] transition-all mb-[1px]">
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          ))}
                          <button type="button" onClick={() => addAccount(i)} className="flex items-center gap-1 text-[10px] font-semibold text-textSecondary hover:text-accentTeal transition-colors mt-1">
                            <Plus size={11} /> Add account
                          </button>
                        </div>
                      </div>

                      {/* Per-payee total */}
                      {payeeTotal > 0 && (
                        <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-white/[0.02] border-t border-border">
                          <span className="text-[10px] font-semibold text-textSecondary uppercase tracking-wider">Payee Total</span>
                          <span className="text-xs sm:text-sm font-bold text-textPrimary tabular-nums">{formatNaira(payeeTotal)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Grand Total */}
              {totalAmount > 0 && (
                <div className="flex items-center justify-between mt-3 px-3.5 py-2.5 rounded-xl bg-accentTeal/[0.06] border border-accentTeal/15">
                  <span className="text-[11px] font-semibold text-textSecondary uppercase tracking-wider">Grand Total</span>
                  <span className="text-sm sm:text-base font-bold text-accentTeal tabular-nums">{formatNaira(totalAmount)}</span>
                </div>
              )}
            </FormSection>

            {/* ── Section 3: Vendor Quotations ── */}
            {requiredQuotes > 0 && (
              <FormSection number="3" title="Vendor Quotations" icon={<Award size={13} />}
                action={!singleSourceException && <button type="button" onClick={addQuote} className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-accentTeal hover:text-accentTeal/80 transition-colors"><Plus size={12} /> Add quote</button>}
              >
                {matchedPolicy?.quoteRuleLabel && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-accentAmber/[0.06] border border-accentAmber/15">
                    <AlertTriangle size={13} className="text-accentAmber flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-accentAmber/80 leading-relaxed">{matchedPolicy.quoteRuleLabel}</p>
                  </div>
                )}

                {matchedPolicy?.allowSingleSourceException && (
                  <label className="flex items-center gap-2.5 text-xs text-textSecondary cursor-pointer group">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${singleSourceException ? 'bg-accentTeal border-accentTeal' : 'border-border bg-background hover:border-textSecondary/30'}`}>
                      {singleSourceException && <CheckCircle size={10} className="text-black" />}
                    </div>
                    <input type="checkbox" checked={singleSourceException} onChange={e => setSingleSourceException(e.target.checked)} className="sr-only" />
                    <span className="group-hover:text-textPrimary transition-colors">Single-source exception — skip quote requirement</span>
                  </label>
                )}

                {!singleSourceException && (
                  <>
                    <div className="space-y-3">
                      {quotes.map((q, i) => {
                        const isLowest = i === lowestIdx && quotes.length > 1 && Number(q.amount) > 0;
                        const isSelected = i === selectedVendorIndex;
                        return (
                          <div key={i} className={`rounded-xl border overflow-hidden transition-all ${isSelected ? 'border-accentBlue/40 shadow-[0_0_0_1px_rgba(10,132,255,0.1)]' : 'border-border'}`}>
                            {/* Quote header */}
                            <div className={`flex items-center justify-between px-3 sm:px-4 py-2 border-b ${isSelected ? 'bg-accentBlue/[0.04] border-accentBlue/20' : 'bg-white/[0.02] border-border'}`}>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] sm:text-[11px] font-semibold text-textSecondary uppercase tracking-wider">Quote {i + 1}</span>
                                {isLowest && <span className="badge bg-accentEmerald/[0.12] text-accentEmerald border-transparent text-[9px]"><Award size={8} className="mr-0.5" /> Lowest</span>}
                                {isSelected && <span className="badge bg-accentBlue/[0.12] text-accentBlue border-transparent text-[9px]"><Star size={8} className="mr-0.5" /> Selected</span>}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button type="button" onClick={() => setSelectedVendorIndex(i)} className={`text-[10px] sm:text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all ${isSelected ? 'bg-accentBlue text-white' : 'text-textSecondary hover:text-textPrimary hover:bg-white/[0.06]'}`}>
                                  {isSelected ? 'Selected' : 'Select'}
                                </button>
                                <button type="button" onClick={() => removeQuote(i)} className="p-1 rounded-lg text-textSecondary/40 hover:text-accentRose hover:bg-accentRose/[0.06] transition-all">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                            <div className="p-3 sm:p-4 bg-background/50">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <FormField label="Vendor Name" compact><input className="input-field" placeholder="e.g. TotalEnergies" value={q.vendor} onChange={e => updateQuote(i, 'vendor', e.target.value)} /></FormField>
                                <FormField label="Quoted Amount (₦)" compact><input className="input-field" type="number" placeholder="0.00" value={q.amount} onChange={e => updateQuote(i, 'amount', e.target.value)} /></FormField>
                                <FormField label="Quote Reference" compact><input className="input-field" placeholder="QR-2026-001" value={q.quoteRef} onChange={e => updateQuote(i, 'quoteRef', e.target.value)} /></FormField>
                                <FormField label="Validity Date" compact><input className="input-field" type="date" value={q.validityDate} onChange={e => updateQuote(i, 'validityDate', e.target.value)} /></FormField>
                              </div>
                              <div className="mt-3">
                                <FormField label="Notes" compact><input className="input-field" placeholder="Additional details..." value={q.notes} onChange={e => updateQuote(i, 'notes', e.target.value)} /></FormField>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {quotes.length === 0 && (
                      <div className="text-center py-8 rounded-xl border border-dashed border-border">
                        <Award size={20} className="text-textSecondary/30 mx-auto mb-2" />
                        <p className="text-xs text-textSecondary">No quotes added yet</p>
                        <button type="button" onClick={addQuote} className="mt-2 text-[11px] font-semibold text-accentTeal hover:text-accentTeal/80 transition-colors">
                          <Plus size={11} className="inline mr-0.5" /> Add your first quote
                        </button>
                      </div>
                    )}
                    {needsJustification && (
                      <div className="p-3 sm:p-3.5 rounded-xl bg-accentAmber/[0.04] border border-accentAmber/15">
                        <FormField label={<span className="text-accentAmber"><AlertTriangle size={10} className="inline mr-1 -mt-0.5" />Justification Required</span>} compact>
                          <textarea className="input-field min-h-[60px] resize-y !border-accentAmber/20 focus:!border-accentAmber/40" placeholder="Explain why the selected vendor was chosen over the lowest quote..." value={quoteJustification} onChange={e => setQuoteJustification(e.target.value)} />
                        </FormField>
                      </div>
                    )}
                  </>
                )}
              </FormSection>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <div className="p-3.5 rounded-xl bg-accentRose/[0.06] border border-accentRose/15 space-y-1.5">
                <p className="text-[10px] font-bold text-accentRose uppercase tracking-wider mb-1">Please fix the following</p>
                {errors.map((err, i) => (
                  <p key={i} className="text-[11px] text-accentRose/80 flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-accentRose mt-1.5 flex-shrink-0" />
                    {err}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Footer — always visible */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t border-border bg-background/50 flex-shrink-0">
            <button type="button" onClick={onClose} className="btn btn-secondary text-xs sm:text-sm">Cancel</button>
            <button type="submit" className="btn btn-teal text-xs sm:text-sm" disabled={submitting}>
              <CheckCircle size={14} /> {submitting ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Bank Input — select from list or type custom ── */
const BankInput = ({ value, onChange }) => {
  const [isCustom, setIsCustom] = useState(false);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = React.useRef(null);

  // If current value isn't in BANKS list, it's custom
  const isCurrentCustom = value && !BANKS.includes(value);

  const filteredBanks = search
    ? BANKS.filter(b => b.toLowerCase().includes(search.toLowerCase()))
    : BANKS;

  const handleSelectBank = (bank) => {
    onChange(bank);
    setSearch('');
    setShowDropdown(false);
    setIsCustom(false);
  };

  const handleCustomToggle = () => {
    setIsCustom(true);
    setShowDropdown(false);
    setSearch('');
    // Clear value so user starts fresh in custom mode
    if (!isCurrentCustom) onChange('');
  };

  const handleBackToSelect = () => {
    setIsCustom(false);
    setSearch('');
    onChange('');
  };

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (isCustom || isCurrentCustom) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <input
            className="input-field !pr-8"
            placeholder="Type bank name..."
            value={value}
            onChange={e => onChange(e.target.value)}
            autoFocus
          />
          <Pencil size={10} className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary/40 pointer-events-none" />
        </div>
        <button
          type="button"
          onClick={handleBackToSelect}
          className="flex-shrink-0 p-2 rounded-lg text-textSecondary/40 hover:text-textSecondary hover:bg-white/[0.04] transition-all"
          title="Back to bank list"
        >
          <ChevronDown size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className="input-field w-full flex items-center justify-between text-left"
      >
        <span className={value ? 'text-textPrimary' : 'text-textSecondary/50'}>{value || 'Select bank...'}</span>
        <ChevronDown size={12} className={`text-textSecondary/40 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full rounded-xl bg-surface border border-border shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden animate-fade-in">
          {/* Search */}
          <div className="p-2 border-b border-border">
            <input
              className="input-field !text-xs !py-1.5"
              placeholder="Search banks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {/* Bank list */}
          <div className="max-h-[180px] overflow-y-auto">
            {filteredBanks.map(b => (
              <button
                key={b}
                type="button"
                onClick={() => handleSelectBank(b)}
                className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-white/[0.06] ${value === b ? 'text-accentTeal font-semibold bg-accentTeal/[0.04]' : 'text-textPrimary'}`}
              >
                {b}
              </button>
            ))}
            {filteredBanks.length === 0 && (
              <div className="px-3 py-4 text-center text-[11px] text-textSecondary">
                No banks match "{search}"
              </div>
            )}
          </div>

          {/* Manual entry option */}
          <button
            type="button"
            onClick={handleCustomToggle}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-[11px] font-semibold text-accentTeal hover:bg-accentTeal/[0.04] transition-colors border-t border-border"
          >
            <Pencil size={10} /> Enter bank manually
          </button>
        </div>
      )}
    </div>
  );
};

/* ── Reusable Section wrapper ── */
const FormSection = ({ number, title, icon, action, children }) => (
  <div className="space-y-3 sm:space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-white/[0.06] flex items-center justify-center">
          <span className="text-[10px] sm:text-[11px] font-bold text-textSecondary">{number}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-textPrimary">
          <span className="text-textSecondary/50">{icon}</span>
          {title}
        </div>
      </div>
      {action}
    </div>
    <div className="space-y-3 sm:space-y-4 pl-0">
      {children}
    </div>
  </div>
);

/* ── Reusable Form Field wrapper ── */
const FormField = ({ label, icon, compact, children }) => (
  <div>
    {label && (
      <label className={`flex items-center gap-1 font-semibold text-textSecondary uppercase tracking-wider ${compact ? 'text-[10px] mb-1' : 'text-[11px] mb-1.5'}`}>
        {icon && <span className="text-textSecondary/50">{icon}</span>}
        {label}
      </label>
    )}
    {children}
  </div>
);

export default RequestForm;
