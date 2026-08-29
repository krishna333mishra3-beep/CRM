'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CrmLayout } from '@/components/layout/crm-layout';
import {
  MessagesSquare,
  Send,
  Sparkles,
  ShieldCheck,
  Tag,
  Clock,
  PhoneCall,
  Flame,
  AlertCircle,
  CheckCircle2,
  Users,
  Search,
  RefreshCw,
} from 'lucide-react';
import { useAuth, SYSTEM_ADMINS } from '@/context/auth-context';
import { AdminMessage } from '@/types/crm';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import { supabaseCrm } from '@/services/supabase-service';
import { createClient } from '@/lib/supabase/client';

export default function AdminsRoomPage() {
  const { user, organization } = useAuth();
  const orgId = organization?.id || '00000000-0000-0000-0000-000000000001';

  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedTag, setSelectedTag] = useState<'GENERAL' | 'URGENT' | 'DEAL_UPDATE' | 'CALL_DISPOSITION' | 'LEAD_NOTE'>('GENERAL');
  const [filterTag, setFilterTag] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const data = await supabaseCrm.getAdminMessages(orgId);
      setMessages(data || []);
    } catch (err) {
      console.warn('Failed to load admin messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Supabase Realtime Subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('admin_messages_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'admin_messages', filter: `organization_id=eq.${orgId}` },
        (payload) => {
          if (payload.new) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === payload.new.id)) return prev;
              return [...prev, payload.new as AdminMessage];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const payload: Partial<AdminMessage> = {
      organization_id: orgId,
      sender_id: user?.id || 'u_admin',
      sender_name: user?.full_name || 'Admin',
      sender_email: user?.email || 'admin@firstclick.com',
      message: inputMessage.trim(),
      tag: selectedTag,
      created_at: new Date().toISOString(),
    };

    setInputMessage('');
    const sent = await supabaseCrm.sendAdminMessage(payload);
    if (sent) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
    }
  };

  const filteredMessages = messages.filter((m) => {
    const matchesTag = filterTag === 'ALL' || m.tag === filterTag;
    const matchesSearch =
      m.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sender_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  return (
    <CrmLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <MessagesSquare className="w-4 h-4" />
              Realtime Admin Broadcast & Operations Room
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Admins Command Room</h1>
            <p className="text-xs text-slate-300">
              Live operational sync between <span className="text-white font-semibold">Ekansh</span>, <span className="text-white font-semibold">Kuldeep</span>, and <span className="text-white font-semibold">Shreyash</span>.
            </p>
          </div>

          {/* Active Presence Indicators */}
          <div className="flex items-center gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
            <div className="text-[11px] font-bold text-slate-300 pr-2 border-r border-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Online Admins:</span>
            </div>
            <div className="flex items-center gap-1.5">
              {SYSTEM_ADMINS.map((adm) => {
                const isYou = user?.email.toLowerCase() === adm.email.toLowerCase();
                return (
                  <div
                    key={adm.id}
                    className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                      isYou ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    <span>{adm.full_name}</span>
                    {isYou && <span className="text-[10px] text-indigo-200">(You)</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chat & Broadcast Console */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
          {/* Filter Bar */}
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              {['ALL', 'URGENT', 'DEAL_UPDATE', 'CALL_DISPOSITION', 'LEAD_NOTE', 'GENERAL'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(tag)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    filterTag === tag
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {tag.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-48 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search updates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={() => fetchMessages()}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-indigo-600"
                title="Refresh messages"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-20 text-slate-400 text-xs space-y-2">
                <MessagesSquare className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-600">No updates yet.</p>
                <p className="text-[11px] text-slate-400">Post a message below to broadcast live updates to all admins.</p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isCurrentUser = user?.email.toLowerCase() === msg.sender_email.toLowerCase();
                const tagColors: Record<string, string> = {
                  URGENT: 'bg-rose-100 text-rose-800 border-rose-300',
                  DEAL_UPDATE: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                  CALL_DISPOSITION: 'bg-purple-100 text-purple-800 border-purple-300',
                  LEAD_NOTE: 'bg-amber-100 text-amber-800 border-amber-300',
                  GENERAL: 'bg-slate-100 text-slate-700 border-slate-200',
                };

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${
                      isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-9 h-9 rounded-xl text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md ${
                        msg.sender_name.includes('Ekansh')
                          ? 'bg-indigo-600'
                          : msg.sender_name.includes('Kuldeep')
                          ? 'bg-sky-600'
                          : 'bg-emerald-600'
                      }`}
                    >
                      {getInitials(msg.sender_name)}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`max-w-xl rounded-2xl p-4 shadow-sm space-y-1.5 ${
                        isCurrentUser
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[11px]">
                        <div className="font-bold flex items-center gap-1.5">
                          <span>{msg.sender_name}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold ${
                              isCurrentUser
                                ? 'bg-indigo-700 text-indigo-100 border-indigo-500'
                                : tagColors[msg.tag || 'GENERAL']
                            }`}
                          >
                            {msg.tag}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] ${
                            isCurrentUser ? 'text-indigo-200' : 'text-slate-400'
                          }`}
                        >
                          {formatRelativeTime(msg.created_at)}
                        </span>
                      </div>

                      <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-indigo-500" /> Tag:
              </span>
              {(['GENERAL', 'URGENT', 'DEAL_UPDATE', 'CALL_DISPOSITION', 'LEAD_NOTE'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTag(t)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border transition-all ${
                    selectedTag === t
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                required
                placeholder={`Post a live update to all admins as ${user?.full_name || 'Admin'}...`}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>Broadcast</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </CrmLayout>
  );
}
