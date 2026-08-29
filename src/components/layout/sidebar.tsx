'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Contact,
  Building2,
  DollarSign,
  KanbanSquare,
  CheckSquare,
  History,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  MessagesSquare,
  UserCheck,
} from 'lucide-react';
import { useAuth, SYSTEM_ADMINS } from '@/context/auth-context';
import { cn, getInitials } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Admins Room', href: '/admins-room', icon: MessagesSquare, badge: 'Live' },
  { name: 'Contacts', href: '/contacts', icon: Contact },
  { name: 'Companies', href: '/companies', icon: Building2 },
  { name: 'Deals', href: '/deals', icon: DollarSign },
  { name: 'Pipeline', href: '/pipeline', icon: KanbanSquare },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Activities', href: '/activities', icon: History },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const pathname = usePathname();
  const { user, organization, signOut, switchUser } = useAuth();

  return (
    <aside className="w-64 bg-[#0B0F19] text-slate-200 flex flex-col h-full border-r border-slate-800/80 select-none shrink-0">
      {/* Brand & Organization Header */}
      <div className="p-4 border-b border-slate-800/80">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-900/40 text-white font-extrabold text-lg shrink-0 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-white tracking-tight text-base leading-tight flex items-center gap-1.5">
              First Click <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-mono font-bold border border-indigo-500/30">CRM</span>
            </div>
            <div className="text-xs text-slate-400 truncate max-w-[140px] mt-0.5 font-medium">
              {organization?.name || 'First Click Softwares'}
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-3.5 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-2 flex items-center justify-between">
          <span>WORKSPACE</span>
          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            ONLINE
          </span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onCloseMobile}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative',
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              )}
            >
              <Icon className={cn('w-4 h-4 transition-transform group-hover:scale-110 shrink-0', isActive ? 'text-white' : 'text-slate-400 group-hover:text-white')} />
              <span className="flex-1 truncate">{item.name}</span>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                  {item.badge}
                </span>
              )}
              {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80 shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom User Card & Real Admin Switcher */}
      <div className="p-3 border-t border-slate-800/80 bg-[#080C14] space-y-2.5">
        {/* Active Logged Admin */}
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-md shrink-0">
            {getInitials(user?.full_name || 'Ekansh')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white truncate flex items-center gap-1">
              {user?.full_name || 'Ekansh'}
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline shrink-0" />
            </div>
            <div className="text-[10px] text-slate-400 truncate font-mono">{user?.email || 'ekansh@firstclick.com'}</div>
          </div>
        </div>



        <button
          onClick={() => signOut()}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors border border-rose-900/30 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
