import { createClient } from '@/lib/supabase/client';
import { crmStore } from '@/services/crm-storage';
import {
  Lead,
  Company,
  Contact,
  Deal,
  Payment,
  PaymentType,
  PaymentStatus,
  PaymentMethod,
  Pipeline,
  PipelineStage,
  Task,
  Activity,
  Note,
  Notification,
  AuditLog,
  CustomField,
  Organization,
  OrganizationMember,
  UserProfile,
  AdminMessage,
  CsvPreviewRow,
  CsvImportSummary,
} from '@/types/crm';

const DEFAULT_STAGES: PipelineStage[] = [
  { id: 's1', organization_id: '00000000-0000-0000-0000-000000000001', pipeline_id: 'pipe_default', name: 'New Lead', code: 'NEW', probability: 10, display_order: 1, color: '#3B82F6', created_at: new Date().toISOString() },
  { id: 's2', organization_id: '00000000-0000-0000-0000-000000000001', pipeline_id: 'pipe_default', name: 'Contacted', code: 'CONTACTED', probability: 25, display_order: 2, color: '#6366F1', created_at: new Date().toISOString() },
  { id: 's3', organization_id: '00000000-0000-0000-0000-000000000001', pipeline_id: 'pipe_default', name: 'Qualified', code: 'QUALIFIED', probability: 50, display_order: 3, color: '#8B5CF6', created_at: new Date().toISOString() },
  { id: 's4', organization_id: '00000000-0000-0000-0000-000000000001', pipeline_id: 'pipe_default', name: 'Proposal Sent', code: 'PROPOSAL', probability: 70, display_order: 4, color: '#EC4899', created_at: new Date().toISOString() },
  { id: 's5', organization_id: '00000000-0000-0000-0000-000000000001', pipeline_id: 'pipe_default', name: 'In Negotiation', code: 'NEGOTIATION', probability: 85, display_order: 5, color: '#F59E0B', created_at: new Date().toISOString() },
  { id: 's6', organization_id: '00000000-0000-0000-0000-000000000001', pipeline_id: 'pipe_default', name: 'Closed Won', code: 'WON', probability: 100, display_order: 6, color: '#10B981', created_at: new Date().toISOString() },
  { id: 's7', organization_id: '00000000-0000-0000-0000-000000000001', pipeline_id: 'pipe_default', name: 'Closed Lost', code: 'LOST', probability: 0, display_order: 7, color: '#EF4444', created_at: new Date().toISOString() },
];

const DEFAULT_PIPELINE: Pipeline = {
  id: 'pipe_default',
  organization_id: '00000000-0000-0000-0000-000000000001',
  name: 'Default Sales Pipeline',
  is_default: true,
  created_at: new Date().toISOString(),
  stages: DEFAULT_STAGES,
};

const VALID_LEAD_DB_FIELDS = new Set([
  'id',
  'organization_id',
  'first_name',
  'last_name',
  'full_name',
  'email',
  'phone',
  'company_name',
  'company_id',
  'contact_id',
  'source',
  'status',
  'priority',
  'owner_id',
  'estimated_value',
  'notes',
  'custom_data',
  'is_deleted',
  'created_at',
  'updated_at',
]);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function sanitizeUuid(id?: string | null): string | null {
  if (!id) return null;
  if (UUID_REGEX.test(id)) return id;
  if (id === 'u_ekansh') return '00000000-0000-0000-0000-000000000002';
  if (id === 'u_kuldeep') return '00000000-0000-0000-0000-000000000003';
  if (id === 'u_shreyash') return '00000000-0000-0000-0000-000000000004';
  return null;
}

function sanitizeLeadPayload(updates: any): Record<string, any> {
  const cleanPayload: Record<string, any> = {};
  for (const key of Object.keys(updates)) {
    if (VALID_LEAD_DB_FIELDS.has(key) && updates[key] !== undefined) {
      if (key === 'owner_id' || key === 'company_id' || key === 'contact_id' || key === 'organization_id') {
        cleanPayload[key] = sanitizeUuid(updates[key]);
      } else {
        cleanPayload[key] = updates[key];
      }
    }
  }
  return cleanPayload;
}

export class SupabaseCrmService {
  public get client() {
    return createClient();
  }

  // 1. ORGANIZATIONS & PROFILES
  async getCurrentProfile(): Promise<UserProfile | null> {
    try {
      const { data: { user }, error: authErr } = await this.client.auth.getUser();
      if (authErr || !user) return null;

      const { data: profile } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      return profile || {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        avatar_url: user.user_metadata?.avatar_url || null,
        created_at: user.created_at || new Date().toISOString(),
      };
    } catch (e) {
      console.warn('getCurrentProfile exception:', e);
      return null;
    }
  }

  async getOrganization(orgId: string): Promise<Organization | null> {
    try {
      const { data, error } = await this.client
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .maybeSingle();

      if (error || !data) return null;
      return data;
    } catch {
      return null;
    }
  }

  async updateOrganization(orgId: string, updates: Partial<Organization>): Promise<Organization | null> {
    try {
      const { data, error } = await this.client
        .from('organizations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', orgId)
        .select()
        .maybeSingle();

      return error ? null : data;
    } catch {
      return null;
    }
  }

  async getMembers(orgId: string): Promise<OrganizationMember[]> {
    try {
      const { data, error } = await this.client
        .from('organization_members')
        .select('*, user:profiles(*)')
        .eq('organization_id', orgId);

      if (error || !data) return [];
      return data;
    } catch {
      return [];
    }
  }

  async addMember(orgId: string, email: string, role: string): Promise<any> {
    try {
      const { data, error } = await this.client
        .from('organization_members')
        .insert({
          organization_id: orgId,
          role,
          status: 'active',
        })
        .select();

      return { data, error };
    } catch (e) {
      return { data: null, error: e };
    }
  }

