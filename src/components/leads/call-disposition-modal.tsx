'use client';

import React, { useState, useEffect } from 'react';
import {
  Phone,
  PhoneOff,
  Clock,
  CheckCircle2,
  Calendar,
  X,
  Sparkles,
  AlertCircle,
  Building,
  Loader2,
} from 'lucide-react';
import { Lead } from '@/types/crm';
import { useCrm } from '@/context/crm-context';
import { useAuth } from '@/context/auth-context';

interface CallDispositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}

export function CallDispositionModal({ isOpen, onClose, lead }: CallDispositionModalProps) {
  const { updateLead, logActivity, createTask, refreshAll } = useCrm();
  const { user } = useAuth();

  // Call Lifecycle States: 'COUNTDOWN' | 'LIVE_CALL'
  const [callState, setCallState] = useState<'COUNTDOWN' | 'LIVE_CALL'>('COUNTDOWN');
  const [countdown, setCountdown] = useState(15);
  const [callSeconds, setCallSeconds] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [followUpTime, setFollowUpTime] = useState('11:00');
  const [showFollowUpPicker, setShowFollowUpPicker] = useState(false);

  // Reset state & start live call immediately when modal opens
  useEffect(() => {
    if (isOpen) {
      setCallState('LIVE_CALL');
      setCallSeconds(0);
      setIsSaving(false);
      setErrorMessage(null);
      setNotes('');
      setShowFollowUpPicker(false);
      if (lead?.phone) {
        window.location.href = `tel:${lead.phone}`;
      }
    }
  }, [isOpen, lead]);

  // Live Call Duration Timer (ONLY active during LIVE_CALL)
  useEffect(() => {
    let timer: any = null;
    if (isOpen && callState === 'LIVE_CALL') {
      timer = setInterval(() => {
        setCallSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, callState]);

  if (!isOpen || !lead) return null;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCancelCountdown = () => {
    onClose();
  };

  const handleSelectDisposition = async (disposition: 'NOT_PICKED' | 'INTERESTED' | 'FOLLOW_UP' | 'DEMO') => {
    if (isSaving) return;
    setIsSaving(true);
    setErrorMessage(null);

    try {
      // 1. Update Lead status in Supabase
      await updateLead(lead.id, {
        status: disposition,
        last_contacted_at: new Date().toISOString(),
      });

      // 2. Log Call Activity
      const dispositionNames: Record<string, string> = {
        NOT_PICKED: 'Call Not Picked / RNR',
        INTERESTED: 'Lead Interested in Proposal',
        FOLLOW_UP: `Follow-up Scheduled for ${followUpDate} at ${followUpTime}`,
        DEMO: 'Product Demo Scheduled',
      };

      await logActivity({
        type: 'CALL',
        title: `Call Outcome: ${dispositionNames[disposition]}`,
        description: notes || `Call duration: ${formatTimer(callSeconds)}. Logged by ${user?.full_name || 'Admin'}.`,
        duration_minutes: Math.max(1, Math.ceil(callSeconds / 60)),
        lead_id: lead.id,
        user_id: user?.id,
      });

      // 3. If Follow Up or Demo, create actionable task
      if (disposition === 'FOLLOW_UP' || disposition === 'DEMO') {
        await createTask({
          title: disposition === 'DEMO' ? `Product Demo: ${lead.full_name}` : `Follow-up Call: ${lead.full_name}`,
          description: `Call back ${lead.phone || ''}. Notes: ${notes || 'Discuss requirements & commercial terms.'}`,
          due_date: new Date(`${followUpDate}T${followUpTime}:00`).toISOString(),
          priority: disposition === 'DEMO' ? 'URGENT' : 'HIGH',
          status: 'PENDING',
          lead_id: lead.id,
          assigned_to: user?.id,
        });
      }

      // 4. Refresh app state & close modal on clean success
      await refreshAll();
      onClose();
    } catch (err: any) {
      console.error('Call disposition save error:', err);
      setErrorMessage(err.message || 'Database error occurred while saving disposition.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 my-6">
        
        {/* PRE-CALL COUNTDOWN STATE */}
        {callState === 'COUNTDOWN' ? (
          <div className="p-8 text-center space-y-6">
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-100 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
              <span className="text-3xl font-extrabold text-emerald-700 font-mono">{countdown}</span>
            </div>

            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
                Pre-Call Confirmation
              </span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{lead.full_name}</h3>
              <p className="text-sm font-mono text-slate-600 mt-0.5">{lead.phone || 'No Phone Number'}</p>
              <p className="text-xs text-slate-500 mt-3 font-semibold">
                Call starting in <span className="text-emerald-700 font-bold">{countdown} seconds</span>...
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleCancelCountdown}
                className="w-full py-3 px-6 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Cancel Call</span>
              </button>
            </div>
          </div>
        ) : (
          /* LIVE TELECALLER & DISPOSITION STATE */
          <>
            {/* Calling Header Banner */}
            <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-slate-900 p-6 text-white text-center relative overflow-hidden">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 rounded-full bg-emerald-500/30 border-2 border-emerald-400/60 flex items-center justify-center mx-auto mb-3 animate-pulse shadow-lg">
                <Phone className="w-8 h-8 text-white" />
              </div>

              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-200 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Live Telecaller Call</span>
              </div>

              <h3 className="text-2xl font-bold mt-1 text-white tracking-tight">{lead.full_name}</h3>
              <p className="text-sm font-mono text-emerald-100 font-semibold mt-0.5">{lead.phone || 'No Phone'}</p>
              {lead.company_name && (
                <div className="inline-flex items-center gap-1 text-xs text-emerald-200 mt-1">
                  <Building className="w-3.5 h-3.5" />
                  <span>{lead.company_name}</span>
                </div>
              )}

              {/* Call Duration Timer (Starts strictly upon LIVE_CALL) */}
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/30 border border-emerald-400/30 text-sm font-mono font-bold text-white">
                <Clock className="w-4 h-4 text-emerald-300" />
                <span>Call Duration: {formatTimer(callSeconds)}</span>
              </div>
            </div>

            {/* Error Notification if Save Fails */}
            {errorMessage && (
              <div className="p-3 mx-6 mt-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Post-Call Disposition Action Console */}
            <div className="p-6 space-y-5">
              <div className="text-center space-y-1">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Select Call Outcome / Disposition *
                </h4>
                <p className="text-xs text-slate-500">
                  Clicking an option instantly categorizes this lead, logs the call duration, and updates all dashboards.
                </p>
              </div>

              {/* 4 Large Disposition Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {/* NOT PICKED */}
                <button
                  disabled={isSaving}
                  onClick={() => handleSelectDisposition('NOT_PICKED')}
                  className="p-4 rounded-2xl border-2 border-rose-200 bg-rose-50 hover:bg-rose-100 hover:border-rose-400 text-left transition-all group flex flex-col justify-between space-y-2 disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center text-xs font-bold shadow-md">
                      <PhoneOff className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] uppercase font-bold text-rose-700 bg-rose-200/60 px-2 py-0.5 rounded">
                      RNR
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-rose-900 group-hover:text-rose-700">NOT PICKED</div>
                    <div className="text-[11px] text-rose-700">Client did not answer call</div>
                  </div>
                </button>

                {/* INTERESTED */}
                <button
                  disabled={isSaving}
                  onClick={() => handleSelectDisposition('INTERESTED')}
                  className="p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-400 text-left transition-all group flex flex-col justify-between space-y-2 disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-md">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-200/60 px-2 py-0.5 rounded">
                      Hot
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-emerald-900 group-hover:text-emerald-700">INTERESTED</div>
                    <div className="text-[11px] text-emerald-700">Client interested in proposal</div>
                  </div>
                </button>

                {/* FOLLOW UP */}
                <button
                  disabled={isSaving}
                  onClick={() => setShowFollowUpPicker(true)}
                  className="p-4 rounded-2xl border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-400 text-left transition-all group flex flex-col justify-between space-y-2 disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center text-xs font-bold shadow-md">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded">
                      Scheduled
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-amber-900 group-hover:text-amber-700">FOLLOW UP</div>
                    <div className="text-[11px] text-amber-700">Schedule callback date/time</div>
                  </div>
                </button>

                {/* DEMO */}
                <button
                  disabled={isSaving}
                  onClick={() => handleSelectDisposition('DEMO')}
                  className="p-4 rounded-2xl border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 hover:border-purple-400 text-left transition-all group flex flex-col justify-between space-y-2 disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-md">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-200/60 px-2 py-0.5 rounded">
                      High Priority
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-purple-900 group-hover:text-purple-700">DEMO</div>
                    <div className="text-[11px] text-purple-700">Product demo scheduled</div>
                  </div>
                </button>
              </div>

              {/* Follow-up Date/Time Selector when clicked */}
              {showFollowUpPicker && (
                <div className="p-3.5 rounded-2xl border border-amber-300 bg-amber-50/70 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-amber-600" /> Choose Follow-up Schedule
                    </span>
                    <button
                      onClick={() => setShowFollowUpPicker(false)}
                      disabled={isSaving}
                      className="text-amber-700 hover:text-amber-900 text-[11px]"
                    >
                      Close
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-amber-800 mb-1">Date</label>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        disabled={isSaving}
                        className="w-full bg-white border border-amber-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-amber-800 mb-1">Time</label>
                      <input
                        type="time"
                        value={followUpTime}
                        onChange={(e) => setFollowUpTime(e.target.value)}
                        disabled={isSaving}
                        className="w-full bg-white border border-amber-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                  <button
                    disabled={isSaving}
                    onClick={() => handleSelectDisposition('FOLLOW_UP')}
                    className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>{isSaving ? 'Saving Follow-up...' : 'Confirm Follow-up Schedule'}</span>
                  </button>
                </div>
              )}

              {/* Call Note Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Call Notes / Key Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  disabled={isSaving}
                  placeholder="e.g. Budget confirmed, asked for discount, demo on Friday 3 PM..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
