'use client';

import React, { useState, useEffect } from 'react';
import { Deal, PaymentMethod, PaymentType } from '@/types/crm';
import { useCrm } from '@/context/crm-context';
import { formatCurrency } from '@/lib/utils';
import {
  X,
  CreditCard,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
} from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal | null;
  onPaymentRecorded?: () => void;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'UPI',
  'Bank Transfer',
  'Cash',
  'Card',
  'Other',
];

export function RecordPaymentModal({
  isOpen,
  onClose,
  deal,
  onPaymentRecorded,
}: RecordPaymentModalProps) {
  const { createPayment } = useCrm();

  const [rawAmount, setRawAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (deal && isOpen) {
      const remaining = Number(deal.amount_remaining ?? 0);
      const defaultAmt = remaining > 0 ? remaining.toString() : '';
      setRawAmount(defaultAmt);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('UPI');
      setNotes('');
      setError(null);
    }
  }, [deal, isOpen]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    // Prevent unwanted leading zero
    if (val.length > 1 && val.startsWith('0')) {
      setRawAmount(val.replace(/^0+/, ''));
    } else {
      setRawAmount(val);
    }
    setError(null);
  };

  const numericAmount = rawAmount ? parseInt(rawAmount, 10) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deal) return;

    if (!numericAmount || numericAmount <= 0) {
      setError('Please enter a valid payment amount greater than ₹0.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createPayment({
        organization_id: deal.organization_id,
        deal_id: deal.id,
        amount: numericAmount,
        payment_date: paymentDate || new Date().toISOString().split('T')[0],
        payment_type: deal.payment_type || 'ONE_TIME',
        payment_method: paymentMethod,
        status: 'COMPLETED',
        notes: notes.trim() || undefined,
      });

      onPaymentRecorded?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !deal) return null;

  const dealTotal = Number(deal.total_amount ?? deal.value ?? 0);
  const dealPaid = Number(deal.amount_paid ?? 0);
  const dealRemaining = Number(deal.amount_remaining ?? Math.max(0, dealTotal - dealPaid));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-100 text-[11px] font-bold uppercase tracking-wider mb-0.5">
              <CreditCard className="w-3.5 h-3.5" />
              Payment Management
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">Record Deal Payment</h3>
            <p className="text-xs text-emerald-100/90 mt-0.5 truncate max-w-sm">
              {deal.name} {deal.company?.name ? `• ${deal.company.name}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-emerald-100 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Summary Strip */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-center">
            <div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Deal Value
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {formatCurrency(dealTotal)}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Paid
              </div>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatCurrency(dealPaid)}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Remaining
              </div>
              <div className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {formatCurrency(dealRemaining)}
              </div>
            </div>
          </div>

          {/* Payment Amount Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Amount Received (₹) <span className="text-rose-500">*</span>
              </label>
              {numericAmount > 0 && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(numericAmount)}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                ₹
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={rawAmount}
                onChange={handleAmountChange}
                placeholder="e.g. 25000"
                className="w-full pl-8 pr-4 py-2.5 text-base font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
            </div>
            {dealRemaining > 0 && (
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setRawAmount(dealRemaining.toString())}
                  className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Pay full remaining balance ({formatCurrency(dealRemaining)})
                </button>
              </div>
            )}
          </div>

          {/* Date & Method Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Payment Date
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes / Reference */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Notes / Transaction Reference (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. UPI Ref #482910398402, Bank Transfer to HDFC A/C"
              rows={2}
              className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || numericAmount <= 0}
              className="px-5 py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Recording...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Record Payment {numericAmount > 0 ? `(${formatCurrency(numericAmount)})` : ''}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