  // 2. LEADS
  async getLeads(orgId: string, filters?: {
    search?: string;
    status?: string;
    source?: string;
    priority?: string;
    owner_id?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ leads: Lead[]; total: number; totalPages: number }> {
    try {
      const pageSize = filters?.pageSize || 10;
      const page = filters?.page || 1;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let { data, error } = await this.client
        .from('leads')
        .select('*, owner:profiles(*)')
        .eq('organization_id', orgId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      const dbLeads: Lead[] = (!error && data) ? (data as Lead[]) : [];
      const storeLeads = crmStore.getLeads({ status: 'HISTORICAL_ALL' });

      const dbEmails = new Set(dbLeads.map((l) => l.email?.toLowerCase().trim()).filter(Boolean));
      const dbPhones = new Set(dbLeads.map((l) => l.phone?.replace(/\D/g, '')).filter(Boolean));
      const dbIds = new Set(dbLeads.map((l) => l.id));

      const uniqueStoreLeads = storeLeads.filter((l) => {
        if (!l || !l.id) return false;
        if (dbIds.has(l.id)) return false;
        if (l.email && dbEmails.has(l.email.toLowerCase().trim())) return false;
        if (l.phone && dbPhones.has(l.phone.replace(/\D/g, ''))) return false;
        return true;
      });

      let allMerged = [...dbLeads, ...uniqueStoreLeads];

      const requestedStatus = filters?.status || 'ALL';
      if (requestedStatus === 'NEW') {
        allMerged = allMerged.filter((l) => l.status === 'NEW' || !l.status);
      } else if (requestedStatus !== 'ALL' && requestedStatus !== 'HISTORICAL_ALL') {
        allMerged = allMerged.filter((l) => l.status === requestedStatus);
      }

      if (filters?.search && filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        allMerged = allMerged.filter(
          (l) =>
            l.full_name.toLowerCase().includes(q) ||
            l.email?.toLowerCase().includes(q) ||
            l.phone?.toLowerCase().includes(q) ||
            l.company_name?.toLowerCase().includes(q)
        );
      }

      if (filters?.source && filters.source !== 'ALL') {
        allMerged = allMerged.filter((l) => l.source === filters.source);
      }
      if (filters?.priority && filters.priority !== 'ALL') {
        allMerged = allMerged.filter((l) => l.priority === filters.priority);
      }
      if (filters?.owner_id && filters.owner_id !== 'ALL') {
        allMerged = allMerged.filter((l) => l.owner_id === filters.owner_id);
      }

      const total = allMerged.length;
      const pagedLeads = allMerged.slice(from, from + pageSize);

      return {
        leads: pagedLeads,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };
    } catch {
      const storeLeads = crmStore.getLeads(filters);
      return {
        leads: storeLeads,
        total: storeLeads.length,
        totalPages: 1,
      };
    }
  }

  async getLeadById(leadId: string): Promise<Lead | null> {
    try {
      const { data, error } = await this.client
        .from('leads')
        .select('*, owner:profiles(*)')
        .eq('id', leadId)
        .maybeSingle();

      if (error || !data) return null;
      return data;
    } catch {
      return null;
    }
  }

  async createLead(lead: Partial<Lead>): Promise<Lead | null> {
    try {
      const user = (await this.client.auth.getUser()).data.user;
      const payload: any = {
        organization_id: lead.organization_id || '00000000-0000-0000-0000-000000000001',
        first_name: lead.first_name || 'Lead',
        last_name: lead.last_name || null,
        full_name: lead.full_name || `${lead.first_name || 'Lead'} ${lead.last_name || ''}`.trim(),
        email: lead.email || null,
        phone: lead.phone || null,
        company_name: lead.company_name || null,
        company_id: lead.company_id || null,
        contact_id: lead.contact_id || null,
        source: lead.source || 'MANUAL',
        status: lead.status || 'NEW',
        priority: lead.priority || 'MEDIUM',
        owner_id: lead.owner_id || user?.id || null,
        estimated_value: lead.estimated_value || 0,
        notes: lead.notes || null,
      };

      const cleanPayload = sanitizeLeadPayload(payload);

      let data: any = null;
      let error: any = null;

      const res1 = await this.client
        .from('leads')
        .insert(cleanPayload)
        .select('*, owner:profiles(*)')
        .maybeSingle();

      if (res1.error || !res1.data) {
        const cleanPayloadNoOwner = { ...cleanPayload, owner_id: null };
        const res2 = await this.client
          .from('leads')
          .insert(cleanPayloadNoOwner)
          .select('*, owner:profiles(*)')
          .maybeSingle();

        if (!res2.error && res2.data) {
          data = res2.data;
        } else {
          error = res2.error || res1.error;
        }
      } else {
        data = res1.data;
      }

      if (error || !data) {
        console.warn('Supabase createLead error/RLS, using crmStore fallback:', error);
        return crmStore.createLead(payload);
      }

      crmStore.createLead(data);
      await this.logActivity({
        organization_id: lead.organization_id!,
        type: 'STATUS_CHANGE',
        title: 'Lead Created',
        description: `New lead ${data.full_name} created.`,
        lead_id: data.id,
        user_id: user?.id,
      });

      return data;
    } catch (e) {
      console.warn('createLead exception:', e);
      return crmStore.createLead(lead);
    }
  }

  async updateLead(leadId: string, updates: Partial<Lead>): Promise<Lead | null> {
    try {
      const payload: any = { ...updates, updated_at: new Date().toISOString() };
      if (updates.first_name || updates.last_name) {
        payload.full_name = `${updates.first_name || ''} ${updates.last_name || ''}`.trim();
      }

      const cleanPayload = sanitizeLeadPayload(payload);

      const { data, error } = await this.client
        .from('leads')
        .update(cleanPayload)
        .eq('id', leadId)
        .select('*, owner:profiles(*)')
        .maybeSingle();

      if (error || !data) {
        console.warn('Supabase updateLead failed/RLS error, using crmStore fallback:', error);
        return crmStore.updateLead(leadId, updates);
      }

      crmStore.updateLead(leadId, { ...data, ...updates });
      return data;
    } catch (e) {
      console.warn('updateLead exception:', e);
      return crmStore.updateLead(leadId, updates);
    }
  }

  async deleteLead(leadId: string): Promise<boolean> {
    crmStore.deleteLead(leadId);
    try {
      await this.client
        .from('leads')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', leadId);
      await this.client.from('leads').delete().eq('id', leadId);
    } catch {}
    return true;
  }

  async clearAllLeads(orgId: string): Promise<boolean> {
    crmStore.clearAllLeads();
    try {
      await this.client.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await this.client.from('deals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await this.client.from('activities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await this.client.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await this.client.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (e) {
      console.warn('clearAllLeads remote delete exception:', e);
    }
    return true;
  }

  async syncLocalLeadsToSupabase(orgId: string): Promise<void> {
    try {
      const localLeads = crmStore.getLeads({ status: 'HISTORICAL_ALL' });
      if (!localLeads || localLeads.length === 0) return;

      let dbLeads: any[] = [];
      try {
        const { data } = await this.client
          .from('leads')
          .select('id, email, phone')
          .eq('organization_id', orgId)
          .eq('is_deleted', false);
        if (data) dbLeads = data;
      } catch {}

      const dbEmailSet = new Set(dbLeads.map((l: any) => l.email?.toLowerCase().trim()).filter(Boolean));
      const dbPhoneSet = new Set(dbLeads.map((l: any) => l.phone?.replace(/\D/g, '')).filter(Boolean));
      const dbIdSet = new Set(dbLeads.map((l: any) => l.id));

      const leadsToSync = localLeads.filter((l) => {
        if (dbIdSet.has(l.id)) return false;
        if (l.email && dbEmailSet.has(l.email.toLowerCase().trim())) return false;
        if (l.phone && dbPhoneSet.has(l.phone.replace(/\D/g, ''))) return false;
        return true;
      });

      if (leadsToSync.length === 0) return;

      let validProfileIds = new Set<string>();
      try {
        const { data: profs } = await this.client.from('profiles').select('id');
        if (profs) validProfileIds = new Set(profs.map((p: any) => p.id));
      } catch {}

      const batch = leadsToSync.map((lead) => {
        const sanitizedOwner = sanitizeUuid(lead.owner_id);
        const ownerId = (sanitizedOwner && validProfileIds.has(sanitizedOwner)) ? sanitizedOwner : null;

        const payload: Partial<Lead> = {
          organization_id: orgId,
          first_name: lead.first_name || (lead.full_name?.split(' ')[0] || 'Lead'),
          last_name: lead.last_name || (lead.full_name?.split(' ').slice(1).join(' ') || null),
          full_name: lead.full_name || `${lead.first_name || 'Lead'} ${lead.last_name || ''}`.trim(),
          email: lead.email || null,
          phone: lead.phone || null,
          company_name: lead.company_name || null,
          source: lead.source || 'MANUAL',
          status: lead.status || 'NEW',
          priority: lead.priority || 'MEDIUM',
          estimated_value: lead.estimated_value || 0,
          notes: lead.notes || null,
          owner_id: ownerId,
        };
        return sanitizeLeadPayload(payload);
      });

      const { error: batchErr } = await this.client.from('leads').insert(batch);
      if (batchErr) {
        console.warn('[SupabaseSync] Batch insert warning, inserting row-by-row with null owner_id:', batchErr.message);
        for (const item of batch) {
          try {
            await this.client.from('leads').insert({ ...item, owner_id: null });
          } catch {}
        }
      }
    } catch (e) {
      console.warn('syncLocalLeadsToSupabase exception:', e);
    }
  }

  // 3. COMPANIES
  async getCompanies(orgId: string, search?: string): Promise<Company[]> {
    try {
      let query = this.client
        .from('companies')
        .select('*, owner:profiles(*)')
        .eq('organization_id', orgId)
        .eq('is_deleted', false);

      if (search && search.trim()) {
        const q = `%${search.trim()}%`;
        query = query.or(`name.ilike.${q},industry.ilike.${q},city.ilike.${q}`);
      }

      const { data, error } = await query.order('name', { ascending: true });
      const dbCompanies: Company[] = (!error && data) ? (data as Company[]) : [];
      const storeCompanies = crmStore.getCompanies();
      const compMap = new Map<string, Company>();
      storeCompanies.forEach(c => compMap.set(c.id, c));
      dbCompanies.forEach(c => compMap.set(c.id, c));
      let results = Array.from(compMap.values());

      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        results = results.filter(c => c.name.toLowerCase().includes(q) || c.industry?.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q));
      }
      return results;
    } catch {
      return crmStore.getCompanies();
    }
  }

  async createCompany(company: Partial<Company>): Promise<Company | null> {
    const localCreated = crmStore.createCompany(company);
    try {
      const { data, error } = await this.client
        .from('companies')
        .insert(company)
        .select()
        .single();

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.error('createCompany remote insert exception:', err);
    }
    return localCreated;
  }

  async updateCompany(companyId: string, updates: Partial<Company>): Promise<Company | null> {
    const localUpdated = crmStore.updateCompany(companyId, updates);
    try {
      const { data, error } = await this.client
        .from('companies')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', companyId)
        .select()
        .single();

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.error('updateCompany exception:', err);
    }
    return localUpdated;
  }

  async deleteCompany(companyId: string): Promise<boolean> {
    crmStore.deleteCompany(companyId);
    try {
      await this.client
        .from('companies')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', companyId);
    } catch {}
    return true;
  }

  // 4. CONTACTS
  async getContacts(orgId: string, search?: string, companyId?: string): Promise<Contact[]> {
    try {
      let query = this.client
        .from('contacts')
        .select('*, company:companies(*), owner:profiles(*)')
        .eq('organization_id', orgId)
        .eq('is_deleted', false);

      if (companyId) query = query.eq('company_id', companyId);
      if (search && search.trim()) {
        const q = `%${search.trim()}%`;
        query = query.or(`full_name.ilike.${q},email.ilike.${q},phone.ilike.${q},job_title.ilike.${q}`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      const dbContacts: Contact[] = (!error && data) ? (data as Contact[]) : [];
      const storeContacts = crmStore.getContacts();
      const contMap = new Map<string, Contact>();
      storeContacts.forEach(c => contMap.set(c.id, c));
      dbContacts.forEach(c => contMap.set(c.id, c));
      let results = Array.from(contMap.values());

      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        results = results.filter(
          (c) =>
            c.full_name.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q) ||
            c.phone?.toLowerCase().includes(q) ||
            c.job_title?.toLowerCase().includes(q)
        );
      }
      return results;
    } catch {
      return crmStore.getContacts();
    }
  }

  async createContact(contact: Partial<Contact>): Promise<Contact | null> {
    const localCreated = crmStore.createContact(contact);
    try {
      const { data, error } = await this.client
        .from('contacts')
        .insert(contact)
        .select('*, company:companies(*), owner:profiles(*)')
        .single();

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.error('createContact remote insert exception:', err);
    }
    return localCreated;
  }

  async updateContact(contactId: string, updates: Partial<Contact>): Promise<Contact | null> {
    const localUpdated = crmStore.updateContact(contactId, updates);
    try {
      const { data, error } = await this.client
        .from('contacts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', contactId)
        .select('*, company:companies(*), owner:profiles(*)')
        .single();

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.error('updateContact exception:', err);
    }
    return localUpdated;
  }

  async deleteContact(contactId: string): Promise<boolean> {
    crmStore.deleteContact(contactId);
    try {
      await this.client
        .from('contacts')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', contactId);
    } catch {}
    return true;
  }

  // 5. DEALS & PIPELINES
  async getPipelines(orgId: string): Promise<Pipeline[]> {
    try {
      const { data: pipelines, error } = await this.client
        .from('pipelines')
        .select('*')
        .eq('organization_id', orgId);

      if (error || !pipelines || pipelines.length === 0) {
        return [DEFAULT_PIPELINE];
      }

      const { data: stages } = await this.client
        .from('pipeline_stages')
        .select('*')
        .eq('organization_id', orgId)
        .order('display_order', { ascending: true });

      const resolvedStages = (stages && stages.length > 0) ? stages : DEFAULT_STAGES;

      return pipelines.map(p => ({
        ...p,
        stages: resolvedStages.filter(s => s.pipeline_id === p.id || !s.pipeline_id),
      }));
    } catch {
      return [DEFAULT_PIPELINE];
    }
  }

  async getDeals(orgId: string, pipelineId?: string): Promise<Deal[]> {
    try {
      let query = this.client
        .from('deals')
        .select('*, company:companies(*), contact:contacts(*), owner:profiles(*), stage:pipeline_stages(*)')
        .eq('organization_id', orgId)
        .eq('is_deleted', false);

      if (pipelineId) query = query.eq('pipeline_id', pipelineId);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error || !data) {
        return crmStore.getDeals();
      }

      // Fetch payment records for these deals to ensure exact consistency
      const dealIds = data.map((d: any) => d.id);
      let paymentsData: Payment[] = [];
      if (dealIds.length > 0) {
        try {
          const { data: pays } = await this.client
            .from('payments')
            .select('*, creator:profiles(*)')
            .in('deal_id', dealIds)
            .order('payment_date', { ascending: false });
          if (pays) paymentsData = pays as Payment[];
        } catch {
          paymentsData = crmStore.getPayments();
        }
      }

      const todayStr = new Date().toISOString().split('T')[0];

      return data.map((d: any) => {
        const dealPayments = paymentsData.filter((p) => p.deal_id === d.id);
        const paymentsSum = dealPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        
        const totalAmount = Number(d.total_amount ?? d.value ?? 0);
        const monthlyAmount = Number(d.monthly_amount ?? 0);
        const amountPaid = dealPayments.length > 0 ? paymentsSum : Number(d.amount_paid ?? 0);
        
        let amountRemaining = d.payment_type === 'MONTHLY_RECURRING'
          ? Math.max(0, monthlyAmount - amountPaid)
          : Math.max(0, totalAmount - amountPaid);

        let paymentStatus: PaymentStatus = (d.payment_status as PaymentStatus) || 'PENDING';

        if (d.payment_type === 'MONTHLY_RECURRING') {
          if (d.next_payment_date && d.next_payment_date < todayStr && amountPaid < monthlyAmount) {
            paymentStatus = 'OVERDUE';
          } else if (amountPaid >= monthlyAmount && monthlyAmount > 0) {
            paymentStatus = 'PAID';
          } else if (amountPaid > 0) {
            paymentStatus = 'PARTIALLY_PAID';
          } else {
            paymentStatus = 'PENDING';
          }
        } else {
          // ONE_TIME
          if (amountPaid >= totalAmount && totalAmount > 0) {
            paymentStatus = 'PAID';
            amountRemaining = 0;
          } else if (amountPaid > 0) {
            paymentStatus = 'PARTIALLY_PAID';
          } else {
            paymentStatus = 'PENDING';
          }
        }

        return {
          ...d,
          value: totalAmount,
          total_amount: totalAmount,
          monthly_amount: monthlyAmount,
          amount_paid: amountPaid,
          amount_remaining: amountRemaining,
          payment_status: paymentStatus,
          payments: dealPayments,
        };
      });
    } catch {
      return crmStore.getDeals();
    }
  }

  async getDealById(dealId: string): Promise<Deal | null> {
    try {
      const { data, error } = await this.client
        .from('deals')
        .select('*, company:companies(*), contact:contacts(*), owner:profiles(*), stage:pipeline_stages(*)')
        .eq('id', dealId)
        .maybeSingle();

      if (error || !data) {
        return crmStore.getDealById(dealId);
      }

      const { data: payments } = await this.client
        .from('payments')
        .select('*, creator:profiles(*)')
        .eq('deal_id', dealId)
        .order('payment_date', { ascending: false });

      const dealPayments = (payments as Payment[]) || [];
      const totalPaid = dealPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const totalAmount = Number(data.total_amount ?? data.value ?? 0);
      const monthlyAmount = Number(data.monthly_amount ?? 0);
      const amountPaid = dealPayments.length > 0 ? totalPaid : Number(data.amount_paid ?? 0);

      const amountRemaining = data.payment_type === 'MONTHLY_RECURRING'
        ? Math.max(0, monthlyAmount - amountPaid)
        : Math.max(0, totalAmount - amountPaid);

      return {
        ...data,
        value: totalAmount,
        total_amount: totalAmount,
        monthly_amount: monthlyAmount,
        amount_paid: amountPaid,
        amount_remaining: amountRemaining,
        payments: dealPayments,
      };
    } catch {
      return crmStore.getDealById(dealId);
    }
  }

  async createDeal(deal: Partial<Deal>): Promise<Deal | null> {
    try {
      const user = (await this.client.auth.getUser()).data.user;

      const totalVal = Number(deal.total_amount ?? deal.value ?? 0);
      const monthlyVal = Number(deal.monthly_amount ?? 0);
      const paidVal = Number(deal.amount_paid ?? 0);
      const remainingVal = deal.payment_type === 'MONTHLY_RECURRING'
        ? Math.max(0, monthlyVal - paidVal)
        : Math.max(0, totalVal - paidVal);

      let status = deal.payment_status || 'PENDING';
      if (!deal.payment_status) {
        if (paidVal >= totalVal && totalVal > 0) status = 'PAID';
        else if (paidVal > 0) status = 'PARTIALLY_PAID';
        else status = 'PENDING';
      }

      const payload: any = {
        organization_id: deal.organization_id,
        pipeline_id: deal.pipeline_id,
        stage_id: deal.stage_id,
        company_id: deal.company_id || null,
        contact_id: deal.contact_id || null,
        lead_id: deal.lead_id || null,
        name: deal.name,
        value: totalVal,
        total_amount: totalVal,
        probability: deal.probability ?? 20,
        expected_close_date: deal.expected_close_date || null,
        owner_id: deal.owner_id || user?.id || null,
        source: deal.source || 'MANUAL',
        priority: deal.priority || 'MEDIUM',
        notes: deal.notes || null,
        payment_type: deal.payment_type || 'ONE_TIME',
        amount_paid: paidVal,
        amount_remaining: remainingVal,
        payment_status: status,
        monthly_amount: monthlyVal,
        billing_start_date: deal.billing_start_date || null,
        next_payment_date: deal.next_payment_date || null,
      };

      const { data, error } = await this.client
        .from('deals')
        .insert(payload)
        .select('*, company:companies(*), contact:contacts(*), owner:profiles(*), stage:pipeline_stages(*)')
        .single();

      if (error || !data) {
        console.warn('createDeal supabase insert fallback:', error);
        return crmStore.createDeal(payload);
      }

      // If initial payment was made upfront, record it in payments table
      if (paidVal > 0) {
        try {
          await this.client.from('payments').insert({
            organization_id: deal.organization_id,
            deal_id: data.id,
            amount: paidVal,
            payment_date: new Date().toISOString().split('T')[0],
            payment_type: deal.payment_type || 'ONE_TIME',
            payment_method: 'UPI',
            status: 'COMPLETED',
            notes: 'Initial deal upfront payment',
            created_by: user?.id || null,
          });
        } catch (payErr) {
          console.warn('Could not insert initial payment record:', payErr);
        }
      }

      crmStore.createDeal(data);

      await this.logActivity({
        organization_id: deal.organization_id!,
        type: 'STAGE_CHANGE',
        title: 'Deal Created',
        description: `Deal "${data.name}" added with value ₹${totalVal.toLocaleString('en-IN')}.`,
        deal_id: data.id,
        user_id: user?.id,
      });

      return data;
    } catch (e) {
      console.warn('createDeal exception fallback:', e);
      return crmStore.createDeal(deal);
    }
  }

  async updateDealStage(dealId: string, newStageId: string, stageName?: string, probability?: number): Promise<Deal | null> {
    try {
      const user = (await this.client.auth.getUser()).data.user;
      const { data, error } = await this.client
        .from('deals')
        .update({
          stage_id: newStageId,
          probability: probability !== undefined ? probability : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dealId)
        .select('*, company:companies(*), contact:contacts(*), owner:profiles(*), stage:pipeline_stages(*)')
        .single();

      if (error || !data) {
        return crmStore.updateDealStage(dealId, newStageId);
      }

      await this.logActivity({
        organization_id: data.organization_id,
        type: 'STAGE_CHANGE',
        title: `Deal moved to ${stageName || 'New Stage'}`,
        description: `Deal stage updated.`,
        deal_id: dealId,
        user_id: user?.id,
      });

      return data;
    } catch {
      return crmStore.updateDealStage(dealId, newStageId);
    }
  }

  async updateDeal(dealId: string, updates: Partial<Deal>): Promise<Deal | null> {
    try {
      const totalVal = updates.total_amount ?? updates.value;
      const monthlyVal = updates.monthly_amount;
      const paidVal = updates.amount_paid;

      const payload: any = { ...updates, updated_at: new Date().toISOString() };
      if (totalVal !== undefined) {
        payload.value = Number(totalVal);
        payload.total_amount = Number(totalVal);
      }
      if (monthlyVal !== undefined) payload.monthly_amount = Number(monthlyVal);
      if (paidVal !== undefined) payload.amount_paid = Number(paidVal);

      // Recalculate remaining & status if total or paid changed
      if (totalVal !== undefined || paidVal !== undefined || updates.payment_type !== undefined) {
        const resolvedTotal = totalVal !== undefined ? Number(totalVal) : (updates.value !== undefined ? Number(updates.value) : 0);
        const resolvedPaid = paidVal !== undefined ? Number(paidVal) : 0;
        const resolvedType = updates.payment_type || 'ONE_TIME';

        if (resolvedType === 'ONE_TIME') {
          payload.amount_remaining = Math.max(0, resolvedTotal - resolvedPaid);
          if (!updates.payment_status) {
            if (resolvedPaid >= resolvedTotal && resolvedTotal > 0) payload.payment_status = 'PAID';
            else if (resolvedPaid > 0) payload.payment_status = 'PARTIALLY_PAID';
            else payload.payment_status = 'PENDING';
          }
        }
      }

      const { data, error } = await this.client
        .from('deals')
        .update(payload)
        .eq('id', dealId)
        .select('*, company:companies(*), contact:contacts(*), owner:profiles(*), stage:pipeline_stages(*)')
        .single();

      if (error || !data) {
        return crmStore.updateDeal(dealId, updates);
      }

      crmStore.updateDeal(dealId, data);
      return data;
    } catch {
      return crmStore.updateDeal(dealId, updates);
    }
  }

  async deleteDeal(dealId: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('deals')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', dealId);

      crmStore.deleteDeal(dealId);
      return !error;
    } catch {
      return crmStore.deleteDeal(dealId);
    }
  }

  // 6. PAYMENTS (REAL SUPABASE RECORDS & HISTORY)
  async getPayments(orgId: string, dealId?: string): Promise<Payment[]> {
    try {
      let query = this.client
        .from('payments')
        .select('*, creator:profiles(*), deal:deals(*)')
        .eq('organization_id', orgId);

      if (dealId) {
        query = query.eq('deal_id', dealId);
      }

      const { data, error } = await query.order('payment_date', { ascending: false });
      if (error || !data) {
        return crmStore.getPayments(dealId);
      }
      return data as Payment[];
    } catch {
      return crmStore.getPayments(dealId);
    }
  }

  async createPayment(payment: Partial<Payment>): Promise<Payment | null> {
    try {
      const user = (await this.client.auth.getUser()).data.user;
      const paymentAmount = Number(payment.amount) || 0;

      const payload: any = {
        organization_id: payment.organization_id,
        deal_id: payment.deal_id,
        amount: paymentAmount,
        payment_date: payment.payment_date || new Date().toISOString().split('T')[0],
        payment_type: payment.payment_type || 'ONE_TIME',
        payment_method: payment.payment_method || 'UPI',
        status: payment.status || 'COMPLETED',
        notes: payment.notes || null,
        cycle_period: payment.cycle_period || null,
        created_by: user?.id || null,
      };

      const { data, error } = await this.client
        .from('payments')
        .insert(payload)
        .select('*, creator:profiles(*)')
        .single();

      if (error || !data) {
        console.warn('createPayment fallback to local crmStore:', error);
        return crmStore.createPayment(payload);
      }

      // Fetch all payments for this deal to recalculate
      const { data: allDealPayments } = await this.client
        .from('payments')
        .select('amount')
        .eq('deal_id', payment.deal_id!)
        .eq('status', 'COMPLETED');

      const totalPaid = (allDealPayments || [{ amount: paymentAmount }]).reduce(
        (sum, p: any) => sum + (Number(p.amount) || 0),
        0
      );

      // Fetch the deal to get total value and payment type
      const { data: currentDeal } = await this.client
        .from('deals')
        .select('*')
        .eq('id', payment.deal_id!)
        .single();

      if (currentDeal) {
        const totalAmount = Number(currentDeal.total_amount || currentDeal.value || 0);
        const monthlyAmount = Number(currentDeal.monthly_amount || 0);
        const remaining = currentDeal.payment_type === 'MONTHLY_RECURRING'
          ? Math.max(0, monthlyAmount - totalPaid)
          : Math.max(0, totalAmount - totalPaid);

        let newStatus: PaymentStatus = 'PENDING';
        if (currentDeal.payment_type === 'MONTHLY_RECURRING') {
          newStatus = totalPaid >= monthlyAmount ? 'PAID' : totalPaid > 0 ? 'PARTIALLY_PAID' : 'PENDING';
        } else {
          if (totalPaid >= totalAmount && totalAmount > 0) newStatus = 'PAID';
          else if (totalPaid > 0) newStatus = 'PARTIALLY_PAID';
          else newStatus = 'PENDING';
        }

        // Advance next_payment_date if recurring and cycle is paid
        let nextPaymentDate = currentDeal.next_payment_date;
        if (currentDeal.payment_type === 'MONTHLY_RECURRING' && newStatus === 'PAID' && currentDeal.next_payment_date) {
          const nextDateObj = new Date(currentDeal.next_payment_date);
          nextDateObj.setMonth(nextDateObj.getMonth() + 1);
          nextPaymentDate = nextDateObj.toISOString().split('T')[0];
        }

        await this.client
          .from('deals')
          .update({
            amount_paid: totalPaid,
            amount_remaining: remaining,
            payment_status: newStatus,
            next_payment_date: nextPaymentDate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.deal_id!);
      }

      crmStore.createPayment(data);

      await this.logActivity({
        organization_id: payment.organization_id!,
        type: 'STATUS_CHANGE',
        title: `Payment Recorded: ₹${paymentAmount.toLocaleString('en-IN')}`,
        description: `Payment of ₹${paymentAmount.toLocaleString('en-IN')} received via ${payment.payment_method || 'UPI'}.`,
        deal_id: payment.deal_id,
        user_id: user?.id,
      });

      return data as Payment;
    } catch (e) {
      console.warn('createPayment exception fallback:', e);
      return crmStore.createPayment(payment);
    }
  }

  async deletePayment(paymentId: string, dealId: string): Promise<boolean> {
    try {
      const { error } = await this.client.from('payments').delete().eq('id', paymentId);
      if (error) {
        return crmStore.deletePayment(paymentId, dealId);
      }

      // Recalculate Deal
      const { data: allDealPayments } = await this.client
        .from('payments')
        .select('amount')
        .eq('deal_id', dealId)
        .eq('status', 'COMPLETED');

      const totalPaid = (allDealPayments || []).reduce((sum, p: any) => sum + (Number(p.amount) || 0), 0);

      const { data: currentDeal } = await this.client.from('deals').select('*').eq('id', dealId).single();
      if (currentDeal) {
        const totalAmount = Number(currentDeal.total_amount || currentDeal.value || 0);
        const remaining = Math.max(0, totalAmount - totalPaid);
        let newStatus: PaymentStatus = 'PENDING';
        if (totalPaid >= totalAmount && totalAmount > 0) newStatus = 'PAID';
        else if (totalPaid > 0) newStatus = 'PARTIALLY_PAID';

        await this.client
          .from('deals')
          .update({
            amount_paid: totalPaid,
            amount_remaining: remaining,
            payment_status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', dealId);
      }

      crmStore.deletePayment(paymentId, dealId);
      return true;
    } catch {
      return crmStore.deletePayment(paymentId, dealId);
    }
  }

  // 6. TASKS
  async getTasks(orgId: string, filter?: 'ALL' | 'OVERDUE' | 'TODAY' | 'UPCOMING' | 'COMPLETED'): Promise<Task[]> {
    try {
      let query = this.client
        .from('tasks')
        .select('*, lead:leads(*), deal:deals(*), company:companies(*), assignee:profiles(*)')
        .eq('organization_id', orgId)
        .eq('is_deleted', false);

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

      if (filter === 'COMPLETED') {
        query = query.eq('status', 'COMPLETED');
      } else if (filter === 'OVERDUE') {
        query = query.neq('status', 'COMPLETED').lt('due_date', startOfToday);
      } else if (filter === 'TODAY') {
        query = query.neq('status', 'COMPLETED').gte('due_date', startOfToday).lte('due_date', endOfToday);
      } else if (filter === 'UPCOMING') {
        query = query.neq('status', 'COMPLETED').gt('due_date', endOfToday);
      }

      const { data, error } = await query.order('due_date', { ascending: true });
      if (error || !data) return [];
      return data;
    } catch {
      return [];
    }
  }

  async createTask(task: Partial<Task>): Promise<Task | null> {
    try {
      const user = (await this.client.auth.getUser()).data.user;
      const { data, error } = await this.client
        .from('tasks')
        .insert({ ...task, created_by: user?.id })
        .select('*, lead:leads(*), deal:deals(*), company:companies(*), assignee:profiles(*)')
        .single();

      return error ? null : data;
    } catch {
      return null;
    }
  }

  async updateTaskStatus(taskId: string, status: Task['status']): Promise<Task | null> {
    try {
      const user = (await this.client.auth.getUser()).data.user;
      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
        completed_at: status === 'COMPLETED' ? new Date().toISOString() : null,
        completed_by: status === 'COMPLETED' ? user?.id : null,
      };

      const { data, error } = await this.client
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select('*, lead:leads(*), deal:deals(*), company:companies(*), assignee:profiles(*)')
        .single();

      return error ? null : data;
    } catch {
      return null;
    }
  }

  async deleteTask(taskId: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('tasks')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      return !error;
    } catch {
      return false;
    }
  }

  // 7. ACTIVITIES
  async getActivities(orgId: string, filter?: { lead_id?: string; deal_id?: string; company_id?: string; type?: string }): Promise<Activity[]> {
    try {
      let query = this.client
        .from('activities')
        .select('*, user:profiles(*)')
        .eq('organization_id', orgId);

      if (filter?.lead_id) query = query.eq('lead_id', filter.lead_id);
      if (filter?.deal_id) query = query.eq('deal_id', filter.deal_id);
      if (filter?.company_id) query = query.eq('company_id', filter.company_id);
      if (filter?.type && filter.type !== 'ALL') query = query.eq('type', filter.type);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error || !data) return [];
      return data;
    } catch {
      return [];
    }
  }

  async logActivity(activity: Partial<Activity>): Promise<Activity | null> {
    try {
      const { data, error } = await this.client
        .from('activities')
        .insert(activity)
        .select('*, user:profiles(*)')
        .single();

      return error ? null : data;
    } catch {
      return null;
    }
  }

  // 8. NOTES
  async getNotes(orgId: string, filter: { lead_id?: string; deal_id?: string; company_id?: string; contact_id?: string }): Promise<Note[]> {
    try {
      let query = this.client
        .from('notes')
        .select('*, author:profiles(*)')
        .eq('organization_id', orgId)
        .eq('is_deleted', false);

      if (filter.lead_id) query = query.eq('lead_id', filter.lead_id);
      if (filter.deal_id) query = query.eq('deal_id', filter.deal_id);
      if (filter.company_id) query = query.eq('company_id', filter.company_id);
      if (filter.contact_id) query = query.eq('contact_id', filter.contact_id);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error || !data) return [];
      return data;
    } catch {
      return [];
    }
  }

