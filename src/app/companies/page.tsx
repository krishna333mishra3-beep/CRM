'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Building2,
  Plus,
  Search,
  Globe,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Users,
  Edit2,
  Trash2,
  Download,
} from 'lucide-react';
import { CrmLayout } from '@/components/layout/crm-layout';
import { useCrm } from '@/context/crm-context';
import { useAuth } from '@/context/auth-context';
import { Company } from '@/types/crm';
import { formatCurrency, formatDate, downloadCsvFile } from '@/lib/utils';
import { CompanyModal } from '@/components/companies/company-modal';

function CompaniesContent() {
  const { companies, deleteCompany } = useCrm();
  const { organization } = useAuth();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setEditingCompany(null);
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const filteredCompanies = (Array.isArray(companies) ? companies : []).filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.industry?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q)
    );
  });

  const handleExportCsv = () => {
    if (companies.length === 0) return;
    const headers = 'Company Name,Industry,Website,Phone,Email,City,Country,Deals Count,Total Value\n';
    const rows = companies
      .map(
        (c) =>
          `"${c.name}","${c.industry || ''}","${c.website || ''}","${c.phone || ''}","${c.email || ''}","${c.city || ''}","${c.country || ''}","${c.deals_count || 0}","${c.deals_value || 0}"`
      )
      .join('\n');
    downloadCsvFile(headers + rows, 'companies_export.csv');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Companies & Accounts
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
              {(Array.isArray(companies) ? companies : []).length} Accounts
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage client organizations, linked contacts, and active deals
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingCompany(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Company</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
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
            placeholder="Search companies by name, industry, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Companies Grid & Empty State */}
      {filteredCompanies.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-8 space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto text-2xl shadow-inner">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">No Companies Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Start by adding client organizations and business partners to manage linked deals and contacts.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingCompany(null);
              setIsModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Company</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold text-base shrink-0">
                      {c.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{c.name}</h3>
                      <span className="text-[11px] text-indigo-600 font-medium truncate block">{c.industry || 'General Business'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingCompany(c);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${c.name}?`)) deleteCompany(c.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  {c.website && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a href={c.website} target="_blank" rel="noreferrer" className="hover:underline text-indigo-600 truncate">
                        {c.website.replace('https://', '')}
                      </a>
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                  {(c.city || c.country) && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{c.city}{c.city && c.country ? ', ' : ''}{c.country}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50/60 p-2.5 rounded-xl">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Deals</div>
                  <div className="font-bold text-slate-800">{c.deals_count || 0} Deals</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Deal Volume</div>
                  <div className="font-bold text-emerald-700">
                    {formatCurrency(c.deals_value || 0, organization?.currency, organization?.currency_symbol)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CompanyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        company={editingCompany}
      />
    </div>
  );
}

export default function CompaniesPage() {
  return (
    <CrmLayout>
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Companies...</div>}>
        <CompaniesContent />
      </Suspense>
    </CrmLayout>
  );
}
