'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Upload,
  Download,
  Search,
  Filter,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Phone,
  PhoneCall,
  Mail,
  Building,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  Sparkles,
  RefreshCw,
  MessageSquare,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useCrm } from '@/context/crm-context';
import { useAuth } from '@/context/auth-context';
import { Lead, LeadSource, LeadStatus, Priority } from '@/types/crm';
import { formatCurrency, formatDate, getStatusColor, getPriorityColor, downloadCsvFile, getInitials } from '@/lib/utils';
import { LeadModal } from './lead-modal';
import { CsvImporterModal } from './csv-importer-modal';
import { CallDispositionModal } from './call-disposition-modal';

import { useSearchParams } from 'next/navigation';

const STATUS_TABS: { label: string; value: string; code: string }[] = [
  { label: 'ALL LEADS', value: 'ALL', code: 'ALL' },
  { label: 'FRESH INQUIRIES', value: 'NEW', code: 'NEW' },
  { label: 'NOT PICKED', value: 'NOT_PICKED', code: 'NOT_PICKED' },
  { label: 'INTERESTED', value: 'INTERESTED', code: 'INTERESTED' },
  { label: 'FOLLOW UP', value: 'FOLLOW_UP', code: 'FOLLOW_UP' },
  { label: 'DEMO SCHEDULED', value: 'DEMO', code: 'DEMO' },
  { label: 'CLOSED WON', value: 'WON', code: 'WON' },
  { label: 'LOST', value: 'LOST', code: 'LOST' },
  { label: 'ALL DATABASE', value: 'HISTORICAL_ALL', code: 'HISTORICAL_ALL' },
];

const SOURCE_OPTIONS = ['ALL', 'WEBSITE', 'INSTAGRAM', 'FACEBOOK', 'GOOGLE', 'WHATSAPP', 'REFERRAL', 'COLD_CALL', 'ADVERTISEMENT', 'SCRAPED', 'MANUAL'];
const PRIORITY_OPTIONS = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const PAYMENT_STATUS_OPTIONS = ['ALL', 'PAID', 'PARTIALLY_PAID', 'PENDING', 'OVERDUE'];