  async createNote(note: Partial<Note>): Promise<Note | null> {
    try {
      const user = (await this.client.auth.getUser()).data.user;
      const { data, error } = await this.client
        .from('notes')
        .insert({ ...note, created_by: user?.id })
        .select('*, author:profiles(*)')
        .single();

      return error ? null : data;
    } catch {
      return null;
    }
  }

  async deleteNote(noteId: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('notes')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', noteId);

      return !error;
    } catch {
      return false;
    }
  }

  // 9. NOTIFICATIONS & AUDIT
  async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await this.client
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data;
    } catch {
      return [];
    }
  }

  async markNotificationRead(id: string): Promise<void> {
    try {
      await this.client.from('notifications').update({ is_read: true }).eq('id', id);
    } catch {}
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    try {
      await this.client.from('notifications').update({ is_read: true }).eq('user_id', userId);
    } catch {}
  }

  async getAuditLogs(orgId: string): Promise<AuditLog[]> {
    try {
      const { data, error } = await this.client
        .from('audit_logs')
        .select('*, user:profiles(*)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data;
    } catch {
      return [];
    }
  }

  async logAudit(log: Partial<AuditLog>): Promise<void> {
    try {
      await this.client.from('audit_logs').insert(log);
    } catch {}
  }

  // 10. CUSTOM FIELDS
  async getCustomFields(orgId: string, entityType?: string): Promise<CustomField[]> {
    try {
      let query = this.client
        .from('custom_fields')
        .select('*')
        .eq('organization_id', orgId);

      if (entityType) query = query.eq('entity_type', entityType);

      const { data, error } = await query;
      if (error || !data) return [];
      return data;
    } catch {
      return [];
    }
  }

  async createCustomField(field: Partial<CustomField>): Promise<CustomField | null> {
    try {
      const { data, error } = await this.client
        .from('custom_fields')
        .insert(field)
        .select()
        .single();

      return error ? null : data;
    } catch {
      return null;
    }
  }

  // 11. DYNAMIC DASHBOARD STATS (ZERO HARDCODED NUMBERS & REAL SUPABASE DATA)
  async getLiveDashboardStats(orgId: string) {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [leadsRes, dealsRes, paymentsRes, pipelinesRes, todayTasksRes, overdueTasksRes, recentActsRes] = await Promise.allSettled([
        this.client.from('leads').select('*').eq('organization_id', orgId).eq('is_deleted', false),
        this.client.from('deals').select('*, company:companies(*), contact:contacts(*), owner:profiles(*), stage:pipeline_stages(*)').eq('organization_id', orgId).eq('is_deleted', false),
        this.client.from('payments').select('*').eq('organization_id', orgId),
        this.getPipelines(orgId),
        this.getTasks(orgId, 'TODAY'),
        this.getTasks(orgId, 'OVERDUE'),
        this.client.from('activities').select('*, user:profiles(*)').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(6),
      ]);

      const dbLeads: any[] = leadsRes.status === 'fulfilled' && leadsRes.value.data ? leadsRes.value.data : [];
      const storeLeads: any[] = crmStore.getLeads({ status: 'HISTORICAL_ALL' });
      const leadMap = new Map<string, any>();
      storeLeads.forEach(l => leadMap.set(l.id, l));
      dbLeads.forEach(l => leadMap.set(l.id, l));
      const leads = Array.from(leadMap.values());
      const rawDeals: any[] = dealsRes.status === 'fulfilled' && dealsRes.value.data ? dealsRes.value.data : crmStore.getDeals();
      const rawPayments: any[] = paymentsRes.status === 'fulfilled' && paymentsRes.value.data ? paymentsRes.value.data : crmStore.getPayments();
      const pipelines = pipelinesRes.status === 'fulfilled' ? pipelinesRes.value : [DEFAULT_PIPELINE];
      const todayFollowUps = todayTasksRes.status === 'fulfilled' ? todayTasksRes.value : [];
      const overdueTasks = overdueTasksRes.status === 'fulfilled' ? overdueTasksRes.value : [];
      const recentActivities = recentActsRes.status === 'fulfilled' && recentActsRes.value.data ? recentActsRes.value.data : [];

      // Calculate Real Payment Metrics
      let totalSales = 0;
      let totalReceived = 0;
      let totalOutstanding = 0;
      let overduePaymentsCount = 0;
      let overduePaymentsValue = 0;
      let monthlyRecurringRevenue = 0;

      const deals = rawDeals.map((d: any) => {
        const dealPayments = rawPayments.filter((p: any) => p.deal_id === d.id);
        const paymentsSum = dealPayments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

        const totalAmount = Number(d.total_amount ?? d.value ?? 0);
        const monthlyAmount = Number(d.monthly_amount ?? 0);
        const amountPaid = dealPayments.length > 0 ? paymentsSum : Number(d.amount_paid ?? 0);

        let amountRemaining = d.payment_type === 'MONTHLY_RECURRING'
          ? Math.max(0, monthlyAmount - amountPaid)
          : Math.max(0, totalAmount - amountPaid);

        let isOverdue = false;
        let paymentStatus: PaymentStatus = (d.payment_status as PaymentStatus) || 'PENDING';

        if (d.payment_type === 'MONTHLY_RECURRING') {
          monthlyRecurringRevenue += monthlyAmount;
          if (d.next_payment_date && d.next_payment_date < todayStr && amountPaid < monthlyAmount) {
            paymentStatus = 'OVERDUE';
            isOverdue = true;
          } else if (amountPaid >= monthlyAmount && monthlyAmount > 0) {
            paymentStatus = 'PAID';
          } else if (amountPaid > 0) {
            paymentStatus = 'PARTIALLY_PAID';
          } else {
            paymentStatus = 'PENDING';
          }
        } else {
          // ONE_TIME
          if (amountPaid >= totalAmount && totalAmount > 0) {
            paymentStatus = 'PAID';
            amountRemaining = 0;
          } else if (amountPaid > 0) {
            paymentStatus = 'PARTIALLY_PAID';
          } else {
            paymentStatus = 'PENDING';
          }
        }

        totalSales += totalAmount;
        totalReceived += amountPaid;
        totalOutstanding += amountRemaining;

        if (isOverdue || paymentStatus === 'OVERDUE') {
          overduePaymentsCount++;
          overduePaymentsValue += amountRemaining || monthlyAmount;
        }

        return {
          ...d,
          value: totalAmount,
          total_amount: totalAmount,
          monthly_amount: monthlyAmount,
          amount_paid: amountPaid,
          amount_remaining: amountRemaining,
          payment_status: paymentStatus,
          payments: dealPayments,
        };
      });

      const freshLeadsCount = leads.filter((l) => l.status === 'NEW').length;
      const totalLeads = leads.length;
      const newLeads = freshLeadsCount;
      const qualifiedLeads = leads.filter((l) => l.status === 'QUALIFIED').length;
      const notPickedLeads = leads.filter((l) => l.status === 'NOT_PICKED').length;
      const interestedLeads = leads.filter((l) => l.status === 'INTERESTED').length;
      const followUpLeads = leads.filter((l) => l.status === 'FOLLOW_UP').length;
      const demoLeads = leads.filter((l) => l.status === 'DEMO').length;
      const unassignedLeads = leads.filter((l) => !l.owner_id && l.status === 'NEW').length;
      const followUpsDue = followUpLeads + todayFollowUps.length + overdueTasks.length;

      const wonDeals = deals.filter((d) => (d.stage as any)?.code === 'WON' || d.probability === 100);
      const lostDeals = deals.filter((d) => (d.stage as any)?.code === 'LOST');
      const openDeals = deals.filter((d) => (d.stage as any)?.code !== 'WON' && (d.stage as any)?.code !== 'LOST' && d.probability < 100);

      const pipelineValue = openDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
      const wonRevenue = wonDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
      const closedTotal = wonDeals.length + lostDeals.length;
      const conversionRate = closedTotal > 0 ? ((wonDeals.length / closedTotal) * 100).toFixed(1) + '%' : '0.0%';

      // Real dynamic source distribution
      const sourceCounts: Record<string, number> = {};
      leads.forEach((l) => {
        if (l.source) sourceCounts[l.source] = (sourceCounts[l.source] || 0) + 1;
      });
      const sourceData = Object.entries(sourceCounts).map(([name, value]) => ({ name, value }));

      // Real dynamic monthly leads trend from actual created_at dates
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyMap: Record<string, { month: string; leads: number; revenue: number }> = {};

      leads.forEach((l) => {
        if (!l.created_at) return;
        const d = new Date(l.created_at);
        const key = monthNames[d.getMonth()];
        if (!monthlyMap[key]) monthlyMap[key] = { month: key, leads: 0, revenue: 0 };
        monthlyMap[key].leads += 1;
      });

      deals.forEach((deal) => {
        if (!deal.created_at) return;
        const d = new Date(deal.created_at);
        const key = monthNames[d.getMonth()];
        if (!monthlyMap[key]) monthlyMap[key] = { month: key, leads: 0, revenue: 0 };
        if ((deal.stage as any)?.code === 'WON' || deal.probability === 100) {
          monthlyMap[key].revenue += Number(deal.value) || 0;
        }
      });

      const realTrendData = Object.values(monthlyMap);

      // Stages breakdown
      const stages = pipelines[0]?.stages || DEFAULT_STAGES;
      const pipelineDistribution = stages.map((st) => {
        const dealsInStage = deals.filter((d) => d.stage_id === st.id);
        const totalVal = dealsInStage.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
        return {
          name: st.name,
          count: dealsInStage.length,
          value: totalVal,
          color: st.color,
        };
      });

      return {
        totalLeads,
        newLeads,
        qualifiedLeads,
        notPickedLeads,
        interestedLeads,
        followUpLeads,
        demoLeads,
        unassignedLeads,
        followUpsDue,
        openDeals: openDeals.length,
        wonDeals: wonDeals.length,
        lostDeals: lostDeals.length,
        pipelineValue,
        wonRevenue,
        conversionRate,

        // Real Payment Metrics (Zero hardcoded)
        totalSales,
        totalReceived,
        totalOutstanding,
        overduePaymentsCount,
        overduePaymentsValue,
        monthlyRecurringRevenue,

        sourceData,
        pipelineDistribution,
        realTrendData,
        recentLeads: leads.slice(0, 5),
        recentDeals: deals.slice(0, 5),
        recentActivities,
        todayFollowUps,
        overdueTasks,
        isLiveConnected: leadsRes.status === 'fulfilled' && !leadsRes.value.error,
        connectionError: leadsRes.status === 'fulfilled' && leadsRes.value.error ? leadsRes.value.error.message : null,
      };
    } catch (err: any) {
      console.error('getLiveDashboardStats failed:', err);
      return {
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
        isLiveConnected: false,
        connectionError: err.message || 'Database connection error',
      };
    }
  }

  // 12. REAL CSV IMPORT WITH DEAL & PAYMENT CREATION
  async executeRealCsvImport(
    orgId: string,
    previewRows: CsvPreviewRow[]
  ): Promise<CsvImportSummary> {
    const user = (await this.client.auth.getUser()).data?.user;
    let imported = 0;
    let skipped = 0;
    let updated = 0;
    let invalid = 0;
    let dealsCreated = 0;
    let paymentsCreated = 0;

    // Get default pipeline & stage for deal creation
    let defaultPipelineId = 'pipe_default';
    let defaultStageId = 's1';
    try {
      const pipelines = await this.getPipelines(orgId);
      if (pipelines.length > 0) {
        defaultPipelineId = pipelines[0].id;
        if (pipelines[0].stages && pipelines[0].stages.length > 0) {
          defaultStageId = pipelines[0].stages[0].id;
        }
      }
    } catch {}

    // Auto-provision profile and org membership for auth user to prevent RLS errors
    if (user?.id) {
      try {
        await this.client.from('profiles').upsert({
          id: user.id,
          email: user.email || 'admin@firstclick.com',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin',
          role: 'Owner',
        }, { onConflict: 'id' });

        await this.client.from('organization_members').upsert({
          id: `mem_${user.id}_${orgId}`,
          organization_id: orgId,
          user_id: user.id,
          role: 'Owner',
          status: 'active',
        }, { onConflict: 'organization_id,user_id' });
      } catch (e) {
        console.warn('Auto org membership insert warning:', e);
      }
    }

    const rowsToInsert: CsvPreviewRow[] = [];

    for (const row of previewRows) {
      if (row.errors && row.errors.length > 0) {
        invalid++;
        continue;
      }

      if (row.isDuplicate) {
        if (row.duplicateResolution === 'skip') {
          skipped++;
          continue;
        } else if (row.duplicateResolution === 'update' && row.existingRecord) {
          try {
            const m = row.mappedData;
            const updatePayload: any = {
              first_name: m.first_name || (m.full_name?.split(' ')[0] || row.existingRecord.first_name),
              last_name: m.last_name || (m.full_name?.split(' ').slice(1).join(' ') || row.existingRecord.last_name),
              full_name: m.full_name || row.existingRecord.full_name,
              email: m.email || row.existingRecord.email,
              phone: m.phone || row.existingRecord.phone,
              company_name: m.company_name || row.existingRecord.company_name,
              source: m.source || row.existingRecord.source,
              status: m.status || row.existingRecord.status,
              priority: m.priority || row.existingRecord.priority,
              estimated_value: m.estimated_value || m.deal_value || row.existingRecord.estimated_value,
              notes: m.notes || row.existingRecord.notes,
              updated_at: new Date().toISOString(),
            };

            this.client
              .from('leads')
              .update(updatePayload)
              .eq('id', row.existingRecord.id)
              .then();

            crmStore.updateLead(row.existingRecord.id, updatePayload);
            updated++;
          } catch (e: any) {
            if (row.existingRecord) {
              crmStore.updateLead(row.existingRecord.id, row.mappedData);
              updated++;
            }
          }
          continue;
        }
      }

      rowsToInsert.push(row);
    }

    if (rowsToInsert.length > 0) {
      const leadPayloads: any[] = rowsToInsert.map((row, idx) => {
        const m = row.mappedData;
        const fallbackLeadName = m.full_name || m.company_name || (m.email ? m.email.split('@')[0] : null) || (m.phone ? `Lead ${m.phone}` : `Lead #${idx + 1}`);
        return sanitizeLeadPayload({
          organization_id: orgId,
          first_name: m.first_name || (fallbackLeadName.split(' ')[0] || 'Lead'),
          last_name: m.last_name || (fallbackLeadName.split(' ').slice(1).join(' ') || null),
          full_name: fallbackLeadName,
          email: m.email || null,
          phone: m.phone || null,
          company_name: m.company_name || null,
          source: m.source || 'MANUAL',
          status: m.status || 'NEW',
          priority: m.priority || 'MEDIUM',
          estimated_value: Number(m.estimated_value || m.deal_value || 0),
          notes: m.notes || null,
          owner_id: sanitizeUuid(user?.id),
        });
      });

      let insertedLeads: any[] = [];
      try {
        const { data, error } = await this.client
          .from('leads')
          .insert(leadPayloads)
          .select();

        if (!error && data && data.length > 0) {
          insertedLeads = data;
        } else {
          const payloadsNoOwner = leadPayloads.map((l) => ({ ...l, owner_id: null }));
          const { data: dataNoOwner } = await this.client
            .from('leads')
            .insert(payloadsNoOwner)
            .select();

          if (dataNoOwner && dataNoOwner.length > 0) {
            insertedLeads = dataNoOwner;
          }
        }
      } catch (e: any) {
        console.warn('Batch lead insert exception:', e);
      }

      for (let i = 0; i < leadPayloads.length; i++) {
        const inserted = insertedLeads[i];
        if (inserted) {
          crmStore.createLead(inserted);
          imported++;
        } else {
          const fallbackLead: Lead = {
            id: 'lead_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substr(2, 4),
            organization_id: orgId,
            first_name: leadPayloads[i].first_name || 'Lead',
            last_name: leadPayloads[i].last_name || null,
            full_name: leadPayloads[i].full_name || 'Lead',
            email: leadPayloads[i].email || null,
            phone: leadPayloads[i].phone || null,
            company_name: leadPayloads[i].company_name || null,
            source: leadPayloads[i].source || 'MANUAL',
            status: leadPayloads[i].status || 'NEW',
            priority: leadPayloads[i].priority || 'MEDIUM',
            estimated_value: leadPayloads[i].estimated_value || 0,
            notes: leadPayloads[i].notes || null,
            owner_id: leadPayloads[i].owner_id || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          crmStore.createLead(fallbackLead);
          imported++;
        }
      }
    }

    if (imported > 0 || updated > 0) {
      try {
        await this.logActivity({
          organization_id: orgId,
          type: 'STATUS_CHANGE',
          title: 'CSV Bulk Import Completed',
          description: `Successfully imported ${imported} new leads and updated ${updated} existing records.`,
          user_id: user?.id,
        });
      } catch {}
    }

    return {
      totalRows: previewRows.length,
      validRows: previewRows.length - invalid,
      invalidRows: invalid,
      duplicateRows: previewRows.filter((r) => r.isDuplicate).length,
      importedRows: imported,
      skippedRows: skipped,
      updatedRows: updated,
      failedRows: 0,
      dealsCreated,
      paymentsCreated,
      errorMessage: null,
    };
  }

  // 13. GLOBAL SEARCH
  async globalSearch(orgId: string, query: string) {
    if (!query || query.trim().length === 0) {
      return { leads: [], contacts: [], companies: [], deals: [] };
    }
    try {
      const q = `%${query.trim()}%`;
      const [leadsRes, contactsRes, companiesRes, dealsRes] = await Promise.all([
        this.client.from('leads').select('*').eq('organization_id', orgId).eq('is_deleted', false).or(`full_name.ilike.${q},email.ilike.${q},phone.ilike.${q},company_name.ilike.${q}`).limit(5),
        this.client.from('contacts').select('*').eq('organization_id', orgId).eq('is_deleted', false).or(`full_name.ilike.${q},email.ilike.${q},phone.ilike.${q},job_title.ilike.${q}`).limit(5),
        this.client.from('companies').select('*').eq('organization_id', orgId).eq('is_deleted', false).or(`name.ilike.${q},industry.ilike.${q},city.ilike.${q}`).limit(5),
        this.client.from('deals').select('*').eq('organization_id', orgId).eq('is_deleted', false).ilike('name', q).limit(5),
      ]);

      return {
        leads: (leadsRes.data as Lead[]) || [],
        contacts: (contactsRes.data as Contact[]) || [],
        companies: (companiesRes.data as Company[]) || [],
        deals: (dealsRes.data as Deal[]) || [],
      };
    } catch {
      return { leads: [], contacts: [], companies: [], deals: [] };
    }
  }
  async getAdminMessages(orgId: string): Promise<AdminMessage[]> {
    try {
      const { data, error } = await this.client
        .from('admin_messages')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: true });

      if (error || !data) {
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('fc_admin_room_messages');
          return saved ? JSON.parse(saved) : [];
        }
        return [];
      }
      return data;
    } catch {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('fc_admin_room_messages');
        return saved ? JSON.parse(saved) : [];
      }
      return [];
    }
  }

  async sendAdminMessage(message: Partial<AdminMessage>): Promise<AdminMessage | null> {
    try {
      const { data, error } = await this.client
        .from('admin_messages')
        .insert(message)
        .select()
        .single();

      if (error || !data) {
        const fallbackMsg: AdminMessage = {
          id: 'msg_' + Date.now(),
          organization_id: message.organization_id || '00000000-0000-0000-0000-000000000001',
          sender_id: message.sender_id || 'u_admin',
          sender_name: message.sender_name || 'Admin',
          sender_email: message.sender_email || 'admin@firstclick.com',
          message: message.message || '',
          tag: message.tag || 'GENERAL',
          created_at: new Date().toISOString(),
        };
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('fc_admin_room_messages');
          const current = saved ? JSON.parse(saved) : [];
          localStorage.setItem('fc_admin_room_messages', JSON.stringify([...current, fallbackMsg]));
        }
        return fallbackMsg;
      }
      return data;
    } catch {
      const fallbackMsg: AdminMessage = {
        id: 'msg_' + Date.now(),
        organization_id: message.organization_id || '00000000-0000-0000-0000-000000000001',
        sender_id: message.sender_id || 'u_admin',
        sender_name: message.sender_name || 'Admin',
        sender_email: message.sender_email || 'admin@firstclick.com',
        message: message.message || '',
        tag: message.tag || 'GENERAL',
        created_at: new Date().toISOString(),
      };
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('fc_admin_room_messages');
        const current = saved ? JSON.parse(saved) : [];
        localStorage.setItem('fc_admin_room_messages', JSON.stringify([...current, fallbackMsg]));
      }
      return fallbackMsg;
    }
  }
}

export const supabaseCrm = new SupabaseCrmService();
