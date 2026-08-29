'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  DollarSign,
  TrendingUp,
  Award,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Phone,
  PhoneOff,
  Mail,
  MessageSquare,
  ArrowRight,
  Sparkles,
  RefreshCw,
  History as HistoryIcon,
  PhoneCall,
  Flame,
  Layers,
  CheckSquare,
  CreditCard,
  AlertTriangle,
  Repeat,
  IndianRupee,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useCrm } from '@/context/crm-context';
import { useAuth } from '@/context/auth-context';
import { formatCurrency, formatDate, formatRelativeTime, getStatusColor, getInitials } from '@/lib/utils';

const COLORS = ['#6366F1', '#38BDF8', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6', '#F97316'];

export function DashboardView() {
  const { dashboardStats, updateTaskStatus, isLoadingData, refreshAll, leads, allLeads, deals, payments } = useCrm();
  const { user, organization } = useAuth();

  const safeLeads = Array.isArray(allLeads) && allLeads.length > 0 ? allLeads : Array.isArray(leads) ? leads : [];
  const safeDeals = Array.isArray(deals) ? deals : [];

  const {
    todayFollowUps = [],
    overdueTasks = [],
    totalLeads = safeLeads.length,
    newLeads = safeLeads.filter((l) => l && l.status === 'NEW').length,
    qualifiedLeads = safeLeads.filter((l) => l && l.status === 'QUALIFIED').length,
    notPickedLeads = safeLeads.filter((l) => l && l.status === 'NOT_PICKED').length,
    interestedLeads = safeLeads.filter((l) => l && l.status === 'INTERESTED').length,
    followUpLeads = safeLeads.filter((l) => l && l.status === 'FOLLOW_UP').length,
    demoLeads = safeLeads.filter((l) => l && l.status === 'DEMO').length,
    unassignedLeads = safeLeads.filter((l) => l && !l.owner_id).length,
    followUpsDue = followUpLeads + todayFollowUps.length + overdueTasks.length,
    openDeals = deals.filter((d) => (d.stage as any)?.code !== 'WON' && (d.stage as any)?.code !== 'LOST').length,
    wonDeals = deals.filter((d) => (d.stage as any)?.code === 'WON').length,

    // Real dynamic payment stats
    totalSales = deals.reduce((sum, d) => sum + (Number(d.total_amount ?? d.value ?? 0)), 0),
    totalReceived = deals.reduce((sum, d) => sum + (Number(d.amount_paid ?? 0)), 0),
    totalOutstanding = deals.reduce((sum, d) => sum + (Number(d.amount_remaining ?? 0)), 0),
    overduePaymentsCount = deals.filter((d) => d.payment_status === 'OVERDUE').length,
    overduePaymentsValue = deals
      .filter((d) => d.payment_status === 'OVERDUE')
      .reduce((sum, d) => sum + (Number(d.amount_remaining || d.monthly_amount || 0)), 0),
    monthlyRecurringRevenue = deals
      .filter((d) => d.payment_type === 'MONTHLY_RECURRING')
      .reduce((sum, d) => sum + (Number(d.monthly_amount || 0)), 0),

    sourceData = [],
    pipelineDistribution = [],
    realTrendData = [],
    recentLeads = safeLeads.slice(0, 5),
    recentActivities = [],
    connectionError = null,
  } = dashboardStats || {};

  const demosScheduledCount = demoLeads;

  const trendChartData = (realTrendData && realTrendData.length > 0)
    ? realTrendData
    : [{ month: 'Current', leads: totalLeads, revenue: totalReceived }];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Connection Notice if any */}
      {connectionError && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Supabase Notice:</span> {connectionError}
            </div>
          </div>
          <button
            onClick={() => refreshAll()}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              First Click CRM — Sales, Billing & Payment Intelligence
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.full_name || 'Admin'}!
            </h1>
            <p className="text-slate-300 text-xs mt-1 max-w-xl">
              Workspace: <span className="font-semibold text-white">{organization?.name || 'First Click Softwares'}</span>. Currency: <span className="text-emerald-400 font-bold font-mono">INR (₹)</span>. Total collections: <span className="text-emerald-400 font-bold">{formatCurrency(totalReceived)}</span>.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/leads?action=create"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2 shrink-0"
            >
              <Users className="w-4 h-4" />
              <span>+ Add Lead</span>
            </Link>
            <Link
              href="/deals"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all flex items-center gap-2 shrink-0"
            >
              <CreditCard className="w-4 h-4" />
              <span>Manage Payments</span>
            </Link>
            <button
              onClick={() => refreshAll()}
              title="Refresh live metrics"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Real Payment & Financial Metrics Row (Top Priority) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            Live Client Payment & Revenue Metrics
          </h2>
          <Link href="/deals" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1">
            <span>View All Deals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {/* 1. TOTAL SALES */}
          <Link
            href="/deals"
            className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-400 transition-all group block"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>TOTAL SALES</span>
              <DollarSign className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl md:text-2xl font-extrabold text-slate-900 mt-2">
              {formatCurrency(totalSales)}
            </div>
            <div className="text-[11px] text-blue-600 font-semibold flex items-center gap-0.5 mt-1">
              <span>{deals.length} Active Deals</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 2. TOTAL RECEIVED */}
          <Link
            href="/deals?status=PAID"
            className="bg-white p-5 rounded-2xl border border-emerald-200/90 bg-emerald-50/20 shadow-xs hover:shadow-md hover:border-emerald-400 transition-all group block"
          >
            <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
              <span>TOTAL RECEIVED</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl md:text-2xl font-extrabold text-emerald-700 mt-2">
              {formatCurrency(totalReceived)}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-1">
              <span>{totalSales > 0 ? `${((totalReceived / totalSales) * 100).toFixed(0)}% collected` : '0%'}</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 3. TOTAL OUTSTANDING */}
          <Link
            href="/deals?status=PARTIALLY_PAID"
            className="bg-white p-5 rounded-2xl border border-amber-200/90 bg-amber-50/20 shadow-xs hover:shadow-md hover:border-amber-400 transition-all group block"
          >
            <div className="flex items-center justify-between text-amber-800 text-xs font-bold">
              <span>TOTAL OUTSTANDING</span>
              <Clock className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl md:text-2xl font-extrabold text-amber-700 mt-2">
              {formatCurrency(totalOutstanding)}
            </div>
            <div className="text-[11px] text-amber-600 font-semibold flex items-center gap-0.5 mt-1">
              <span>Pending collections</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 4. OVERDUE PAYMENTS */}
          <Link
            href="/deals?status=OVERDUE"
            className="bg-white p-5 rounded-2xl border border-rose-200/90 bg-rose-50/20 shadow-xs hover:shadow-md hover:border-rose-400 transition-all group block"
          >
            <div className="flex items-center justify-between text-rose-800 text-xs font-bold">
              <span>OVERDUE PAYMENTS</span>
              <AlertTriangle className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl md:text-2xl font-extrabold text-rose-600 mt-2">
              {overduePaymentsCount > 0 ? formatCurrency(overduePaymentsValue) : '₹0'}
            </div>
            <div className="text-[11px] text-rose-600 font-semibold flex items-center gap-0.5 mt-1">
              <span>{overduePaymentsCount} overdue invoices</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 5. MONTHLY RECURRING REVENUE (MRR) */}
          <Link
            href="/deals?type=MONTHLY_RECURRING"
            className="bg-white p-5 rounded-2xl border border-purple-200/90 bg-purple-50/20 shadow-xs hover:shadow-md hover:border-purple-400 transition-all group col-span-2 sm:col-span-1 block"
          >
            <div className="flex items-center justify-between text-purple-800 text-xs font-bold">
              <span>MRR (RECURRING)</span>
              <Repeat className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl md:text-2xl font-extrabold text-purple-700 mt-2">
              {formatCurrency(monthlyRecurringRevenue)}/mo
            </div>
            <div className="text-[11px] text-purple-600 font-semibold flex items-center gap-0.5 mt-1">
              <span>Monthly subscriptions</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Telecalling Disposition & Lead Outcomes Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        {/* NOT PICKED */}
        <Link
          href="/leads?status=not_picked"
          className="bg-white p-5 rounded-2xl border border-rose-200/90 shadow-xs hover:shadow-md hover:border-rose-400 transition-all group block"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>NOT PICKED</span>
            <PhoneOff className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 mt-1.5">{notPickedLeads}</div>
          <div className="text-[11px] text-rose-600 font-semibold flex items-center gap-0.5 mt-0.5">
            <span>RNR / No answer</span>
          </div>
        </Link>

        {/* INTERESTED */}
        <Link
          href="/leads?status=interested"
          className="bg-white p-5 rounded-2xl border border-emerald-200/90 shadow-xs hover:shadow-md hover:border-emerald-400 transition-all group block"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>INTERESTED</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1.5">{interestedLeads}</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
            <span>Hot lead prospects</span>
          </div>
        </Link>

        {/* FOLLOW UP */}
        <Link
          href="/leads?status=follow_up"
          className="bg-white p-5 rounded-2xl border border-amber-200/90 shadow-xs hover:shadow-md hover:border-amber-400 transition-all group block"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>FOLLOW UP</span>
            <Calendar className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1.5">{followUpLeads}</div>
          <div className="text-[11px] text-amber-600 font-semibold flex items-center gap-0.5 mt-0.5">
            <span>Scheduled callbacks ({followUpsDue} total due)</span>
          </div>
        </Link>

        {/* DEMO */}
        <Link
          href="/leads?status=demo"
          className="bg-white p-5 rounded-2xl border border-purple-200/90 shadow-xs hover:shadow-md hover:border-purple-400 transition-all group block"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>DEMO</span>
            <Sparkles className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-extrabold text-purple-700 mt-1.5">{demoLeads}</div>
          <div className="text-[11px] text-purple-600 font-semibold flex items-center gap-0.5 mt-0.5">
            <span>Product demo scheduled</span>
          </div>
        </Link>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Lead Trend */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Inbound Calling Volume & Inflow</h3>
              <p className="text-xs text-slate-500">Live lead distribution over time</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 font-bold text-slate-600">
              Live DB
            </span>
          </div>

          <div className="h-64 w-full">
            {totalLeads === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No leads recorded yet. Import CSV or add lead to start calling.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="leads" stroke="#6366F1" strokeWidth={2.5} fillOpacity={1} fill="url(#leadGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Lead Sources Donut Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Lead Channels</h3>
              <p className="text-xs text-slate-500">Live source attribution</p>
            </div>
          </div>

          <div className="h-48 w-full">
            {sourceData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No source data recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {sourceData.map((_: { name: string; value: number }, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {sourceData.slice(0, 4).map((src: { name: string; value: number }, i: number) => (
              <div key={src.name} className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                <span className="text-slate-600 truncate">{src.name}</span>
                <span className="font-bold text-slate-900 ml-auto">{src.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3 Columns Section: Follow-ups / Recent Leads / Live Activities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today's Follow-ups */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">Action Items & Callbacks</h3>
            </div>
            <Link href="/tasks" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline">
              View all
            </Link>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-80">
            {overdueTasks.length === 0 && todayFollowUps.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No urgent follow-up calls pending!</div>
            ) : (
              <>
                {overdueTasks.map((t: any) => (
                  <div key={t.id} className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/50 flex items-start gap-2.5">
                    <button
                      onClick={() => updateTaskStatus(t.id, 'COMPLETED')}
                      className="mt-0.5 w-4 h-4 rounded border border-rose-400 hover:bg-rose-500 hover:text-white flex items-center justify-center text-[10px] shrink-0 cursor-pointer"
                    >
                      ✓
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-rose-900 truncate">{t.title}</div>
                      <div className="text-[11px] text-rose-600 flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3" /> Overdue: {formatDate(t.due_date)}
                      </div>
                    </div>
                  </div>
                ))}

                {todayFollowUps.map((t: any) => (
                  <div key={t.id} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-2.5 hover:bg-slate-100 transition-colors">
                    <button
                      onClick={() => updateTaskStatus(t.id, 'COMPLETED')}
                      className="mt-0.5 w-4 h-4 rounded border border-slate-300 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white flex items-center justify-center text-[10px] shrink-0 cursor-pointer"
                    >
                      ✓
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">{t.title}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" /> Due today
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Recent Leads */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">Recent Leads</h3>
            </div>
            <Link href="/leads" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline">
              View all
            </Link>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-80 divide-y divide-slate-100">
            {recentLeads.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No leads in pipeline yet.</div>
            ) : (
              recentLeads.map((lead: any) => {
                const statusStyle = getStatusColor(lead.status);
                return (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                    className="pt-2.5 first:pt-0 flex items-center justify-between group hover:bg-slate-50 p-1.5 rounded-lg transition-colors"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                        {getInitials(lead.full_name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate">
                          {lead.full_name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono truncate">
                          {lead.phone || lead.email || lead.company_name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                        {lead.status.replace('_', ' ')}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Live Activity Stream */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HistoryIcon className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">Live Activity Feed</h3>
            </div>
            <Link href="/activities" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline">
              View all
            </Link>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-80">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No activities logged yet.</div>
            ) : (
              recentActivities.map((act: any) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs">
                  <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    {act.type === 'CALL' && <Phone className="w-3.5 h-3.5 text-emerald-600" />}
                    {act.type === 'EMAIL' && <Mail className="w-3.5 h-3.5" />}
                    {act.type === 'WHATSAPP' && <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />}
                    {act.type === 'STAGE_CHANGE' && <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />}
                    {act.type !== 'CALL' && act.type !== 'EMAIL' && act.type !== 'WHATSAPP' && act.type !== 'STAGE_CHANGE' && <Sparkles className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 truncate">{act.title}</div>
                    <div className="text-slate-500 text-[11px] truncate">{act.description}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{formatRelativeTime(act.created_at)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
