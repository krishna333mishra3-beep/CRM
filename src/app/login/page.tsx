'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Users,
} from 'lucide-react';
import { useAuth, SYSTEM_ADMINS } from '@/context/auth-context';
import { getInitials } from '@/lib/utils';

export default function LoginPage() {
  const { signInWithEmail, user, isLoading } = useAuth();
  const router = useRouter();

  const [selectedEmail, setSelectedEmail] = useState('ekansh@firstclick.com');
  const [password, setPassword] = useState('passwordisthepassword');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleQuickLogin = async (email: string) => {
    setSelectedEmail(email);
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await signInWithEmail(email, 'passwordisthepassword');
      if (res.success) {
        router.push('/dashboard');
      } else {
        setErrorMsg(res.error || 'Failed to sign in.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await signInWithEmail(selectedEmail, password);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to sign in. Please verify credentials.');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-sky-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 text-white shadow-xl shadow-indigo-600/30 mb-2">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            First Click CRM
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Internal Sales & Telecalling Portal
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
          {/* Quick 1-Click Admin Access */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <Users className="w-4 h-4" /> 1-Click Admin Access
              </span>
              <span className="text-[10px] text-slate-500">Authorized Accounts</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {SYSTEM_ADMINS.map((admin, idx) => {
                const isSelected = selectedEmail.toLowerCase() === admin.email.toLowerCase();
                const colors = [
                  'border-indigo-500/40 bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-200',
                  'border-sky-500/40 bg-sky-950/40 hover:bg-sky-900/40 text-sky-200',
                  'border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-200',
                ];
                const badgeColor = ['bg-indigo-600', 'bg-sky-600', 'bg-emerald-600'][idx % 3];

                return (
                  <button
                    key={admin.id}
                    type="button"
                    onClick={() => handleQuickLogin(admin.email)}
                    disabled={isSubmitting}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all group ${
                      isSelected
                        ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-950/60'
                        : colors[idx % 3]
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl ${badgeColor} text-white font-bold text-xs flex items-center justify-center shadow-md`}>
                        {getInitials(admin.full_name)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {admin.full_name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {admin.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                      <span>Login</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">
              Or Sign In with Password
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="ekansh@firstclick.com"
                  value={selectedEmail}
                  onChange={(e) => setSelectedEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="passwordisthepassword"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-mono">
                Default Master Password: <span className="text-indigo-400">passwordisthepassword</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Authenticate & Enter Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>First Click Softwares Internal Authorization</span>
          </div>
        </div>
      </div>
    </div>
  );
}
