'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Bell,
  Plus,
  Users,
  Building2,
  Contact,
  DollarSign,
  CheckSquare,
  X,
  Clock,
  Menu,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useCrm } from '@/context/crm-context';
import { formatCurrency, formatRelativeTime, getInitials } from '@/lib/utils';

export function Topbar({ onToggleMobile }: { onToggleMobile?: () => void }) {
  const { user, organization } = useAuth();
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useCrm();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const quickAddRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (quickAddRef.current && !quickAddRef.current.contains(event.target as Node)) {
        setIsQuickAddOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalSearchResults =
    searchResults.leads.length +
    searchResults.contacts.length +
    searchResults.companies.length +
    searchResults.deals.length;

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile Menu Toggle & Workspace Pill */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-none cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100/90 py-1.5 px-3 rounded-full border border-slate-200/80 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-900 font-bold">{organization?.name || 'First Click Softwares'}</span>
          <span className="text-slate-400">•</span>
          <span className="text-indigo-600 font-medium">{user?.full_name || 'Ekansh'}</span>
        </div>
      </div>

      {/* Center: Global Search Bar with Ctrl+K */}
      <div ref={searchRef} className="relative flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Search leads, contacts, companies, deals... (Ctrl + K)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-8 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Global Search Results Dropdown */}
        {isSearchOpen && searchQuery.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 max-h-[480px] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Found {totalSearchResults} matching results</span>
              <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200">ESC to close</span>
            </div>

            {totalSearchResults === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No matching leads, contacts, companies or deals found for &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {/* Leads */}
                {searchResults.leads.length > 0 && (
                  <div className="p-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-600" /> Leads ({searchResults.leads.length})
                    </div>
                    {searchResults.leads.map((lead) => (
                      <Link
                        key={lead.id}
                        href={`/leads/${lead.id}`}
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{lead.full_name}</div>
                          <div className="text-[11px] text-slate-500">{lead.company_name || lead.email || lead.phone}</div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                          {lead.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Contacts */}
                {searchResults.contacts.length > 0 && (
                  <div className="p-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center gap-1.5">
                      <Contact className="w-3.5 h-3.5 text-sky-600" /> Contacts ({searchResults.contacts.length})
                    </div>
                    {searchResults.contacts.map((contact) => (
                      <Link
                        key={contact.id}
                        href={`/contacts`}
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{contact.full_name}</div>
                          <div className="text-[11px] text-slate-500">{contact.job_title} • {contact.email}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Companies */}
                {searchResults.companies.length > 0 && (
                  <div className="p-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-600" /> Companies ({searchResults.companies.length})
                    </div>
                    {searchResults.companies.map((company) => (
                      <Link
                        key={company.id}
                        href={`/companies`}
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{company.name}</div>
                          <div className="text-[11px] text-slate-500">{company.industry} • {company.city}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Deals */}
                {searchResults.deals.length > 0 && (
                  <div className="p-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Deals ({searchResults.deals.length})
                    </div>
                    {searchResults.deals.map((deal) => (
                      <Link
                        key={deal.id}
                        href={`/deals`}
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{deal.name}</div>
                          <div className="text-[11px] text-slate-500">{deal.company?.name || 'Individual'}</div>
                        </div>
                        <span className="font-bold text-emerald-600">
                          {formatCurrency(deal.total_amount ?? deal.value)}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: + Create, Notifications, User Avatar */}
      <div className="flex items-center gap-2.5">
        {/* + Create Quick Action */}
        <div ref={quickAddRef} className="relative">
          <button
            onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create</span>
          </button>

          {isQuickAddOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 font-semibold">
              <Link
                href="/leads?action=create"
                onClick={() => setIsQuickAddOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                <Users className="w-4 h-4 text-indigo-600" />
                <span>New Lead</span>
              </Link>
              <Link
                href="/deals?action=create"
                onClick={() => setIsQuickAddOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
              >
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>New Deal</span>
              </Link>
              <Link
                href="/contacts?action=create"
                onClick={() => setIsQuickAddOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
              >
                <Contact className="w-4 h-4 text-sky-600" />
                <span>New Contact</span>
              </Link>
              <Link
                href="/companies?action=create"
                onClick={() => setIsQuickAddOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-amber-50 hover:text-amber-600 transition-colors"
              >
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>New Company</span>
              </Link>
              <Link
                href="/tasks?action=create"
                onClick={() => setIsQuickAddOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-purple-50 hover:text-purple-600 transition-colors border-t border-slate-100"
              >
                <CheckSquare className="w-4 h-4 text-purple-600" />
                <span>New Task</span>
              </Link>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95">
              <div className="p-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="font-bold text-xs text-slate-900">Notifications ({notifications.length})</div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 font-medium">No notifications yet.</div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationRead(notif.id)}
                      className={`p-3 text-left transition-colors cursor-pointer hover:bg-slate-50 ${
                        !notif.is_read ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs font-bold text-slate-900">{notif.title}</div>
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1"></span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">{notif.message}</div>
                      <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(notif.created_at)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <Link href="/settings" className="flex items-center gap-2 pl-1">
          <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-sm hover:scale-105 transition-transform">
            {getInitials(user?.full_name || 'Ekansh')}
          </div>
        </Link>
      </div>
    </header>
  );
}
