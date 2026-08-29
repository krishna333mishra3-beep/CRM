'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  Mail,
  Building,
  Calendar,
  DollarSign,
  User,
  Plus,
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  TrendingUp,
  Tag,
  Share2,
} from 'lucide-react';
import { CrmLayout } from '@/components/layout/crm-layout';
import { useCrm } from '@/context/crm-context';
import { useAuth } from '@/context/auth-context';
import { LeadStatus, Priority, ActivityType } from '@/types/crm';
import { formatCurrency, formatDate, formatRelativeTime, getStatusColor, getPriorityColor, getInitials } from '@/lib/utils';
import { crmStore } from '@/services/crm-storage';
import { CallDispositionModal } from '@/components/leads/call-disposition-modal';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const {
    leads,
    updateLead,
    deleteLead,
    assignLead,
    changeLeadStatus,
    activities,
    logActivity,
    notes,
    createNote,
    tasks,
    createTask,
    updateTaskStatus,
    createDeal,
  } = useCrm();

  const { members, organization } = useAuth();
  const lead = leads.find((l) => l.id === leadId) || crmStore.getLeadById(leadId);

  const [activeTab, setActiveTab] = useState<'timeline' | 'tasks' | 'notes'>('timeline');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('HIGH');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  if (!lead) {
    return (
      <CrmLayout>
        <div className="text-center py-16 space-y-3">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">Lead Not Found</h2>
          <p className="text-xs text-slate-500">The lead you are looking for does not exist or was deleted.</p>
          <Link
            href="/leads"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Leads
          </Link>
        </div>
      </CrmLayout>
    );
  }

  const statusStyle = getStatusColor(lead.status);
  const priorityStyle = getPriorityColor(lead.priority);
  const leadActivities = activities.filter((a) => a.lead_id === lead.id);
  const leadTasks = tasks.filter((t) => t.lead_id === lead.id);
  const leadNotes = notes.filter((n) => n.lead_id === lead.id);

  const handleQuickAction = (type: ActivityType, title: string, desc?: string) => {
    logActivity({
      type,
      title,
      description: desc,
      lead_id: lead.id,
    });
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    await createNote({
      content: newNoteContent.trim(),
      lead_id: lead.id,
    });
    setNewNoteContent('');
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDueDate) return;

    await createTask({
      title: taskTitle.trim(),
      due_date: new Date(taskDueDate).toISOString(),
      priority: taskPriority,
      status: 'PENDING',
      lead_id: lead.id,
    });

    setTaskTitle('');
    setTaskDueDate('');
    setIsAddingTask(false);
  };

  const handleConvertToDeal = async () => {
    await createDeal({
      name: `${lead.full_name} - Enterprise Deal`,
      value: lead.estimated_value || 50000,
      lead_id: lead.id,
      company_id: lead.company_id,
      contact_id: lead.contact_id,
      stage_id: 's1',
      probability: 20,
      source: lead.source,
      priority: lead.priority,
      expected_close_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      notes: `Converted from lead ${lead.full_name}. Notes: ${lead.notes || 'None'}`,
    });
    updateLead(lead.id, { status: 'DEMO' });
    router.push(`/deals`);
  };

  return (
    <CrmLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Back Link */}
        <div>
          <Link
            href="/leads"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to all leads</span>
          </Link>
        </div>

        {/* Lead Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold text-xl flex items-center justify-center shadow-md">
              {getInitials(lead.full_name)}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{lead.full_name}</h1>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                  {lead.status.replace('_', ' ')}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${priorityStyle.bg}`}>
                  {lead.priority} Priority
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <span>{lead.company_name || 'Individual Lead'}</span>
                <span>•</span>
                <span>Source: {lead.source}</span>
                <span>•</span>
                <span>Added {formatDate(lead.created_at)}</span>
              </p>
            </div>
          </div>

          {/* Top Actions: Convert to Deal & Status dropdown */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleConvertToDeal}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Convert to Deal</span>
            </button>
            <select
              value={lead.status}
              onChange={(e) => changeLeadStatus(lead.id, e.target.value as LeadStatus)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {['NEW', 'CONTACTED', 'NOT_PICKED', 'INTERESTED', 'FOLLOW_UP', 'DEMO', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'].map((st) => (
                <option key={st} value={st}>
                  Status: {st.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Communication Action Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setIsCallModalOpen(true)}
            className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>Call & Log Disposition</span>
          </button>

          <a
            href={lead.phone ? `https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleQuickAction('WHATSAPP', 'WhatsApp conversation initiated', `Sent WhatsApp message to ${lead.phone}.`)}
            className="p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4 text-emerald-500" />
            <span>WhatsApp</span>
          </a>

          <a
            href={lead.email ? `mailto:${lead.email}` : '#'}
            onClick={() => handleQuickAction('EMAIL', 'Email dispatched', `Sent email to ${lead.email}.`)}
            className="p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4 text-indigo-600" />
            <span>Send Email</span>
          </a>

          <button
            onClick={() => setIsAddingTask(true)}
            className="p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Add Follow-up Task</span>
          </button>
        </div>

        {/* Lead Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Properties */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
                Lead Properties
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Phone Number</span>
                  <div className="font-semibold text-slate-800 font-mono flex items-center gap-2">
                    <span>{lead.phone || '—'}</span>
                    {lead.phone && (
                      <button
                        onClick={() => setIsCallModalOpen(true)}
                        className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]"
                      >
                        CALL
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Email Address</span>
                  <div className="font-semibold text-slate-800">{lead.email || '—'}</div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Company</span>
                  <div className="font-semibold text-slate-800">{lead.company_name || '—'}</div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Estimated Deal Value</span>
                  <div className="font-extrabold text-slate-900 text-sm">
                    {formatCurrency(lead.estimated_value, organization?.currency, organization?.currency_symbol)}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Admin Assigned</span>
                  <select
                    value={lead.owner_id || ''}
                    onChange={(e) => assignLead(lead.id, e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.user?.full_name || m.user?.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* General Notes Box */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">Lead Overview Notes</h3>
              <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                {lead.notes || 'No description provided.'}
              </p>
            </div>
          </div>

          {/* Right Column: Activity Stream, Notes & Tasks */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'timeline'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Activity Timeline ({leadActivities.length})
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'notes'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Notes ({leadNotes.length})
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'tasks'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Tasks ({leadTasks.length})
              </button>
            </div>

            {/* Tab: Timeline */}
            {activeTab === 'timeline' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Historical Timeline</h3>

                <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                  {leadActivities.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      No activities logged for this lead yet.
                    </div>
                  ) : (
                    leadActivities.map((act) => (
                      <div key={act.id} className="relative pl-8 flex items-start gap-3 text-xs">
                        <span className="absolute left-2 top-1 w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-white shadow-sm"></span>
                        <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                          <div className="flex items-center justify-between font-bold text-slate-800">
                            <span>{act.title}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {formatRelativeTime(act.created_at)}
                            </span>
                          </div>
                          {act.description && (
                            <p className="text-slate-600 text-[11px] leading-relaxed">{act.description}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab: Notes */}
            {activeTab === 'notes' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <form onSubmit={handleCreateNote} className="space-y-2">
                  <textarea
                    rows={3}
                    placeholder="Write a private note or call summary for the team..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="text-right">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 ml-auto"
                    >
                      <Send className="w-3.5 h-3.5" /> Post Note
                    </button>
                  </div>
                </form>

                <div className="space-y-2.5 divide-y divide-slate-100">
                  {leadNotes.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">No notes written yet.</div>
                  ) : (
                    leadNotes.map((nt) => (
                      <div key={nt.id} className="pt-2.5 first:pt-0 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-semibold text-slate-700">
                            {nt.author?.full_name || 'Admin'}
                          </span>
                          <span>{formatRelativeTime(nt.created_at)}</span>
                        </div>
                        <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                          {nt.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab: Tasks */}
            {activeTab === 'tasks' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                {isAddingTask ? (
                  <form onSubmit={handleCreateTask} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800">Schedule New Task</h4>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Call back for contract signing..."
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        required
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <select
                        value={taskPriority}
                        onChange={(e) => setTaskPriority(e.target.value as Priority)}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        <option value="LOW">Low Priority</option>
                        <option value="MEDIUM">Medium Priority</option>
                        <option value="HIGH">High Priority</option>
                        <option value="URGENT">Urgent Priority</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingTask(false)}
                        className="px-3 py-1.5 rounded-lg text-slate-600 text-xs hover:bg-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                      >
                        Save Task
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsAddingTask(true)}
                    className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:text-indigo-600 hover:border-indigo-400 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Add Task for this Lead
                  </button>
                )}

                <div className="space-y-2">
                  {leadTasks.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">No tasks created yet.</div>
                  ) : (
                    leadTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            onClick={() => updateTaskStatus(t.id, t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED')}
                            className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                              t.status === 'COMPLETED'
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 bg-white text-transparent hover:border-indigo-500'
                            }`}
                          >
                            ✓
                          </button>
                          <span className={`font-semibold truncate ${t.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {t.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          Due {formatDate(t.due_date)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Call & Disposition Modal */}
      <CallDispositionModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        lead={lead}
      />
    </CrmLayout>
  );
}
