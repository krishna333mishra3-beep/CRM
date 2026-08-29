'use client';

import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  Trash2,
  Edit2,
  User,
  Users,
  Building,
} from 'lucide-react';
import { CrmLayout } from '@/components/layout/crm-layout';
import { useCrm } from '@/context/crm-context';
import { useAuth } from '@/context/auth-context';
import { Task, Priority } from '@/types/crm';
import { formatDate, getPriorityColor } from '@/lib/utils';

export default function TasksPage() {
  const { tasks, createTask, updateTaskStatus, deleteTask, leads, deals, companies } = useCrm();
  const { members } = useAuth();

  const [activeTab, setActiveTab] = useState<'ALL' | 'OVERDUE' | 'TODAY' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('HIGH');
  const [assignedTo, setAssignedTo] = useState('');
  const [leadId, setLeadId] = useState('');

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const filteredTasks = tasks.filter((t) => {
    if (activeTab === 'COMPLETED') return t.status === 'COMPLETED';
    if (t.status === 'COMPLETED') return activeTab === 'ALL';

    if (!t.due_date) return activeTab === 'ALL' || activeTab === 'UPCOMING';
    const d = new Date(t.due_date);

    if (activeTab === 'OVERDUE') return d < startOfToday;
    if (activeTab === 'TODAY') return d >= startOfToday && d <= endOfToday;
    if (activeTab === 'UPCOMING') return d > endOfToday;
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTask({
      title,
      description,
      due_date: dueDate || new Date(Date.now() + 86400000).toISOString(),
      priority,
      status: 'PENDING',
      assigned_to: assignedTo || null,
      lead_id: leadId || null,
    });

    setTitle('');
    setDescription('');
    setDueDate('');
    setIsModalOpen(false);
  };

  return (
    <CrmLayout>
      <div className="space-y-4 max-w-7xl mx-auto pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Tasks & Follow-ups
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold">
                {tasks.filter((t) => t.status !== 'COMPLETED').length} Pending
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Stay on schedule with client calls, SLAs, proposals, and pipeline tasks
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>

        {/* Filter Switcher Tabs */}
        <div className="flex rounded-xl bg-slate-200/80 p-1 border border-slate-200 text-xs font-semibold max-w-xl">
          {(['ALL', 'OVERDUE', 'TODAY', 'UPCOMING', 'COMPLETED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg transition-all ${
                activeTab === tab ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Tasks List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 divide-y divide-slate-100 space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No tasks found in this view.
            </div>
          ) : (
            filteredTasks.map((t) => {
              const priorityStyle = getPriorityColor(t.priority);
              const isOverdue = t.due_date && new Date(t.due_date) < startOfToday && t.status !== 'COMPLETED';

              return (
                <div
                  key={t.id}
                  className={`pt-3 first:pt-0 flex items-start justify-between gap-3 p-2 rounded-xl transition-colors ${
                    isOverdue ? 'bg-rose-50/40' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => updateTaskStatus(t.id, t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED')}
                      className={`mt-1 w-5 h-5 rounded border flex items-center justify-center text-xs shrink-0 transition-colors ${
                        t.status === 'COMPLETED'
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : isOverdue
                          ? 'border-rose-400 hover:bg-rose-100'
                          : 'border-slate-300 hover:border-purple-600'
                      }`}
                    >
                      {t.status === 'COMPLETED' && '✓'}
                    </button>

                    <div>
                      <h4
                        className={`text-xs font-bold ${
                          t.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {t.title}
                      </h4>
                      {t.description && (
                        <p className="text-[11px] text-slate-600 mt-0.5">{t.description}</p>
                      )}

                      <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1 flex-wrap">
                        {t.due_date && (
                          <span
                            className={`flex items-center gap-1 font-semibold ${
                              isOverdue ? 'text-rose-600' : 'text-slate-600'
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            {formatDate(t.due_date)} {isOverdue && '(Overdue)'}
                          </span>
                        )}

                        <span className={`px-1.5 py-0.2 rounded border font-semibold ${priorityStyle.bg}`}>
                          {t.priority}
                        </span>

                        {t.lead && (
                          <span className="flex items-center gap-1 text-indigo-600">
                            <Users className="w-3 h-3" /> {t.lead.full_name}
                          </span>
                        )}

                        {t.assignee && (
                          <span className="flex items-center gap-1 text-slate-600">
                            <User className="w-3 h-3" /> {t.assignee.full_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteTask(t.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Create Task Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 my-8">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-900 text-sm">Create New Task</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Schedule discovery call"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Additional context or checklist..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as Priority)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:bg-white"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Assign To</label>
                    <select
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:bg-white"
                    >
                      <option value="">Unassigned</option>
                      {members.map((m) => (
                        <option key={m.user_id} value={m.user_id}>
                          {m.user?.full_name || m.user?.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Link Lead</label>
                    <select
                      value={leadId}
                      onChange={(e) => setLeadId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:bg-white"
                    >
                      <option value="">None</option>
                      {leads.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
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
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md"
                  >
                    Save Task
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
