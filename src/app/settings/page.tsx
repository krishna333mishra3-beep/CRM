'use client';

import React, { useState } from 'react';
import {
  Settings,
  Users,
  Building,
  Shield,
  FileCode,
  History,
  Plus,
  Trash2,
  Check,
  Globe,
  DollarSign,
  Lock,
  Mail,
  UserCheck,
} from 'lucide-react';
import { CrmLayout } from '@/components/layout/crm-layout';
import { useAuth } from '@/context/auth-context';
import { useCrm } from '@/context/crm-context';
import { Role, CustomField } from '@/types/crm';
import { formatDate, formatDateTime, formatRelativeTime } from '@/lib/utils';

const ROLES: Role[] = ['Owner', 'Admin', 'Manager', 'Sales Executive', 'Employee', 'Viewer'];

export default function SettingsPage() {
  const { organization, updateOrganization, members, user } = useAuth();
  const { auditLogs, customFields, createCustomField } = useCrm();

  const [activeTab, setActiveTab] = useState<'organization' | 'team' | 'custom_fields' | 'audit_logs'>('organization');

  // Organization settings state
  const [orgName, setOrgName] = useState(organization?.name || 'First Click Softwares');
  const [orgEmail, setOrgEmail] = useState(organization?.email || 'admin@firstclick.com');
  const [orgPhone, setOrgPhone] = useState(organization?.phone || '+91 98765 43210');
  const [currency, setCurrency] = useState(organization?.currency || 'INR');
  const [currencySymbol, setCurrencySymbol] = useState(organization?.currency_symbol || '₹');
  const [isSavingOrg, setIsSavingOrg] = useState(false);
  const [orgSavedMessage, setOrgSavedMessage] = useState(false);

  // Invite user state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('Sales Executive');

  // Custom field builder state
  const [isCustomFieldModalOpen, setIsCustomFieldModalOpen] = useState(false);
  const [cfEntityType, setCfEntityType] = useState<'lead' | 'contact' | 'company' | 'deal'>('lead');
  const [cfName, setCfName] = useState('');
  const [cfLabel, setCfLabel] = useState('');
  const [cfType, setCfType] = useState<CustomField['field_type']>('TEXT');
  const [cfOptions, setCfOptions] = useState('');

  const handleSaveOrganization = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingOrg(true);
    updateOrganization({
      name: orgName,
      email: orgEmail,
      phone: orgPhone,
      currency,
      currency_symbol: currencySymbol,
    });
    setIsSavingOrg(false);
    setOrgSavedMessage(true);
    setTimeout(() => setOrgSavedMessage(false), 3000);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    // Call storage add member
    const { crmStore } = require('@/services/crm-storage');
    crmStore.addMember(inviteEmail, inviteRole, inviteName);
    setInviteEmail('');
    setInviteName('');
    setIsInviteModalOpen(false);
  };

  const handleCreateCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfName.trim() || !cfLabel.trim()) return;
    createCustomField({
      entity_type: cfEntityType,
      name: cfName.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      label: cfLabel,
      field_type: cfType,
      options: cfOptions ? cfOptions.split(',').map((s) => s.trim()) : [],
      is_required: false,
    });
    setCfName('');
    setCfLabel('');
    setCfOptions('');
    setIsCustomFieldModalOpen(false);
  };

  return (
    <CrmLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Top Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            CRM Workspace Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure company branding, team permissions, custom metadata fields, and audit compliance
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-xl bg-slate-200/80 p-1 border border-slate-200 text-xs font-semibold max-w-2xl">
          <button
            onClick={() => setActiveTab('organization')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'organization' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Organization</span>
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'team' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team & Roles</span>
          </button>
          <button
            onClick={() => setActiveTab('custom_fields')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'custom_fields' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Custom Fields</span>
          </button>
          <button
            onClick={() => setActiveTab('audit_logs')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'audit_logs' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Logs</span>
          </button>
        </div>

        {/* TAB 1: ORGANIZATION SETTINGS */}
        {activeTab === 'organization' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Organization Profile</h3>
              <p className="text-xs text-slate-500">Workspace name, currency symbol, and contact info</p>
            </div>

            {orgSavedMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Settings saved successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveOrganization} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Organization Name</label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Support Email</label>
                  <input
                    type="email"
                    value={orgEmail}
                    onChange={(e) => setOrgEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={orgPhone}
                    onChange={(e) => setOrgPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Currency Code</label>
                  <select
                    value={currency}
                    onChange={(e) => {
                      setCurrency(e.target.value);
                      if (e.target.value === 'INR') setCurrencySymbol('₹');
                      else if (e.target.value === 'EUR') setCurrencySymbol('€');
                      else if (e.target.value === 'GBP') setCurrencySymbol('£');
                      else setCurrencySymbol('$');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingOrg}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition-colors"
                >
                  {isSavingOrg ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: TEAM & PERMISSIONS */}
        {activeTab === 'team' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Team Members & Permissions</h3>
                <p className="text-xs text-slate-500">Manage user access and assigned CRM roles</p>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Invite User</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 pl-5">Member</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Assigned Role</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="p-3.5 pl-5 font-semibold text-slate-900 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                          {m.user?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{m.user?.full_name}</div>
                          <div className="text-[10px] text-slate-400">{m.user?.title || m.role}</div>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600">{m.user?.email}</td>
                      <td className="p-3.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                          {m.role}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 text-[11px]">{formatDate(m.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Invite Modal */}
            {isInviteModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-900 text-sm">Invite Team Member</h3>
                    <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-400">✕</button>
                  </div>
                  <form onSubmit={handleInviteSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        placeholder="Sarah Jenkins"
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="sarah@company.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as Role)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div className="pt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsInviteModalOpen(false)}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-xl shadow"
                      >
                        Send Invitation
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CUSTOM FIELDS */}
        {activeTab === 'custom_fields' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Custom Field Definitions</h3>
                <p className="text-xs text-slate-500">Extend Leads, Contacts, Companies and Deals with custom attributes</p>
              </div>
              <button
                onClick={() => setIsCustomFieldModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom Field</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {customFields.map((cf) => (
                <div key={cf.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{cf.label}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                      {cf.entity_type}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">key: {cf.name}</div>
                  <div className="text-xs text-slate-600">Type: <span className="font-semibold uppercase">{cf.field_type}</span></div>
                  {cf.options && cf.options.length > 0 && (
                    <div className="text-[11px] text-slate-500 pt-1">
                      Options: {cf.options.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Custom Field Modal */}
            {isCustomFieldModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-900 text-sm">Add Custom CRM Field</h3>
                    <button onClick={() => setIsCustomFieldModalOpen(false)} className="text-slate-400">✕</button>
                  </div>
                  <form onSubmit={handleCreateCustomField} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Target Entity</label>
                      <select
                        value={cfEntityType}
                        onChange={(e) => setCfEntityType(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white"
                      >
                        <option value="lead">Lead</option>
                        <option value="contact">Contact</option>
                        <option value="company">Company</option>
                        <option value="deal">Deal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Field Label *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Contract Duration"
                        value={cfLabel}
                        onChange={(e) => {
                          setCfLabel(e.target.value);
                          setCfName(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'));
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Field Type</label>
                      <select
                        value={cfType}
                        onChange={(e) => setCfType(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white"
                      >
                        <option value="TEXT">Text String</option>
                        <option value="NUMBER">Number</option>
                        <option value="DATE">Date</option>
                        <option value="BOOLEAN">Yes / No Boolean</option>
                        <option value="SELECT">Dropdown Select</option>
                      </select>
                    </div>
                    {cfType === 'SELECT' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Options (comma separated)</label>
                        <input
                          type="text"
                          placeholder="Option A, Option B, Option C"
                          value={cfOptions}
                          onChange={(e) => setCfOptions(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white"
                        />
                      </div>
                    )}
                    <div className="pt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCustomFieldModalOpen(false)}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-xl shadow"
                      >
                        Create Field
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: AUDIT LOGS */}
        {activeTab === 'audit_logs' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Security & Change Audit Logs</h3>
              <p className="text-xs text-slate-500">Immutable audit trail of CRM record modifications</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 pl-5">Timestamp</th>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">Entity</th>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-3.5 pl-5 text-slate-500 font-mono text-[11px]">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 font-semibold">{log.entity_type}</td>
                      <td className="p-3.5 text-slate-700">{log.user?.full_name || 'System'}</td>
                      <td className="p-3.5 text-slate-500 font-mono text-[10px] truncate max-w-xs">
                        {JSON.stringify(log.metadata || {})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </CrmLayout>
  );
}