export function LeadsTable() {
  const searchParams = useSearchParams();
  const rawStatus = searchParams ? searchParams.get('status') : null;
  const initialStatus = rawStatus ? rawStatus.toUpperCase() : 'ALL';

  const {
    leads,
    allLeads,
    deals,
    totalLeads,
    totalPages,
    currentPage,
    fetchLeads,
    deleteLead,
    clearAllLeads,
    refreshAll,
    isLoadingData,
  } = useCrm();
  const { members, organization } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [selectedSource, setSelectedSource] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedOwner, setSelectedOwner] = useState('ALL');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('ALL');

  React.useEffect(() => {
    const formatted = rawStatus ? rawStatus.toUpperCase() : 'ALL';
    setSelectedStatus(formatted);
    fetchLeads({ status: formatted, page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawStatus]);

  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [activeCallLead, setActiveCallLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const openCsvImporter = () => {
    setIsCsvModalOpen(true);
  };

  const handleFilterChange = (updates: {
    search?: string;
    status?: string;
    source?: string;
    priority?: string;
    owner_id?: string;
    payment_status?: string;
    page?: number;
  }) => {
    const newStatus = updates.status !== undefined ? updates.status : selectedStatus;
    const newSource = updates.source !== undefined ? updates.source : selectedSource;
    const newPriority = updates.priority !== undefined ? updates.priority : selectedPriority;
    const newOwner = updates.owner_id !== undefined ? updates.owner_id : selectedOwner;
    const newPayment = updates.payment_status !== undefined ? updates.payment_status : selectedPaymentStatus;
    const newSearch = updates.search !== undefined ? updates.search : searchTerm;
    const newPage = updates.page !== undefined ? updates.page : currentPage;

    if (updates.status !== undefined) {
      setSelectedStatus(updates.status);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (updates.status === 'ALL') {
          url.searchParams.delete('status');
        } else {
          url.searchParams.set('status', updates.status.toLowerCase());
        }
        window.history.replaceState(null, '', url.pathname + url.search);
      }
    }
    if (updates.source !== undefined) setSelectedSource(updates.source);
    if (updates.priority !== undefined) setSelectedPriority(updates.priority);
    if (updates.owner_id !== undefined) setSelectedOwner(updates.owner_id);
    if (updates.payment_status !== undefined) setSelectedPaymentStatus(updates.payment_status);

    fetchLeads({
      search: newSearch,
      status: newStatus,
      source: newSource,
      priority: newPriority,
      owner_id: newOwner,
      page: newPage,
    });
  };

  const handleStartCall = (lead: Lead) => {
    setActiveCallLead(lead);
    setIsCallModalOpen(true);
  };

  const handleWhatsAppChat = (phone: string, name: string) => {
    if (!phone) return;
    const cleanNumber = phone.replace(/[^0-9]/g, '');
    const formatted = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;
    const message = encodeURIComponent(`Hi ${name}, reaching out from First Click Softwares regarding your recent inquiry.`);
    window.open(`https://wa.me/${formatted}?text=${message}`, '_blank');
  };

  const handleExportCsv = () => {
    const headers = 'Name,Phone,Email,Company,Source,Status,Value,Payment Type,Total Amount,Amount Received,Amount Pending,Notes,Assigned Admin,Created At\n';
    
    if (leads.length === 0) {
      // Deterministically download valid template with headers
      downloadCsvFile(headers, `firstclick_leads_${new Date().toISOString().split('T')[0]}.csv`);
      return;
    }

    const rows = leads
      .map((l) => {
        const linkedDeal = deals.find((d) => d.lead_id === l.id);
        const dealVal = linkedDeal ? Number(linkedDeal.total_amount ?? linkedDeal.value ?? 0) : Number(l.estimated_value || 0);
        const paidVal = linkedDeal ? Number(linkedDeal.amount_paid || 0) : 0;
        const remainingVal = linkedDeal ? Number(linkedDeal.amount_remaining || Math.max(0, dealVal - paidVal)) : dealVal;
        const paymentType = linkedDeal?.payment_type || 'ONE_TIME';
        const assignedAdmin = l.owner?.full_name || l.owner?.email || 'Ekansh';
        const cleanNotes = (l.notes || '').replace(/"/g, '""');

        return `"${l.full_name}","${l.phone || ''}","${l.email || ''}","${l.company_name || ''}","${l.source}","${l.status}","${dealVal}","${paymentType}","${dealVal}","${paidVal}","${remainingVal}","${cleanNotes}","${assignedAdmin}","${formatDate(l.created_at)}"`;
      })
      .join('\n');

    downloadCsvFile(headers + rows, `firstclick_leads_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Compute live counts for each tab independently
  const getTabCount = (statusCode: string) => {
    const list = Array.isArray(allLeads) && allLeads.length > 0 ? allLeads : Array.isArray(leads) ? leads : [];
    if (statusCode === 'ALL' || statusCode === 'NEW') {
      return list.filter((l) => l && (l.status === 'NEW' || !l.status)).length;
    }
    if (statusCode === 'HISTORICAL_ALL') {
      return list.length;
    }
    return list.filter((l) => l && l.status === statusCode).length;
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Telecalling & Pipeline Sync</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            Leads & Telecalling Engine
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
              {totalLeads} Active
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            1-Click Telecalling with instant post-call disposition tagging and full CSV pipeline sync.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={openCsvImporter}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Import CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              if (confirm('Are you sure you want to PERMANENTLY REMOVE ALL LEADS from all filter sections? This will reset all tab counts to 0.')) {
                await clearAllLeads();
              }
            }}
            className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            title="Wipe all leads and reset counts to 0"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Clear All Leads</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingLead(null);
              setIsLeadModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Single Lead</span>
          </button>
        </div>
      </div>

      {/* Category / Disposition Quick Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs custom-scrollbar">
        {STATUS_TABS.map((tab) => {
          const isActive = selectedStatus === tab.value;
          const count = getTabCount(tab.code);

          return (
            <button
              key={tab.value}
              onClick={() => handleFilterChange({ status: tab.value, page: 1 })}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters Container */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <input
              type="text"
              placeholder="Search by name, phone, email, company..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleFilterChange({ search: e.target.value, page: 1 });
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* Source Filter */}
          <div>
            <select
              value={selectedSource}
              onChange={(e) => handleFilterChange({ source: e.target.value, page: 1 })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Sources</option>
              {SOURCE_OPTIONS.filter((s) => s !== 'ALL').map((src) => (
                <option key={src} value={src}>
                  {src.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={selectedPriority}
              onChange={(e) => handleFilterChange({ priority: e.target.value, page: 1 })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              {PRIORITY_OPTIONS.filter((p) => p !== 'ALL').map((p) => (
                <option key={p} value={p}>
                  {p} Priority
                </option>
              ))}
            </select>
          </div>

          {/* Admin Filter */}
          <div>
            <select
              value={selectedOwner}
              onChange={(e) => handleFilterChange({ owner_id: e.target.value, page: 1 })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Admins</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.user?.full_name || m.user?.email}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => handleFilterChange({ payment_status: e.target.value, page: 1 })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Payments</option>
              {PAYMENT_STATUS_OPTIONS.filter((p) => p !== 'ALL').map((ps) => (
                <option key={ps} value={ps}>
                  {ps.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200/90 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">LEAD NAME</th>
                <th className="px-5 py-3.5">DIRECT CALL / PHONE</th>
                <th className="px-5 py-3.5">STATUS / DISPOSITION</th>
                <th className="px-5 py-3.5">SOURCE</th>
                <th className="px-5 py-3.5">VALUE (₹)</th>
                <th className="px-5 py-3.5">PAYMENT</th>
                <th className="px-5 py-3.5">ADMIN ASSIGNED</th>
                <th className="px-5 py-3.5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">No leads found in this view</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Import your CSV file or add your first lead to start building your telecalling pipeline.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={openCsvImporter}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                        >
                          Import CSV
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLead(null);
                            setIsLeadModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
                        >
                          Add Lead
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const statusStyle = getStatusColor(lead.status);
                  const priorityStyle = getPriorityColor(lead.priority);
                  const linkedDeal = deals.find((d) => d.lead_id === lead.id);

                  const dealVal = linkedDeal ? Number(linkedDeal.total_amount ?? linkedDeal.value ?? 0) : Number(lead.estimated_value || 0);
                  const paidVal = linkedDeal ? Number(linkedDeal.amount_paid || 0) : 0;
                  const remainingVal = linkedDeal ? Number(linkedDeal.amount_remaining || Math.max(0, dealVal - paidVal)) : dealVal;
                  const payStatus = linkedDeal?.payment_status || (paidVal >= dealVal && dealVal > 0 ? 'PAID' : paidVal > 0 ? 'PARTIALLY_PAID' : 'PENDING');

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Name & Company */}
                      <td className="px-5 py-3.5">
                        <Link href={`/leads/${lead.id}`} className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs shadow-2xs shrink-0">
                            {getInitials(lead.full_name)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-bold text-slate-900">{lead.full_name}</div>
                            {lead.company_name ? (
                              <div className="text-[11px] text-slate-500 font-normal truncate">
                                {lead.company_name}
                              </div>
                            ) : lead.email ? (
                              <div className="text-[11px] text-slate-400 font-normal truncate">
                                {lead.email}
                              </div>
                            ) : null}
                          </div>
                        </Link>
                      </td>

                      {/* Direct Call Button & WhatsApp & Phone */}
                      <td className="px-5 py-3.5">
                        {lead.phone ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleStartCall(lead)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow-xs flex items-center gap-1.5 transition-transform hover:scale-105 cursor-pointer"
                              title="Direct dial and launch disposition console"
                            >
                              <Phone className="w-3 h-3" />
                              <span>CALL</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleWhatsAppChat(lead.phone!, lead.full_name)}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs transition-colors cursor-pointer border border-emerald-200"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-mono text-slate-800 font-semibold text-xs">{lead.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No phone</span>
                        )}
                      </td>

                      {/* Status / Disposition Tag */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}></span>
                          {lead.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Source */}
                      <td className="px-5 py-3.5">
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {lead.source}
                        </span>
                      </td>

                      {/* Estimated Value in INR */}
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {formatCurrency(dealVal)}
                      </td>

                      {/* Payment Status & Breakdown */}
                      <td className="px-5 py-3.5">
                        {dealVal > 0 ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                payStatus === 'PAID'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : payStatus === 'PARTIALLY_PAID'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : payStatus === 'OVERDUE'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                {payStatus.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              Paid: <span className="text-emerald-600 font-bold">{formatCurrency(paidVal)}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Owner */}
                      <td className="px-5 py-3.5 text-slate-700 font-medium">
                        {lead.owner?.full_name || lead.owner?.email?.split('@')[0] || 'Ekansh'}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/leads/${lead.id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="View Lead Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLead(lead);
                              setIsLeadModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Edit Lead"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete lead "${lead.full_name}"?`)) {
                                deleteLead(lead.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-900">{leads.length}</span> of{' '}
            <span className="font-bold text-slate-900">{totalLeads}</span> leads
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleFilterChange({ page: Math.max(1, currentPage - 1) })}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-100 cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => handleFilterChange({ page: Math.min(totalPages, currentPage + 1) })}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-100 cursor-pointer shadow-2xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Single Lead Add / Edit Modal */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => {
          setIsLeadModalOpen(false);
          setEditingLead(null);
        }}
        lead={editingLead}
      />

      {/* CSV Importer Modal */}
      <CsvImporterModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
      />

      {/* Live Call Dialing & Disposition Modal */}
      <CallDispositionModal
        isOpen={isCallModalOpen}
        onClose={() => {
          setIsCallModalOpen(false);
          setActiveCallLead(null);
        }}
        lead={activeCallLead}
      />
    </div>
  );
}
