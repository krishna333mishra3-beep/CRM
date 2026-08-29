'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Lead,
  Company,
  Contact,
  Deal,
  Payment,
  PaymentType,
  PaymentStatus,
  PaymentMethod,
  Task,
  Activity,
  Note,
  Notification,
  AuditLog,
  Pipeline,
  CustomField,
  CsvPreviewRow,
  CsvImportSummary,
} from '@/types/crm';
import { supabaseCrm } from '@/services/supabase-service';
import { useAuth } from '@/context/auth-context';
import { crmStore } from '@/services/crm-storage';
import { isValidEmail, isValidPhone } from '@/lib/utils';

export interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  notPickedLeads: number;
  interestedLeads: number;
  followUpLeads: number;
  demoLeads: number;
  unassignedLeads: number;
  followUpsDue: number;
  openDeals: number;
  wonDeals: number;
  lostDeals: number;
  pipelineValue: number;
  wonRevenue: number;
  conversionRate: string;

  // Real payment metrics
  totalSales: number;
  totalReceived: number;
  totalOutstanding: number;
  overduePaymentsCount: number;
  overduePaymentsValue: number;
  monthlyRecurringRevenue: number;

  sourceData: { name: string; value: number }[];
  pipelineDistribution: { name: string; count: number; value: number; color?: string }[];
  realTrendData: { month: string; leads: number; revenue: number }[];
  recentLeads: any[];
  recentDeals: any[];
  recentActivities: any[];
  todayFollowUps: any[];
  overdueTasks: any[];
  isLiveConnected: boolean;
  connectionError: string | null;
}

const INITIAL_STATS: DashboardStats = {
  totalLeads: 0,
  newLeads: 0,
  qualifiedLeads: 0,
  notPickedLeads: 0,
  interestedLeads: 0,
  followUpLeads: 0,
  demoLeads: 0,
  unassignedLeads: 0,
  followUpsDue: 0,
  openDeals: 0,
  wonDeals: 0,
  lostDeals: 0,
  pipelineValue: 0,
  wonRevenue: 0,
  conversionRate: '0.0%',
  totalSales: 0,
  totalReceived: 0,
  totalOutstanding: 0,
  overduePaymentsCount: 0,
  overduePaymentsValue: 0,
  monthlyRecurringRevenue: 0,
  sourceData: [],
  pipelineDistribution: [],
  realTrendData: [],
  recentLeads: [],
  recentDeals: [],
  recentActivities: [],
  todayFollowUps: [],
  overdueTasks: [],
  isLiveConnected: true,
  connectionError: null,
};

interface CrmContextType {
  // Leads
  leads: Lead[];
  allLeads: Lead[];
  totalLeads: number;
  totalPages: number;
  currentPage: number;
  fetchLeads: (filters?: any) => Promise<void>;
  createLead: (lead: any) => Promise<Lead | null>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  clearAllLeads: () => Promise<void>;
  assignLead: (leadId: string, ownerId: string) => Promise<void>;
  changeLeadStatus: (leadId: string, status: any) => Promise<void>;

  // Companies
  companies: Company[];
  fetchCompanies: (search?: string) => Promise<void>;
  createCompany: (company: any) => Promise<Company | null>;
  updateCompany: (id: string, updates: Partial<Company>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;

  // Contacts
  contacts: Contact[];
  fetchContacts: (search?: string, companyId?: string) => Promise<void>;
  createContact: (contact: any) => Promise<Contact | null>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;

  // Deals & Pipeline
  deals: Deal[];
  pipeline: Pipeline;
  fetchDeals: (pipelineId?: string) => Promise<void>;
  createDeal: (deal: any) => Promise<Deal | null>;
  updateDealStage: (dealId: string, stageId: string, stageName?: string, probability?: number) => Promise<void>;
  updateDeal: (id: string, updates: Partial<Deal>) => Promise<void>;
  deleteDeal: (id: string) => Promise<void>;

  // Payments & Payment History
  payments: Payment[];
  fetchPayments: (dealId?: string) => Promise<Payment[]>;
  createPayment: (payment: Partial<Payment>) => Promise<Payment | null>;
  deletePayment: (paymentId: string, dealId: string) => Promise<void>;

  // Tasks
  tasks: Task[];
  fetchTasks: (filter?: 'ALL' | 'OVERDUE' | 'TODAY' | 'UPCOMING' | 'COMPLETED') => Promise<void>;
  createTask: (task: any) => Promise<Task | null>;
  updateTaskStatus: (id: string, status: any) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Activities & Notes
  activities: Activity[];
  fetchActivities: (filter?: any) => Promise<void>;
  logActivity: (activity: any) => Promise<Activity | null>;
  notes: Note[];
  fetchNotes: (filter: any) => Promise<void>;
  createNote: (note: any) => Promise<Note | null>;
  deleteNote: (id: string) => Promise<void>;

  // Notifications
  notifications: Notification[];
  unreadCount: number;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  // Audit Logs
  auditLogs: AuditLog[];
  fetchAuditLogs: () => Promise<void>;

  // Custom Fields
  customFields: CustomField[];
  fetchCustomFields: (entityType?: any) => Promise<void>;
  createCustomField: (field: any) => Promise<void>;

  // Global Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: {
    leads: Lead[];
    contacts: Contact[];
    companies: Company[];
    deals: Deal[];
  };

