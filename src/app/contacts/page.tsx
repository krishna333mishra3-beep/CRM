'use client';

import React, { useState } from 'react';
import {
  Contact as ContactIcon,
  Plus,
  Search,
  Phone,
  Mail,
  Building,
  Briefcase,
  Edit2,
  Trash2,
  Download,
} from 'lucide-react';
import { CrmLayout } from '@/components/layout/crm-layout';
import { useCrm } from '@/context/crm-context';
import { Contact } from '@/types/crm';
import { formatDate, downloadCsvFile } from '@/lib/utils';
import { ContactModal } from '@/components/contacts/contact-modal';

export default function ContactsPage() {
  const { contacts, deleteContact } = useCrm();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const filteredContacts = contacts.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.job_title?.toLowerCase().includes(q) ||
      c.company?.name.toLowerCase().includes(q)
    );
  });

  const handleExportCsv = () => {
    if (contacts.length === 0) return;
    const headers = 'First Name,Last Name,Email,Phone,Job Title,Company,Created\n';
    const rows = contacts
      .map(
        (c) =>
          `"${c.first_name}","${c.last_name || ''}","${c.email || ''}","${c.phone || ''}","${c.job_title || ''}","${c.company?.name || ''}","${formatDate(c.created_at)}"`
      )
      .join('\n');
    downloadCsvFile(headers + rows, 'contacts_export.csv');
  };

  return (
    <CrmLayout>
      <div className="space-y-4 max-w-7xl mx-auto pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Contacts Directory
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-semibold">
                {contacts.length} Contacts
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Individual business contacts, executive roles, and corporate affiliations
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingContact(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Contact</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search contacts by name, email, phone, job title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Contacts Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pl-5">Contact</th>
                  <th className="p-3.5">Job Title</th>
                  <th className="p-3.5">Company</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Phone</th>
                  <th className="p-3.5">Added</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 pl-5 font-semibold text-slate-900 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                        {contact.first_name.charAt(0)}
                      </div>
                      <span>{contact.full_name}</span>
                    </td>
                    <td className="p-3.5 text-slate-700">{contact.job_title || '—'}</td>
                    <td className="p-3.5 text-slate-700">
                      {contact.company?.name ? (
                        <span className="font-medium text-slate-800">{contact.company.name}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {contact.email ? (
                        <a href={`mailto:${contact.email}`} className="text-indigo-600 hover:underline">
                          {contact.email}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3.5 text-slate-600">{contact.phone || '—'}</td>
                    <td className="p-3.5 text-slate-400 text-[11px]">{formatDate(contact.created_at)}</td>
                    <td className="p-3.5 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingContact(contact);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete ${contact.full_name}?`)) deleteContact(contact.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <ContactModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          contact={editingContact}
        />
      </div>
    </CrmLayout>
  );
}
