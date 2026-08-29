'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  TrendingUp,
  Award,
  DollarSign,
  Users,
  Calendar,
  Filter,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { useCrm } from '@/context/crm-context';
import { useAuth } from '@/context/auth-context';
import { formatCurrency } from '@/lib/utils';

export default function ReportsPage() {
  const { deals, leads, dashboardStats } = useCrm();
  const { organization, members } = useAuth();
  const [timeRange, setTimeRange] = useState('30d');

  // Dynamically calculate monthly realization from actual deals
  const monthlySalesData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const map: Record<string, { month: string; actual: number; target: number; dealsCount: number }> = {};

    deals.forEach((d) => {
      const date = d.created_at ? new Date(d.created_at) : new Date();
      const m = monthNames[date.getMonth()];
      if (!map[m]) {
        map[m] = { month: m, actual: 0, target: 50000, dealsCount: 0 };
      }
      if ((d.stage as any)?.code === 'WON' || d.probability === 100) {
        map[m].actual += Number(d.value) || 0;
        map[m].dealsCount += 1;
      }
    });

    const arr = Object.values(map);
    if (arr.length === 0) {
      return [
        { month: 'Current', actual: dashboardStats?.wonRevenue || 0, target: 50000, dealsCount: dashboardStats?.wonDeals || 0 },
      ];
    }
    return arr;
  }, [deals, dashboardStats]);

  // Dynamically calculate real team performance from deals & members
  const teamPerformance = useMemo(() => {
    return members.map((m) => {
      const userDeals = deals.filter((d) => d.owner_id === m.user_id);
      const won = userDeals.filter((d) => (d.stage as any)?.code === 'WON' || d.probability === 100);
      const revenue = won.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
      const quota = 100000;
      const attainment = quota > 0 ? ((revenue / quota) * 100).toFixed(0) : '0';

      return {
        name: m.user?.full_name || m.user?.email || 'Sales Rep',
        email: m.user?.email || '',
        role: m.role,
        dealsWon: won.length,
        revenue,
        quota,
        attainment: Number(attainment),
      };
    });
  }, [members, deals]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Analytics & Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time pipeline performance, realization vs quota targets, and sales rep leaderboards.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last Quarter</option>
            <option value="year">Year to Date</option>
          </select>
        </div>
      </div>

      {/* Top 4 Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>TOTAL WON REVENUE</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(dashboardStats?.wonRevenue || 0, organization?.currency, organization?.currency_symbol)}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {dashboardStats?.wonDeals || 0} Deals closed
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>PIPELINE TOTAL VALUE</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 mt-2">
            {formatCurrency(dashboardStats?.pipelineValue || 0, organization?.currency, organization?.currency_symbol)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            {dashboardStats?.openDeals || 0} Open pipeline deals
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>OVERALL WIN RATE</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{dashboardStats?.conversionRate || '0.0%'}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Calculated from closed opportunities</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>TOTAL PROSPECTS</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{leads.length}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Active database records</div>
        </div>
      </div>

      {/* Revenue Realization Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Monthly Realized Revenue</h3>
            <p className="text-xs text-slate-500">Actual closed deal volume aggregated from database</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 font-medium text-slate-600">
            Live Supabase Aggregation
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlySalesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
              <Tooltip
                formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
              />
              <Bar dataKey="actual" fill="#6366F1" radius={[6, 6, 0, 0]} name="Won Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Team Quota Leaderboard */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Sales Rep Performance Leaderboard</h3>
            <p className="text-xs text-slate-500">Live quota attainment and deal closures</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Account Executive</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5 text-center">Deals Closed</th>
                <th className="px-6 py-3.5">Won Revenue</th>
                <th className="px-6 py-3.5">Quota Attainment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teamPerformance.map((rep, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                      {rep.name.charAt(0)}
                    </div>
                    <div>
                      <div>{rep.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{rep.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{rep.role}</td>
                  <td className="px-6 py-4 text-center font-bold text-slate-800">{rep.dealsWon}</td>
                  <td className="px-6 py-4 font-bold text-emerald-600">
                    {formatCurrency(rep.revenue, organization?.currency, organization?.currency_symbol)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden max-w-[120px]">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(rep.attainment, 100)}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-800 text-[11px]">{rep.attainment}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