  // CSV Import
  validateCsv: (rawRows: Record<string, string>[], mapping: Record<string, string>) => { previewRows: CsvPreviewRow[]; summary: CsvImportSummary };
  executeCsvImport: (previewRows: CsvPreviewRow[]) => Promise<CsvImportSummary>;

  // Dashboard Stats
  dashboardStats: typeof INITIAL_STATS;
  refreshAll: () => Promise<void>;
  isLoadingData: boolean;
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

export function CrmProvider({ children }: { children: React.ReactNode }) {
  const { organization, user } = useAuth();
  const orgId = organization?.id || '00000000-0000-0000-0000-000000000001';

  const [leads, setLeads] = useState<Lead[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [totalLeads, setTotalLeads] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pipeline, setPipeline] = useState<Pipeline>(crmStore.getDefaultPipeline());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [dashboardStats, setDashboardStats] = useState<typeof INITIAL_STATS>(INITIAL_STATS);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<{
    leads: Lead[];
    contacts: Contact[];
    companies: Company[];
    deals: Deal[];
  }>({ leads: [], contacts: [], companies: [], deals: [] });

  const activeFiltersRef = React.useRef<any>({ status: 'ALL', page: 1 });

  const refreshAll = useCallback(async () => {
    setIsLoadingData(true);
    try {
      // Direct live queries with Promise.allSettled
      const [leadsRes, allLeadsRes, compsRes, contsRes, pipesRes, dealsRes, paysRes, tasksRes, actsRes, logsRes, fieldsRes, statsRes] =
        await Promise.allSettled([
          supabaseCrm.getLeads(orgId, { ...activeFiltersRef.current, page: currentPage }),
          supabaseCrm.getLeads(orgId, { status: 'HISTORICAL_ALL', page: 1, pageSize: 10000 }),
          supabaseCrm.getCompanies(orgId),
          supabaseCrm.getContacts(orgId),
          supabaseCrm.getPipelines(orgId),
          supabaseCrm.getDeals(orgId),
          supabaseCrm.getPayments(orgId),
          supabaseCrm.getTasks(orgId, 'ALL'),
          supabaseCrm.getActivities(orgId),
          supabaseCrm.getAuditLogs(orgId),
          supabaseCrm.getCustomFields(orgId),
          supabaseCrm.getLiveDashboardStats(orgId),
        ]);

      if (leadsRes.status === 'fulfilled') {
        setLeads(leadsRes.value.leads || []);
        setTotalLeads(leadsRes.value.total || 0);
        setTotalPages(leadsRes.value.totalPages || 1);
      }
      if (allLeadsRes.status === 'fulfilled') {
        setAllLeads(allLeadsRes.value.leads || []);
      }
      if (compsRes.status === 'fulfilled') setCompanies(compsRes.value || []);
      if (contsRes.status === 'fulfilled') setContacts(contsRes.value || []);
      if (pipesRes.status === 'fulfilled' && pipesRes.value.length > 0) {
        setPipeline(pipesRes.value[0]);
      }
      if (dealsRes.status === 'fulfilled') setDeals(dealsRes.value || []);
      if (paysRes.status === 'fulfilled') setPayments(paysRes.value || []);
      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value || []);
      if (actsRes.status === 'fulfilled') setActivities(actsRes.value || []);
      if (logsRes.status === 'fulfilled') setAuditLogs(logsRes.value || []);
      if (fieldsRes.status === 'fulfilled') setCustomFields(fieldsRes.value || []);
      if (statsRes.status === 'fulfilled') {
        setDashboardStats(statsRes.value);
      }

      if (user?.id) {
        const notifs = await supabaseCrm.getNotifications(user.id);
        setNotifications(notifs || []);
      }
    } catch (err: any) {
      console.warn('refreshAll non-blocking exception:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [orgId, currentPage, user?.id]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Realtime Supabase Sync Across Dashboard & Leads
  useEffect(() => {
    let channel: any = null;
    try {
      channel = supabaseCrm.client
        .channel(`crm-live-${orgId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'leads',
            filter: `organization_id=eq.${orgId}`,
          },
          () => {
            refreshAll();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'deals',
            filter: `organization_id=eq.${orgId}`,
          },
          () => {
            refreshAll();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payments',
            filter: `organization_id=eq.${orgId}`,
          },
          () => {
            refreshAll();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'activities',
            filter: `organization_id=eq.${orgId}`,
          },
          () => {
            refreshAll();
          }
        )
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription non-blocking warning:', e);
    }

    return () => {
      if (channel) {
        try {
          supabaseCrm.client.removeChannel(channel);
        } catch {}
      }
    };
  }, [orgId, refreshAll]);

  // Global Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        try {
          const results = await supabaseCrm.globalSearch(orgId, searchQuery);
          setSearchResults(results);
        } catch {
          setSearchResults({ leads: [], contacts: [], companies: [], deals: [] });
        }
      } else {
        setSearchResults({ leads: [], contacts: [], companies: [], deals: [] });
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, orgId]);

  // Lead Handlers
  const fetchLeads = useCallback(async (filters?: any) => {
    try {
      if (filters) {
        activeFiltersRef.current = { ...activeFiltersRef.current, ...filters };
      }
      const res = await supabaseCrm.getLeads(orgId, activeFiltersRef.current);
      setLeads(res.leads);
      setTotalLeads(res.total);
      setTotalPages(res.totalPages);
      if (filters?.page) setCurrentPage(filters.page);
    } catch {
      setLeads([]);
    }
  }, [orgId]);

  const createLead = async (leadData: any) => {
    const created = await supabaseCrm.createLead({ ...leadData, organization_id: orgId });
    await refreshAll();
    return created;
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    await supabaseCrm.updateLead(id, updates);
    await refreshAll();
  };

  const deleteLead = async (id: string) => {
    await supabaseCrm.deleteLead(id);
    await refreshAll();
  };

  const clearAllLeads = async () => {
    await supabaseCrm.clearAllLeads(orgId);
    setLeads([]);
    setAllLeads([]);
    setTotalLeads(0);
    setTotalPages(1);
    await refreshAll();
  };

  const assignLead = async (leadId: string, ownerId: string) => {
    await updateLead(leadId, { owner_id: ownerId });
  };

  const changeLeadStatus = async (leadId: string, status: any) => {
    await updateLead(leadId, { status });
  };

  // Company Handlers
  const fetchCompanies = async (search?: string) => {
    const data = await supabaseCrm.getCompanies(orgId, search);
    setCompanies(data);
  };

  const createCompany = async (comp: any) => {
    const created = await supabaseCrm.createCompany({ ...comp, organization_id: orgId });
    await refreshAll();
    return created;
  };

  const updateCompany = async (id: string, updates: Partial<Company>) => {
    await supabaseCrm.updateCompany(id, updates);
    await refreshAll();
  };

  const deleteCompany = async (id: string) => {
    await supabaseCrm.deleteCompany(id);
    await refreshAll();
  };

  // Contact Handlers
  const fetchContacts = async (search?: string, companyId?: string) => {
    const data = await supabaseCrm.getContacts(orgId, search, companyId);
    setContacts(data);
  };

  const createContact = async (cont: any) => {
    const created = await supabaseCrm.createContact({ ...cont, organization_id: orgId });
    await refreshAll();
    return created;
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    await supabaseCrm.updateContact(id, updates);
    await refreshAll();
  };

  const deleteContact = async (id: string) => {
    await supabaseCrm.deleteContact(id);
    await refreshAll();
  };

  // Deals & Pipeline Handlers
  const fetchDeals = async (pipelineId?: string) => {
    const data = await supabaseCrm.getDeals(orgId, pipelineId);
    setDeals(data);
  };

  const createDeal = async (dl: any) => {
    const created = await supabaseCrm.createDeal({ ...dl, organization_id: orgId });
    await refreshAll();
    return created;
  };

  const updateDealStage = async (dealId: string, stageId: string, stageName?: string, probability?: number) => {
    await supabaseCrm.updateDealStage(dealId, stageId, stageName, probability);
    await refreshAll();
  };

  const updateDeal = async (id: string, updates: Partial<Deal>) => {
    await supabaseCrm.updateDeal(id, updates);
    await refreshAll();
  };

  const deleteDeal = async (id: string) => {
    await supabaseCrm.deleteDeal(id);
    await refreshAll();
  };

  // Payments Handlers
  const fetchPayments = async (dealId?: string) => {
    const data = await supabaseCrm.getPayments(orgId, dealId);
    setPayments(data);
    return data;
  };

  const createPayment = async (payment: Partial<Payment>) => {
    const created = await supabaseCrm.createPayment({ ...payment, organization_id: orgId });
    await refreshAll();
    return created;
  };

  const deletePayment = async (paymentId: string, dealId: string) => {
    await supabaseCrm.deletePayment(paymentId, dealId);
    await refreshAll();
  };

  // Task Handlers
  const fetchTasks = async (filter?: 'ALL' | 'OVERDUE' | 'TODAY' | 'UPCOMING' | 'COMPLETED') => {
    const data = await supabaseCrm.getTasks(orgId, filter);
    setTasks(data);
  };

  const createTask = async (tsk: any) => {
    const created = await supabaseCrm.createTask({ ...tsk, organization_id: orgId });
    await refreshAll();
    return created;
  };

  const updateTaskStatus = async (id: string, status: any) => {
    await supabaseCrm.updateTaskStatus(id, status);
    await refreshAll();
  };

  const deleteTask = async (id: string) => {
    await supabaseCrm.deleteTask(id);
    await refreshAll();
  };

  // Activity Handlers
  const fetchActivities = async (filter?: any) => {
    const data = await supabaseCrm.getActivities(orgId, filter);
    setActivities(data);
  };

  const logActivity = async (act: any) => {
    const created = await supabaseCrm.logActivity({ ...act, organization_id: orgId });
    await refreshAll();
    return created;
  };

  const fetchNotes = async (filter: any) => {
    const data = await supabaseCrm.getNotes(orgId, filter);
    setNotes(data);
  };

  const createNote = async (nt: any) => {
    const created = await supabaseCrm.createNote({ ...nt, organization_id: orgId });
    await refreshAll();
    return created;
  };

  const deleteNote = async (id: string) => {
    await supabaseCrm.deleteNote(id);
    await refreshAll();
  };

  // Notifications
  const markNotificationRead = async (id: string) => {
    await supabaseCrm.markNotificationRead(id);
    if (user?.id) {
      setNotifications(await supabaseCrm.getNotifications(user.id));
    }
  };

  const markAllNotificationsRead = async () => {
    if (user?.id) {
      await supabaseCrm.markAllNotificationsRead(user.id);
      setNotifications(await supabaseCrm.getNotifications(user.id));
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchAuditLogs = async () => {
    const logs = await supabaseCrm.getAuditLogs(orgId);
    setAuditLogs(logs);
  };

  const fetchCustomFields = async (entityType?: any) => {
    const fields = await supabaseCrm.getCustomFields(orgId, entityType);
    setCustomFields(fields);
  };

  const createCustomField = async (field: any) => {
    await supabaseCrm.createCustomField({ ...field, organization_id: orgId });
    await fetchCustomFields();
  };

  // CSV Validation & Import
  const validateCsv = (rawRows: Record<string, string>[], mapping: Record<string, string>) => {
    const previewRows: CsvPreviewRow[] = [];
    let validCount = 0;
    let invalidCount = 0;
    let duplicateCount = 0;
    const seenEmails = new Set<string>();
    const seenPhones = new Set<string>();

    rawRows.forEach((row, idx) => {
      const mappedData: any = {};
      const errors: string[] = [];

      Object.entries(mapping).forEach(([crmField, csvHeader]) => {
        const val = row[csvHeader]?.trim();
        if (crmField && val !== undefined && val !== '') {
          if (
            crmField === 'estimated_value' ||
            crmField === 'deal_value' ||
            crmField === 'amount_paid' ||
            crmField === 'monthly_amount'
          ) {
            mappedData[crmField] = Number(val.replace(/[^0-9.]/g, '')) || 0;
          } else if (crmField === 'payment_type') {
            const upper = val.toUpperCase().replace(/[\s-]/g, '_');
            if (upper.includes('MONTH') || upper.includes('RECUR')) {
              mappedData[crmField] = 'MONTHLY_RECURRING';
            } else {
              mappedData[crmField] = 'ONE_TIME';
            }
          } else if (crmField === 'payment_status') {
            const upper = val.toUpperCase().replace(/[\s-]/g, '_');
            if (upper.includes('PARTIAL')) mappedData[crmField] = 'PARTIALLY_PAID';
            else if (upper.includes('PAID')) mappedData[crmField] = 'PAID';
            else if (upper.includes('OVERDUE') || upper.includes('DUE')) mappedData[crmField] = 'OVERDUE';
            else mappedData[crmField] = 'PENDING';
          } else {
            mappedData[crmField] = val;
          }
        }
      });

      if (!mappedData.full_name && mappedData.first_name) {
        mappedData.full_name = `${mappedData.first_name} ${mappedData.last_name || ''}`.trim();
      }

      if (!mappedData.full_name) {
        const fallbackName = mappedData.company_name
          || (mappedData.email ? mappedData.email.split('@')[0] : null)
          || (mappedData.phone ? `Lead ${mappedData.phone}` : `Lead #${idx + 1}`);
        mappedData.full_name = fallbackName;
        mappedData.first_name = fallbackName;
      }

      let isDuplicate = false;
      let duplicateReason: string | undefined;
      let existingRecord: Lead | undefined;

      const cleanEmail = mappedData.email?.toLowerCase().trim();
      const cleanPhone = mappedData.phone ? mappedData.phone.replace(/\D/g, '') : null;

      // 1. Check against current database leads
      if (cleanEmail) {
        existingRecord = leads.find((l) => l.email?.toLowerCase().trim() === cleanEmail);
        if (existingRecord) {
          isDuplicate = true;
          duplicateReason = `Existing DB Email: ${cleanEmail}`;
        }
      }

      if (!isDuplicate && cleanPhone && cleanPhone.length >= 7) {
        existingRecord = leads.find((l) => l.phone && l.phone.replace(/\D/g, '') === cleanPhone);
        if (existingRecord) {
          isDuplicate = true;
          duplicateReason = `Existing DB Phone: ${cleanPhone}`;
        }
      }

      // 2. Check for duplicates within this uploaded CSV
      if (!isDuplicate && cleanEmail) {
        if (seenEmails.has(cleanEmail)) {
          isDuplicate = true;
          duplicateReason = `Duplicate in CSV (Email: ${cleanEmail})`;
        } else {
          seenEmails.add(cleanEmail);
        }
      }

      if (!isDuplicate && cleanPhone && cleanPhone.length >= 7) {
        if (seenPhones.has(cleanPhone)) {
          isDuplicate = true;
          duplicateReason = `Duplicate in CSV (Phone: ${cleanPhone})`;
        } else {
          seenPhones.add(cleanPhone);
        }
      }

      if (isDuplicate) {
        duplicateCount++;
      }

      if (errors.length > 0) {
        invalidCount++;
      } else {
        validCount++;
      }

      previewRows.push({
        rowNumber: idx + 1,
        rawData: row,
        mappedData,
        errors,
        isDuplicate,
        duplicateReason,
        existingRecord,
        duplicateResolution: 'skip',
      });
    });

    return {
      previewRows,
      summary: {
        totalRows: rawRows.length,
        validRows: validCount,
        invalidRows: invalidCount,
        duplicateRows: duplicateCount,
        importedRows: 0,
        skippedRows: 0,
        updatedRows: 0,
        failedRows: 0,
      },
    };
  };

  const executeCsvImport = async (previewRows: CsvPreviewRow[]) => {
    const summary = await supabaseCrm.executeRealCsvImport(orgId, previewRows);
    await refreshAll();
    return summary;
  };

  return (
    <CrmContext.Provider
      value={{
        leads,
        allLeads,
        totalLeads,
        totalPages,
        currentPage,
        fetchLeads,
        createLead,
        updateLead,
        deleteLead,
        clearAllLeads,
        assignLead,
        changeLeadStatus,

        companies,
        fetchCompanies,
        createCompany,
        updateCompany,
        deleteCompany,

        contacts,
        fetchContacts,
        createContact,
        updateContact,
        deleteContact,

        deals,
        pipeline,
        fetchDeals,
        createDeal,
        updateDealStage,
        updateDeal,
        deleteDeal,

        payments,
        fetchPayments,
        createPayment,
        deletePayment,

        tasks,
        fetchTasks,
        createTask,
        updateTaskStatus,
        deleteTask,

        activities,
        fetchActivities,
        logActivity,
        notes,
        fetchNotes,
        createNote,
        deleteNote,

        notifications,
        unreadCount,
        markNotificationRead,
        markAllNotificationsRead,

        auditLogs,
        fetchAuditLogs,

        customFields,
        fetchCustomFields,
        createCustomField,

        searchQuery,
        setSearchQuery,
        searchResults,

        validateCsv,
        executeCsvImport,

        dashboardStats,
        refreshAll,
        isLoadingData,
      }}
    >
      {children}
    </CrmContext.Provider>
  );
}

export function useCrm() {
  const context = useContext(CrmContext);
  if (!context) {
    throw new Error('useCrm must be used within a CrmProvider');
  }
  return context;
}
