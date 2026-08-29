'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Building,
  Contact as ContactIcon,
  Calendar,
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  TrendingUp,
  Tag,
} from 'lucide-react';
import { Deal, LeadSource, Priority, PaymentType, PaymentStatus, Payment } from '@/types/crm';
import { useCrm } from '@/context/crm-context';
import { useAuth } from '@/context/auth-context';
import { formatCurrency } from '@/lib/utils';
import { RecordPaymentModal } from './record-payment-modal';

interface DealModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal?: Deal | null;
  defaultStageId?: string;
}

export function DealModal({ isOpen, onClose, deal, defaultStageId }: DealModalProps) {
  const { createDeal, updateDeal, pipeline, companies, contacts, payments, deletePayment } = useCrm();
  const { members } = useAuth();

  const stages = useMemo(() => pipeline?.stages || [], [pipeline?.stages]);

  // General deal info
  const [name, setName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [contactId, setContactId] = useState('');
  const [stageId, setStageId] = useState(defaultStageId || 's1');
  const [probability, setProbability] = useState<number>(25);
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [source, setSource] = useState<LeadSource>('WEBSITE');
  const [priority, setPriority] = useState<Priority>('HIGH');
  const [notes, setNotes] = useState('');

  // Payment Management Fields
  const [paymentType, setPaymentType] = useState<PaymentType>('ONE_TIME');
  // Raw string inputs for clean numeric handling without unwanted leading "0"
  const [rawTotalAmount, setRawTotalAmount] = useState<string>('');
  const [rawAmountPaid, setRawAmountPaid] = useState<string>('');
  const [rawMonthlyAmount, setRawMonthlyAmount] = useState<string>('');
  const [billingStartDate, setBillingStartDate] = useState<string>('');
  const [nextPaymentDate, setNextPaymentDate] = useState<string>('');
  const [customPaymentStatus, setCustomPaymentStatus] = useState<PaymentStatus | ''>('');

  // Payment recording sub-modal
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);

  useEffect(() => {
    if (deal && isOpen) {
      setName(deal.name || '');
      setCompanyId(deal.company_id || '');
      setContactId(deal.contact_id || '');
      setStageId(deal.stage_id || 's1');
      setProbability(deal.probability ?? 25);
      setExpectedCloseDate(deal.expected_close_date || '');
      setOwnerId(deal.owner_id || '');
      setSource(deal.source || 'WEBSITE');
      setPriority(deal.priority || 'MEDIUM');
      setNotes(deal.notes || '');

      setPaymentType(deal.payment_type || 'ONE_TIME');
      const totalVal = Number(deal.total_amount ?? deal.value ?? 0);
      setRawTotalAmount(totalVal > 0 ? totalVal.toString() : '');
      const paidVal = Number(deal.amount_paid ?? 0);
      setRawAmountPaid(paidVal > 0 ? paidVal.toString() : '');
      const monthVal = Number(deal.monthly_amount ?? 0);
      setRawMonthlyAmount(monthVal > 0 ? monthVal.toString() : '');
      setBillingStartDate(deal.billing_start_date || '');
      setNextPaymentDate(deal.next_payment_date || '');
      setCustomPaymentStatus(deal.payment_status || '');
    } else if (isOpen) {
      setName('');
      setCompanyId(companies[0]?.id || '');
      setContactId(contacts[0]?.id || '');
      setStageId(defaultStageId || stages[0]?.id || 's1');
      setProbability(25);
      setExpectedCloseDate(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
      setOwnerId(members[0]?.user_id || '');
      setSource('WEBSITE');
      setPriority('HIGH');
      setNotes('');

      setPaymentType('ONE_TIME');
      setRawTotalAmount('');
      setRawAmountPaid('');
      setRawMonthlyAmount('');
      setBillingStartDate(new Date().toISOString().split('T')[0]);
      setNextPaymentDate('');
      setCustomPaymentStatus('');
    }
  }, [deal, isOpen, defaultStageId, companies, contacts, members, stages]);

  const handleTotalAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length > 1 && val.startsWith('0')) {
      setRawTotalAmount(val.replace(/^0+/, ''));
    } else {
      setRawTotalAmount(val);
    }
  };

  const handleAmountPaidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length > 1 && val.startsWith('0')) {
      setRawAmountPaid(val.replace(/^0+/, ''));
    } else {
      setRawAmountPaid(val);
    }
  };

  const handleMonthlyAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length > 1 && val.startsWith('0')) {
      setRawMonthlyAmount(val.replace(/^0+/, ''));
    } else {
      setRawMonthlyAmount(val);
    }
  };

  const handleStageChange = (newStageId: string) => {
    setStageId(newStageId);
    const selected = stages.find((s) => s.id === newStageId);
    if (selected) {
      setProbability(selected.probability);
    }
  };

  // Calculations
  const numTotalAmount = rawTotalAmount ? parseInt(rawTotalAmount, 10) : 0;
  const numAmountPaid = rawAmountPaid ? parseInt(rawAmountPaid, 10) : 0;
  const numMonthlyAmount = rawMonthlyAmount ? parseInt(rawMonthlyAmount, 10) : 0;

  const calculatedRemaining = paymentType === 'MONTHLY_RECURRING'
    ? Math.max(0, numMonthlyAmount - numAmountPaid)
    : Math.max(0, numTotalAmount - numAmountPaid);

  const todayStr = new Date().toISOString().split('T')[0];
  let calculatedStatus: PaymentStatus = 'PENDING';

  if (customPaymentStatus) {
    calculatedStatus = customPaymentStatus;
  } else if (paymentType === 'MONTHLY_RECURRING') {
    if (nextPaymentDate && nextPaymentDate < todayStr && numAmountPaid < numMonthlyAmount) {
      calculatedStatus = 'OVERDUE';
    } else if (numAmountPaid >= numMonthlyAmount && numMonthlyAmount > 0) {
      calculatedStatus = 'PAID';
    } else if (numAmountPaid > 0) {
      calculatedStatus = 'PARTIALLY_PAID';
    } else {
      calculatedStatus = 'PENDING';
    }
  } else {
    // ONE_TIME
    if (numAmountPaid >= numTotalAmount && numTotalAmount > 0) {
      calculatedStatus = 'PAID';
    } else if (numAmountPaid > 0) {
      calculatedStatus = 'PARTIALLY_PAID';
    } else {
      calculatedStatus = 'PENDING';
    }
  }

  // Filter deal payments
  const dealPayments: Payment[] = deal
    ? payments.filter((p) => p.deal_id === deal.id)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload: Partial<Deal> = {
      name,
      company_id: companyId || null,
      contact_id: contactId || null,
      stage_id: stageId,
      probability: Number(probability) || 0,
      expected_close_date: expectedCloseDate || null,
      owner_id: ownerId || null,
      source,
      priority,
      notes,
      payment_type: paymentType,
      value: paymentType === 'MONTHLY_RECURRING' ? numMonthlyAmount || numTotalAmount : numTotalAmount,
      total_amount: numTotalAmount,
      monthly_amount: numMonthlyAmount,
      amount_paid: numAmountPaid,
      amount_remaining: calculatedRemaining,
      payment_status: calculatedStatus,
      billing_start_date: billingStartDate || null,
      next_payment_date: nextPaymentDate || null,
    };

    if (deal) {
      await updateDeal(deal.id, payload);
    } else {
      await createDeal({
        ...payload,
        pipeline_id: pipeline.id,
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100/80 dark:from-slate-800 dark:to-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {deal ? 'Deal & Payment Details' : 'New Deal & Payment Setup'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage deal financials, client billing, and payment tracking.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Section 1: Deal Information */}
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                1. General Deal Information
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deal Title / Client Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp Enterprise Software Contract"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-850 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Company
                  </label>
                  <select
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">No Company Linked</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Contact
                  </label>
                  <select
                    value={contactId}
                    onChange={(e) => setContactId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">No Contact Linked</option>
                    {contacts.map((ct) => (
                      <option key={ct.id} value={ct.id}>
                        {ct.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sales Pipeline Stage
                  </label>
                  <select
                    value={stageId}
                    onChange={(e) => handleStageChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {stages.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.probability}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expected Close Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={expectedCloseDate}
                      onChange={(e) => setExpectedCloseDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Payment Structure & Management */}
            <div className="space-y-4 pt-4 border-t border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                  2. Payment Management
                </div>
                {/* Payment Type Switcher */}
                <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPaymentType('ONE_TIME')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      paymentType === 'ONE_TIME'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    ONE-TIME PAYMENT
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('MONTHLY_RECURRING')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      paymentType === 'MONTHLY_RECURRING'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    MONTHLY RECURRING
                  </button>
                </div>
              </div>

              {/* One Time Payment Fields */}
              {paymentType === 'ONE_TIME' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Deal Value Input with proper formatting & NO leading zero */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Total Deal Value (₹) <span className="text-rose-500">*</span>
                        </label>
                        {numTotalAmount > 0 && (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(numTotalAmount)}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <span className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm">
                          ₹
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="e.g. 80000"
                          value={rawTotalAmount}
                          onChange={handleTotalAmountChange}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Amount Paid */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Amount Paid (₹)
                        </label>
                        {numAmountPaid > 0 && (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(numAmountPaid)}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <span className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm">
                          ₹
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="e.g. 30000"
                          value={rawAmountPaid}
                          onChange={handleAmountPaidChange}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Monthly Recurring Fields */}
              {paymentType === 'MONTHLY_RECURRING' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Monthly Amount */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Monthly Amount (₹ MRR) <span className="text-rose-500">*</span>
                        </label>
                        {numMonthlyAmount > 0 && (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(numMonthlyAmount)}/mo
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <span className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm">
                          ₹
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="e.g. 15000"
                          value={rawMonthlyAmount}
                          onChange={handleMonthlyAmountChange}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Paid This Cycle */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Amount Paid This Cycle (₹)
                        </label>
                        {numAmountPaid > 0 && (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(numAmountPaid)}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <span className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm">
                          ₹
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="e.g. 15000"
                          value={rawAmountPaid}
                          onChange={handleAmountPaidChange}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Billing Start Date
                      </label>
                      <input
                        type="date"
                        value={billingStartDate}
                        onChange={(e) => setBillingStartDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Next Payment Due Date
                      </label>
                      <input
                        type="date"
                        value={nextPaymentDate}
                        onChange={(e) => setNextPaymentDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Financial Summary Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Value</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {formatCurrency(paymentType === 'MONTHLY_RECURRING' ? numMonthlyAmount : numTotalAmount)}
                    </div>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Paid</div>
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {formatCurrency(numAmountPaid)}
                    </div>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Remaining</div>
                    <div className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                      {formatCurrency(calculatedRemaining)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Payment Status:
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        calculatedStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                          : calculatedStatus === 'PARTIALLY_PAID'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                          : calculatedStatus === 'OVERDUE'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {calculatedStatus === 'PAID' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {calculatedStatus === 'PARTIALLY_PAID' && <Clock className="w-3 h-3 text-amber-600" />}
                      {calculatedStatus === 'OVERDUE' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                      {calculatedStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Payment History (For Existing Deals) */}
            {deal && (
              <div className="space-y-3 pt-4 border-t border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    Payment History ({dealPayments.length})
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRecordPaymentOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Record Payment
                  </button>
                </div>

                {dealPayments.length === 0 ? (
                  <div className="p-4 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                    No payments recorded yet. Click <span className="font-semibold text-emerald-600">Record Payment</span> above to add a transaction.
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Amount</th>
                          <th className="py-2 px-3">Method</th>
                          <th className="py-2 px-3">Notes</th>
                          <th className="py-2 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {dealPayments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">
                              {p.payment_date}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(p.amount)}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                              <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium">
                                {p.payment_method || 'UPI'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                              {p.notes || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => deletePayment(p.id, deal.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                                title="Delete payment record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Section 4: Notes */}
            <div className="space-y-2 pt-4 border-t border-slate-200/80 dark:border-slate-800">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Notes & Terms
              </label>
              <textarea
                rows={2}
                placeholder="Commercial terms, payment agreements, milestones..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
              >
                {deal ? 'Update Deal & Payments' : 'Create Deal'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Record Payment Sub Modal */}
      {deal && (
        <RecordPaymentModal
          isOpen={isRecordPaymentOpen}
          onClose={() => setIsRecordPaymentOpen(false)}
          deal={deal}
        />
      )}
    </>
  );
}
