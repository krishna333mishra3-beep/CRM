import {
  Organization,
  UserProfile,
  OrganizationMember,
  Company,
  Contact,
  Lead,
  Deal,
  Payment,
  PaymentStatus,
  PaymentType,
  PaymentMethod,
  Pipeline,
  PipelineStage,
  Activity,
  Task,
  Note,
  Notification,
  AuditLog,
  CustomField,
  LeadStatus,
  CsvPreviewRow,
  CsvImportSummary,
} from '@/types/crm';
import { isValidEmail, isValidPhone } from '@/lib/utils';

const SEED_ORG_ID = '00000000-0000-0000-0000-000000000001';
const SEED_PIPELINE_ID = 'pipe_firstclick';

export const INITIAL_ORG: Organization = {
  id: SEED_ORG_ID,
  name: 'First Click Softwares',
  slug: 'firstclick-crm',
  logo_url: null,
  email: 'admin@firstclick.com',
  phone: '+91 98765 43210',
  website: 'https://firstclicksoftwares.com',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  currency_symbol: '₹',
  settings: {},
  created_at: new Date().toISOString(),
};

export const INITIAL_PIPELINE: Pipeline = {
  id: SEED_PIPELINE_ID,
  organization_id: SEED_ORG_ID,
  name: 'First Click Sales Pipeline',
  is_default: true,
  created_at: new Date().toISOString(),
  stages: [
    { id: 's1', organization_id: SEED_ORG_ID, pipeline_id: SEED_PIPELINE_ID, name: 'New Lead', code: 'NEW', probability: 10, display_order: 1, color: '#38BDF8', created_at: new Date().toISOString() },
    { id: 's2', organization_id: SEED_ORG_ID, pipeline_id: SEED_PIPELINE_ID, name: 'Contacted', code: 'CONTACTED', probability: 25, display_order: 2, color: '#6366F1', created_at: new Date().toISOString() },
    { id: 's3', organization_id: SEED_ORG_ID, pipeline_id: SEED_PIPELINE_ID, name: 'Demo Scheduled', code: 'DEMO', probability: 50, display_order: 3, color: '#8B5CF6', created_at: new Date().toISOString() },
    { id: 's4', organization_id: SEED_ORG_ID, pipeline_id: SEED_PIPELINE_ID, name: 'Proposal Sent', code: 'PROPOSAL', probability: 70, display_order: 4, color: '#EC4899', created_at: new Date().toISOString() },
    { id: 's5', organization_id: SEED_ORG_ID, pipeline_id: SEED_PIPELINE_ID, name: 'In Negotiation', code: 'NEGOTIATION', probability: 85, display_order: 5, color: '#F59E0B', created_at: new Date().toISOString() },
    { id: 's6', organization_id: SEED_ORG_ID, pipeline_id: SEED_PIPELINE_ID, name: 'Closed Won', code: 'WON', probability: 100, display_order: 6, color: '#10B981', created_at: new Date().toISOString() },
    { id: 's7', organization_id: SEED_ORG_ID, pipeline_id: SEED_PIPELINE_ID, name: 'Closed Lost', code: 'LOST', probability: 0, display_order: 7, color: '#EF4444', created_at: new Date().toISOString() },
  ],
};

export const INITIAL_COMPANIES: Company[] = [];
export const INITIAL_CONTACTS: Contact[] = [];
export const INITIAL_LEADS: Lead[] = [];
export const INITIAL_DEALS: Deal[] = [];
export const INITIAL_PAYMENTS: Payment[] = [];
export const INITIAL_TASKS: Task[] = [];
export const INITIAL_ACTIVITIES: Activity[] = [];

