'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Plus,
  Search,
  KanbanSquare,
  Building,
  Calendar,
  Edit2,
  Trash2,
  Download,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Filter,
  IndianRupee,
} from 'lucide-react';
import { CrmLayout } from '@/components/layout/crm-layout';
import { useCrm } from '@/context/crm-context';
import { useAuth } from '@/context/auth-context';
import { Deal, PaymentStatus, PaymentType } from '@/types/crm';
import { formatCurrency, formatDate, downloadCsvFile } from '@/lib/utils';
import { DealModal } from '@/components/deals/deal-modal';
import { RecordPaymentModal } from '@/components/deals/record-payment-modal';

export default function DealsPage() {
  const { deals, deleteDeal, updateDealStage, pipeline } = useCrm();
  const { organization } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('ALL');
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>('ALL');

  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [paymentTargetDeal, setPaymentTargetDeal] = useState<Deal | null>(null);

  const stages = pipeline?.stages || [];

  const filteredDeals = deals.filter((d) => {
    const matchesSearch =
      !search.trim() ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.company?.name.toLowerCase().includes(search.toLowerCase());

    const matchesStage = selectedStage === 'ALL' || d.stage_id === selectedStage;
    const matchesPaymentStatus =
      selectedPaymentStatus === 'ALL' || (d.payment_status || 'PENDING') === selectedPaymentStatus;
    const matchesPaymentType =
      selectedPaymentType === 'ALL' || (d.payment_type || 'ONE_TIME') === selectedPaymentType;

    return matchesSearch && matchesStage && matchesPaymentStatus && matchesPaymentType;
  });

  // Calculate live aggregates
  const totalSales = deals.reduce((sum, d) => sum + (Number(d.total_amount ?? d.value ?? 0)), 0);
  const totalReceived = deals.reduce((sum, d) => sum + (Number(d.amount_paid ?? 0)), 0);
  const totalOutstanding = deals.reduce((sum, d) => sum + (Number(d.amount_remaining ?? 0)), 0);
  const overdueDeals = deals.filter((d) => d.payment_status === 'OVERDUE');
  const overdueTotal = overdueDeals.reduce((sum, d) => sum + (Number(d.amount_remaining || d.monthly_amount || 0)), 0);

  const handleExportCsv = () => {
    if (deals.length === 0) return;
    const headers =
      'Deal Name,Value,Payment Type,Amount Paid,Amount Remaining,Payment Status,Stage,Company,Contact,Owner,Expected Close\n';
    const rows = deals
      .map(
        (d) =>
          `"${d.name}","${d.total_amount ?? d.value ?? 0}","${d.payment_type || 'ONE_TIME'}","${d.amount_paid || 0}","${d.amount_remaining || 0}","${d.payment_status || 'PENDING'}","${d.stage?.name || ''}","${d.company?.name || ''}","${d.contact?.full_name || ''}","${d.owner?.full_name || ''}","${d.expected_close_date || ''}"`
      )
      .join('\n');
    downloadCsvFile(headers + rows, 'deals_payment_export.csv');
  };

  const getStatusBadge = (status?: PaymentStatus) => {
    const s = status || 'PENDING';
    if (s === 'PAID') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          PAID
        </span>
      );
    }
    if (s === 'PARTIALLY_PAID') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
          <Clock className="w-3 h-3 text-amber-600" />
          PARTIAL
        </span>
      );
    }
    if (s === 'OVERDUE') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-800 animate-pulse">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          OVERDUE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
        PENDING
      </span>
    );
  };

  return (
    <CrmLayout>
      <div className="space-y-5 max-w-7xl mx-auto pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              Deals & Payment Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Track client contracts, payment history, outstanding balances, and recurring revenue.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/pipeline"
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <KanbanSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Sales Pipeline</span>
            </Link>
            <button
              onClick={() => {
                setEditingDeal(null);
                setIsDealModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Deal / Client</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Real Live Payment Financial KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Deal Sales
              </div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                {formatCurrency(totalSales)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{deals.length} Active Deals</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Total Received
              </div>
              <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(totalReceived)}
              </div>
              <div className="text-[11px] text-emerald-600/80 mt-0.5">
                {totalSales > 0 ? `${((totalReceived / totalSales) * 100).toFixed(0)}% collected` : '0%'}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Total Outstanding
              </div>
              <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                {formatCurrency(totalOutstanding)}
              </div>
              <div className="text-[11px] text-amber-600/80 mt-0.5">Pending collection</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Overdue Payments
              </div>
              <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                {overdueDeals.length > 0 ? formatCurrency(overdueTotal) : '₹0'}
              </div>
              <div className="text-[11px] text-rose-600/80 mt-0.5">{overdueDeals.length} Overdue Deals</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search deals by client name, title, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
            {/* Stage Filter */}
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Sales Stages</option>
              {stages.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>

            {/* Payment Status Filter */}
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Payment Status</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>

            {/* Payment Type Filter */}
            <select
              value={selectedPaymentType}
              onChange={(e) => setSelectedPaymentType(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Payment Types</option>
              <option value="ONE_TIME">One-Time</option>
              <option value="MONTHLY_RECURRING">Monthly Recurring</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3.5 pl-5">Client / Deal</th>
                  <th className="p-3.5">Payment Type</th>
                  <th className="p-3.5">Deal Value</th>
                  <th className="p-3.5">Paid</th>
                  <th className="p-3.5">Remaining</th>
                  <th className="p-3.5">Payment Status</th>
                  <th className="p-3.5">Sales Stage</th>
                  <th className="p-3.5">Next Payment</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                {filteredDeals.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No deals found matching the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDeals.map((deal) => {
                    const totalVal = Number(deal.total_amount ?? deal.value ?? 0);
                    const paidVal = Number(deal.amount_paid ?? 0);
                    const remainingVal = Number(deal.amount_remaining ?? Math.max(0, totalVal - paidVal));

                    return (
                      <tr key={deal.id} className="hover:bg-slate-50 dark:hover:bg-slate-750/50 transition-colors">
                        {/* Client / Deal Name */}
                        <td className="p-3.5 pl-5">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{deal.name}</span>
                          </div>
                          {deal.company && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <Building className="w-3 h-3 text-slate-400" />
                              <span>{deal.company.name}</span>
                            </div>
                          )}
                        </td>

                        {/* Payment Type */}
                        <td className="p-3.5">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                              deal.payment_type === 'MONTHLY_RECURRING'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            }`}
                          >
                            {deal.payment_type === 'MONTHLY_RECURRING' ? 'MONTHLY' : 'ONE-TIME'}
                          </span>
                        </td>

                        {/* Deal Value */}
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white text-sm">
                          {deal.payment_type === 'MONTHLY_RECURRING' && deal.monthly_amount
                            ? `${formatCurrency(deal.monthly_amount)}/mo`
                            : formatCurrency(totalVal)}
                        </td>

                        {/* Paid */}
                        <td className="p-3.5 font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(paidVal)}
                        </td>

                        {/* Remaining */}
                        <td className="p-3.5 font-semibold text-amber-600 dark:text-amber-400">
                          {formatCurrency(remainingVal)}
                        </td>

                        {/* Payment Status Badge */}
                        <td className="p-3.5">{getStatusBadge(deal.payment_status)}</td>

                        {/* Sales Pipeline Stage */}
                        <td className="p-3.5">
                          <select
                            value={deal.stage_id}
                            onChange={(e) => updateDealStage(deal.id, e.target.value)}
                            className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                          >
                            {stages.map((st) => (
                              <option key={st.id} value={st.id}>
                                {st.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Next Payment Date */}
                        <td className="p-3.5 text-slate-600 dark:text-slate-400 text-[11px]">
                          {deal.next_payment_date ? formatDate(deal.next_payment_date) : '—'}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 pr-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Record Payment Button */}
                            <button
                              onClick={() => {
                                setPaymentTargetDeal(deal);
                                setIsRecordPaymentOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 dark:text-emerald-400 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
                              title="Record client payment"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>+ Pay</span>
                            </button>

                            <button
                              onClick={() => {
                                setEditingDeal(deal);
                                setIsDealModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors"
                              title="Edit deal details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`Delete deal "${deal.name}"?`)) deleteDeal(deal.id);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors"
                              title="Delete deal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Deal Edit / Create Modal */}
        <DealModal
          isOpen={isDealModalOpen}
          onClose={() => setIsDealModalOpen(false)}
          deal={editingDeal}
        />

        {/* Quick Record Payment Modal */}
        <RecordPaymentModal
          isOpen={isRecordPaymentOpen}
          onClose={() => {
            setIsRecordPaymentOpen(false);
            setPaymentTargetDeal(null);
          }}
          deal={paymentTargetDeal}
        />
      </div>
    </CrmLayout>
  );
}
