'use client';

import React, { useState } from 'react';
import {
  History,
  Phone,
  Mail,
  MessageSquare,
  Users,
  Building,
  TrendingUp,
  Plus,
  Filter,
  Search,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { CrmLayout } from '@/components/layout/crm-layout';
import { useCrm } from '@/context/crm-context';
import { ActivityType } from '@/types/crm';
import { formatRelativeTime, formatDate } from '@/lib/utils';

const ACTIVITY_TYPES: { id: ActivityType | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'All Activities' },
  { id: 'CALL', label: 'Phone Calls' },
  { id: 'EMAIL', label: 'Emails' },
  { id: 'WHATSAPP', label: 'WhatsApp' },
  { id: 'MEETING', label: 'Meetings' },
  { id: 'STATUS_CHANGE', label: 'Status Updates' },
  { id: 'STAGE_CHANGE', label: 'Stage Changes' },
  { id: 'NOTE', label: 'Notes' },
];

function getActivityIcon(type: ActivityType) {
  switch (type) {
    case 'CALL':
      return <Phone className="w-4 h-4 text-emerald-600" />;
    case 'EMAIL':
      return <Mail className="w-4 h-4 text-indigo-600" />;
    case 'WHATSAPP':
      return <MessageSquare className="w-4 h-4 text-emerald-500" />;
    case 'STAGE_CHANGE':
      return <TrendingUp className="w-4 h-4 text-amber-500" />;
    default:
      return <Sparkles className="w-4 h-4 text-indigo-500" />;
  }
}

export default function ActivitiesPage() {
  const { activities, logActivity, leads, deals } = useCrm();

  const [selectedType, setSelectedType] = useState<ActivityType | 'ALL'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [type, setType] = useState<ActivityType>('CALL');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [leadId, setLeadId] = useState('');

  const filteredActivities = activities.filter((a) => {
    if (selectedType !== 'ALL' && a.type !== selectedType) return false;
    return true;
  });

  const handleLogActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    logActivity({
      type,
      title,
      description,
      lead_id: leadId || null,
    });

    setTitle('');
    setDescription('');
    setIsModalOpen(false);
  };

  return (
    <CrmLayout>
      <div className="space-y-4 max-w-5xl mx-auto pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Activity History & Timeline
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-semibold">
                {activities.length} Events
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive chronological log of calls, meetings, stage movements, and interactions
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Log Activity</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {ACTIVITY_TYPES.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedType(item.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedType === item.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Timeline List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {filteredActivities.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">No activities match your filter.</div>
            ) : (
              filteredActivities.map((act) => (
                <div key={act.id} className="relative group">
                  <div className="absolute -left-6 top-1 w-6 h-6 rounded-full bg-white border-2 border-indigo-500 text-indigo-600 flex items-center justify-center shadow-sm">
                    {getActivityIcon(act.type)}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{act.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold uppercase">
                          {act.type.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">{formatRelativeTime(act.created_at)}</span>
                    </div>

                    {act.description && <p className="text-xs text-slate-600">{act.description}</p>}

                    <div className="text-[10px] text-slate-400 pt-1 flex items-center gap-2">
                      <span>Logged by {act.user?.full_name || 'Team'}</span>
                      <span>•</span>
                      <span>{formatDate(act.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Log Activity Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 my-8">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-900 text-sm">Log New Activity</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              </div>

              <form onSubmit={handleLogActivity} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Interaction Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ActivityType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:bg-white"
                  >
                    <option value="CALL">Phone Call</option>
                    <option value="EMAIL">Email Sent/Received</option>
                    <option value="WHATSAPP">WhatsApp Message</option>
                    <option value="MEETING">Customer Meeting</option>
                    <option value="NOTE">Quick Note</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Discussed pricing discount"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Summary & Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Provide details about key topics and next steps..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Associate with Lead</label>
                  <select
                    value={leadId}
                    onChange={(e) => setLeadId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:bg-white"
                  >
                    <option value="">None</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.full_name} ({l.company_name || 'Individual'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md"
                  >
                    Save Activity
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </CrmLayout>
  );
}