class CrmStorageManager {
  private leads: Lead[] = [];
  private companies: Company[] = [];
  private contacts: Contact[] = [];
  private deals: Deal[] = [];
  private payments: Payment[] = [];
  private tasks: Task[] = [];
  private activities: Activity[] = [];
  private pipeline: Pipeline = INITIAL_PIPELINE;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const isResetDone = localStorage.getItem('fc_leads_wiped_v2');
        if (!isResetDone) {
          localStorage.removeItem('fc_leads');
          localStorage.removeItem('firstclick_crm_leads');
          localStorage.setItem('fc_leads', JSON.stringify([]));
          localStorage.setItem('fc_leads_wiped_v2', 'true');
          this.leads = [];
        } else {
          const savedLeads = localStorage.getItem('fc_leads');
          if (savedLeads) this.leads = JSON.parse(savedLeads);
        }

        const savedDeals = localStorage.getItem('fc_deals');
        if (savedDeals) this.deals = JSON.parse(savedDeals);

        const savedPayments = localStorage.getItem('fc_payments');
        if (savedPayments) this.payments = JSON.parse(savedPayments);

        const savedTasks = localStorage.getItem('fc_tasks');
        if (savedTasks) this.tasks = JSON.parse(savedTasks);

        const savedActs = localStorage.getItem('fc_acts');
        if (savedActs) this.activities = JSON.parse(savedActs);

        const savedComps = localStorage.getItem('fc_comps');
        if (savedComps) this.companies = JSON.parse(savedComps);

        const savedConts = localStorage.getItem('fc_conts');
        if (savedConts) this.contacts = JSON.parse(savedConts);
      } catch (e) {
        console.warn('Storage manager load warning:', e);
      }
    }
  }

  private persist() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('fc_leads', JSON.stringify(this.leads));
        localStorage.setItem('fc_deals', JSON.stringify(this.deals));
        localStorage.setItem('fc_payments', JSON.stringify(this.payments));
        localStorage.setItem('fc_tasks', JSON.stringify(this.tasks));
        localStorage.setItem('fc_acts', JSON.stringify(this.activities));
        localStorage.setItem('fc_comps', JSON.stringify(this.companies));
        localStorage.setItem('fc_conts', JSON.stringify(this.contacts));
      } catch (e) {
        console.warn('Storage manager persist warning:', e);
      }
    }
  }

  // Leads
  getLeads(filters?: any) {
    let result = [...this.leads];
    const requestedStatus = filters?.status || 'ALL';
    if (requestedStatus === 'NEW') {
      result = result.filter((l) => l.status === 'NEW' || !l.status);
    } else if (requestedStatus !== 'ALL' && requestedStatus !== 'HISTORICAL_ALL') {
      result = result.filter((l) => l.status === requestedStatus);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.full_name.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q) ||
          l.phone?.toLowerCase().includes(q) ||
          l.company_name?.toLowerCase().includes(q)
      );
    }
    if (filters?.source && filters.source !== 'ALL') {
      result = result.filter((l) => l.source === filters.source);
    }
    if (filters?.priority && filters.priority !== 'ALL') {
      result = result.filter((l) => l.priority === filters.priority);
    }
    if (filters?.owner_id && filters.owner_id !== 'ALL') {
      result = result.filter((l) => l.owner_id === filters.owner_id);
    }
    return result;
  }

  getLeadById(id: string) {
    return this.leads.find((l) => l.id === id) || null;
  }

  createLead(lead: Partial<Lead>): Lead {
    const newLead: Lead = {
      id: 'l_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      organization_id: SEED_ORG_ID,
      first_name: lead.first_name || (lead.full_name?.split(' ')[0] || 'Lead'),
      last_name: lead.last_name || (lead.full_name?.split(' ').slice(1).join(' ') || ''),
      full_name: lead.full_name || `${lead.first_name || 'Lead'} ${lead.last_name || ''}`.trim(),
      email: lead.email || null,
      phone: lead.phone || null,
      company_name: lead.company_name || null,
      source: lead.source || 'MANUAL',
      status: lead.status || 'NEW',
      priority: lead.priority || 'MEDIUM',
      estimated_value: lead.estimated_value || 0,
      notes: lead.notes || null,
      owner_id: lead.owner_id || null,
      created_at: new Date().toISOString(),
    };
    this.leads = [newLead, ...this.leads];
    this.persist();
    return newLead;
  }

  updateLead(id: string, updates: Partial<Lead>): Lead | null {
    const idx = this.leads.findIndex((l) => l.id === id);
    if (idx === -1) return null;
    this.leads[idx] = { ...this.leads[idx], ...updates, updated_at: new Date().toISOString() };
    this.persist();
    return this.leads[idx];
  }

  deleteLead(id: string): boolean {
    this.leads = this.leads.filter((l) => l.id !== id);
    this.persist();
    return true;
  }

  clearAllLeads(): void {
    this.leads = [];
    this.persist();
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('fc_leads');
        localStorage.setItem('fc_leads', JSON.stringify([]));
      } catch (e) {
        console.warn('localStorage clearAllLeads error:', e);
      }
    }
  }

  // Companies & Contacts
  getCompanies() {
    return this.companies;
  }

  createCompany(comp: Partial<Company>): Company {
    const newComp: Company = {
      id: 'c_' + Date.now(),
      organization_id: SEED_ORG_ID,
      name: comp.name || 'New Company',
      industry: comp.industry || null,
      website: comp.website || null,
      phone: comp.phone || null,
      email: comp.email || null,
      city: comp.city || null,
      created_at: new Date().toISOString(),
    };
    this.companies = [newComp, ...this.companies];
    this.persist();
    return newComp;
  }

  updateCompany(id: string, updates: Partial<Company>): Company | null {
    const idx = this.companies.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.companies[idx] = { ...this.companies[idx], ...updates, updated_at: new Date().toISOString() };
    this.persist();
    return this.companies[idx];
  }

  deleteCompany(id: string): boolean {
    this.companies = this.companies.filter((c) => c.id !== id);
    this.persist();
    return true;
  }

  getContacts() {
    return this.contacts;
  }

  createContact(cont: Partial<Contact>): Contact {
    const newCont: Contact = {
      id: 'cnt_' + Date.now(),
      organization_id: SEED_ORG_ID,
      first_name: cont.first_name || (cont.full_name?.split(' ')[0] || 'Contact'),
      last_name: cont.last_name || '',
      full_name: cont.full_name || `${cont.first_name || ''} ${cont.last_name || ''}`.trim(),
      email: cont.email || null,
      phone: cont.phone || null,
      job_title: cont.job_title || null,
      company_id: cont.company_id || null,
      created_at: new Date().toISOString(),
    };
    this.contacts = [newCont, ...this.contacts];
    this.persist();
    return newCont;
  }

  updateContact(id: string, updates: Partial<Contact>): Contact | null {
    const idx = this.contacts.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.contacts[idx] = { ...this.contacts[idx], ...updates, updated_at: new Date().toISOString() };
    this.persist();
    return this.contacts[idx];
  }

  deleteContact(id: string): boolean {
    this.contacts = this.contacts.filter((c) => c.id !== id);
    this.persist();
    return true;
  }

  // Deals & Pipeline
  getDeals() {
    return this.deals.map((deal) => {
      const dealPayments = this.payments.filter((p) => p.deal_id === deal.id);
      return {
        ...deal,
        payments: dealPayments,
      };
    });
  }

  getDealById(id: string) {
    const deal = this.deals.find((d) => d.id === id);
    if (!deal) return null;
    return {
      ...deal,
      payments: this.payments.filter((p) => p.deal_id === deal.id),
    };
  }

  getDefaultPipeline() {
    return this.pipeline;
  }

  createDeal(deal: Partial<Deal>): Deal {
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

    const newDeal: Deal = {
      id: 'd_' + Date.now(),
      organization_id: SEED_ORG_ID,
      pipeline_id: SEED_PIPELINE_ID,
      stage_id: deal.stage_id || 's1',
      name: deal.name || 'New Deal',
      value: totalVal,
      probability: deal.probability || 20,
      expected_close_date: deal.expected_close_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      owner_id: deal.owner_id || null,
      source: deal.source || 'MANUAL',
      priority: deal.priority || 'MEDIUM',
      notes: deal.notes || null,
      payment_type: deal.payment_type || 'ONE_TIME',
      total_amount: totalVal,
      amount_paid: paidVal,
      amount_remaining: remainingVal,
      payment_status: status,
      monthly_amount: monthlyVal,
      billing_start_date: deal.billing_start_date || null,
      next_payment_date: deal.next_payment_date || null,
      created_at: new Date().toISOString(),
    };

    this.deals = [newDeal, ...this.deals];

    if (paidVal > 0) {
      const initPayment: Payment = {
        id: 'pay_' + Date.now(),
        organization_id: SEED_ORG_ID,
        deal_id: newDeal.id,
        amount: paidVal,
        payment_date: new Date().toISOString().split('T')[0],
        payment_type: newDeal.payment_type || 'ONE_TIME',
        payment_method: 'UPI',
        status: 'COMPLETED',
        notes: 'Initial Payment',
        created_at: new Date().toISOString(),
      };
      this.payments = [initPayment, ...this.payments];
    }

    this.persist();
    return newDeal;
  }

  updateDeal(dealId: string, updates: Partial<Deal>): Deal | null {
    const idx = this.deals.findIndex((d) => d.id === dealId);
    if (idx === -1) return null;

    const current = this.deals[idx];
    const totalVal = Number(updates.total_amount ?? updates.value ?? current.total_amount ?? current.value ?? 0);
    const monthlyVal = Number(updates.monthly_amount ?? current.monthly_amount ?? 0);
    const paidVal = Number(updates.amount_paid ?? current.amount_paid ?? 0);
    const paymentType = updates.payment_type || current.payment_type || 'ONE_TIME';

    let remainingVal = paymentType === 'MONTHLY_RECURRING'
      ? Math.max(0, monthlyVal - paidVal)
      : Math.max(0, totalVal - paidVal);

    let paymentStatus = updates.payment_status || current.payment_status || 'PENDING';
    if (!updates.payment_status) {
      if (paymentType === 'ONE_TIME') {
        if (paidVal >= totalVal && totalVal > 0) paymentStatus = 'PAID';
        else if (paidVal > 0) paymentStatus = 'PARTIALLY_PAID';
        else paymentStatus = 'PENDING';
      }
    }

    this.deals[idx] = {
      ...current,
      ...updates,
      value: totalVal,
      total_amount: totalVal,
      monthly_amount: monthlyVal,
      amount_paid: paidVal,
      amount_remaining: remainingVal,
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    };

    this.persist();
    return this.deals[idx];
  }

  updateDealStage(dealId: string, stageId: string): Deal | null {
    const idx = this.deals.findIndex((d) => d.id === dealId);
    if (idx === -1) return null;
    this.deals[idx].stage_id = stageId;
    this.deals[idx].updated_at = new Date().toISOString();
    this.persist();
    return this.deals[idx];
  }

  deleteDeal(id: string): boolean {
    this.deals = this.deals.filter((d) => d.id !== id);
    this.payments = this.payments.filter((p) => p.deal_id !== id);
    this.persist();
    return true;
  }

  // Payments
  getPayments(dealId?: string): Payment[] {
    if (dealId) return this.payments.filter((p) => p.deal_id === dealId);
    return this.payments;
  }

  createPayment(payment: Partial<Payment>): Payment {
    const newPayment: Payment = {
      id: 'pay_' + Date.now(),
      organization_id: SEED_ORG_ID,
      deal_id: payment.deal_id!,
      amount: Number(payment.amount) || 0,
      payment_date: payment.payment_date || new Date().toISOString().split('T')[0],
      payment_type: payment.payment_type || 'ONE_TIME',
      payment_method: payment.payment_method || 'UPI',
      status: payment.status || 'COMPLETED',
      notes: payment.notes || null,
      cycle_period: payment.cycle_period || null,
      created_by: payment.created_by || null,
      created_at: new Date().toISOString(),
    };

    this.payments = [newPayment, ...this.payments];

    // Recalculate Deal
    const dealIdx = this.deals.findIndex((d) => d.id === payment.deal_id);
    if (dealIdx !== -1) {
      const deal = this.deals[dealIdx];
      const dealPayments = this.payments.filter((p) => p.deal_id === deal.id && p.status === 'COMPLETED');
      const totalPaid = dealPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const totalAmount = Number(deal.total_amount || deal.value || 0);

      const remaining = Math.max(0, totalAmount - totalPaid);
      let status: PaymentStatus = 'PENDING';
      if (totalPaid >= totalAmount && totalAmount > 0) status = 'PAID';
      else if (totalPaid > 0) status = 'PARTIALLY_PAID';

      this.deals[dealIdx] = {
        ...deal,
        amount_paid: totalPaid,
        amount_remaining: remaining,
        payment_status: status,
        updated_at: new Date().toISOString(),
      };
    }

    this.persist();
    return newPayment;
  }

  deletePayment(paymentId: string, dealId: string): boolean {
    this.payments = this.payments.filter((p) => p.id !== paymentId);
    const dealIdx = this.deals.findIndex((d) => d.id === dealId);
    if (dealIdx !== -1) {
      const deal = this.deals[dealIdx];
      const dealPayments = this.payments.filter((p) => p.deal_id === deal.id && p.status === 'COMPLETED');
      const totalPaid = dealPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const totalAmount = Number(deal.total_amount || deal.value || 0);
      const remaining = Math.max(0, totalAmount - totalPaid);
      let status: PaymentStatus = 'PENDING';
      if (totalPaid >= totalAmount && totalAmount > 0) status = 'PAID';
      else if (totalPaid > 0) status = 'PARTIALLY_PAID';

      this.deals[dealIdx] = {
        ...deal,
        amount_paid: totalPaid,
        amount_remaining: remaining,
        payment_status: status,
        updated_at: new Date().toISOString(),
      };
    }
    this.persist();
    return true;
  }

  // Tasks
  getTasks() {
    return this.tasks;
  }

  createTask(task: Partial<Task>): Task {
    const newTask: Task = {
      id: 't_' + Date.now(),
      organization_id: SEED_ORG_ID,
      title: task.title || 'New Task',
      due_date: task.due_date || new Date().toISOString(),
      priority: task.priority || 'HIGH',
      status: task.status || 'PENDING',
      assigned_to: task.assigned_to || null,
      lead_id: task.lead_id,
      deal_id: task.deal_id,
      created_at: new Date().toISOString(),
    };
    this.tasks = [newTask, ...this.tasks];
    this.persist();
    return newTask;
  }

  updateTaskStatus(taskId: string, status: Task['status']): Task | null {
    const idx = this.tasks.findIndex((t) => t.id === taskId);
    if (idx === -1) return null;
    this.tasks[idx].status = status;
    this.tasks[idx].updated_at = new Date().toISOString();
    this.persist();
    return this.tasks[idx];
  }

  // Activities
  getActivities() {
    return this.activities;
  }

  logActivity(act: Partial<Activity>): Activity {
    const newAct: Activity = {
      id: 'act_' + Date.now(),
      organization_id: SEED_ORG_ID,
      type: act.type || 'NOTE',
      title: act.title || 'Activity',
      description: act.description || null,
      duration_minutes: act.duration_minutes || 0,
      lead_id: act.lead_id,
      deal_id: act.deal_id,
      user_id: act.user_id || null,
      created_at: new Date().toISOString(),
    };
    this.activities = [newAct, ...this.activities];
    this.persist();
    return newAct;
  }
}

export const crmStore = new CrmStorageManager();
