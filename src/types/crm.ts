export type Role = 'Owner' | 'Admin' | 'Manager' | 'Sales Executive' | 'Employee' | 'Viewer';

export type LeadStatus = 
  | 'NEW' 
  | 'CONTACTED' 
  | 'NOT_PICKED' 
  | 'INTERESTED' 
  | 'FOLLOW_UP' 
  | 'DEMO' 
  | 'QUALIFIED' 
  | 'PROPOSAL' 
  | 'NEGOTIATION' 
  | 'WON' 
  | 'LOST';

export type LeadSource = 
  | 'WEBSITE' 
  | 'INSTAGRAM' 
  | 'FACEBOOK' 
  | 'GOOGLE' 
  | 'WHATSAPP' 
  | 'REFERRAL' 
  | 'COLD_CALL' 
  | 'ADVERTISEMENT' 
  | 'SCRAPED' 
  | 'MANUAL' 
  | 'OTHER';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type ActivityType = 
  | 'CALL' 
  | 'EMAIL' 
  | 'WHATSAPP' 
  | 'MEETING' 
  | 'NOTE' 
  | 'FOLLOW_UP' 
  | 'STATUS_CHANGE' 
  | 'STAGE_CHANGE' 
  | 'ASSIGNMENT';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  phone?: string | null;
  title?: string | null;
  role?: Role;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  timezone: string;
  currency: string;
  currency_symbol: string;
  settings?: Record<string, any>;
  created_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: Role;
  status: 'active' | 'invited' | 'suspended';
  created_at: string;
  user?: UserProfile;
}

export interface PipelineStage {
  id: string;
  organization_id: string;
  pipeline_id: string;
  name: string;
  code: string;
  probability: number;
  display_order: number;
  color?: string;
  created_at: string;
}

export interface Pipeline {
  id: string;
  organization_id: string;
  name: string;
  is_default: boolean;
  stages: PipelineStage[];
  created_at: string;
}

export interface Company {
  id: string;
  organization_id: string;
  name: string;
  industry?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  owner_id?: string | null;
  notes?: string | null;
  custom_fields?: Record<string, any>;
  is_deleted?: boolean;
  created_at: string;
  updated_at?: string;
  owner?: UserProfile;
  contacts_count?: number;
  deals_count?: number;
  deals_value?: number;
}

export interface Contact {
  id: string;
  organization_id: string;
  company_id?: string | null;
  first_name: string;
  last_name?: string | null;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  job_title?: string | null;
  owner_id?: string | null;
  lead_id?: string | null;
  notes?: string | null;
  custom_fields?: Record<string, any>;
  is_deleted?: boolean;
  created_at: string;
  updated_at?: string;
  company?: Company;
  owner?: UserProfile;
}

export interface Lead {
  id: string;
  organization_id: string;
  first_name: string;
  last_name?: string | null;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  company_name?: string | null;
  company_id?: string | null;
  contact_id?: string | null;
  source: LeadSource;
  status: LeadStatus;
  priority: Priority;
  owner_id?: string | null;
  estimated_value: number;
  notes?: string | null;
  last_contacted_at?: string | null;
  custom_fields?: Record<string, any>;
  is_deleted?: boolean;
  created_at: string;
  updated_at?: string;
  owner?: UserProfile;
  company?: Company;
}

export type PaymentType = 'ONE_TIME' | 'MONTHLY_RECURRING';

export type PaymentStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';

export type PaymentMethod = 'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Other';

export interface Payment {
  id: string;
  organization_id: string;
  deal_id: string;
  amount: number;
  payment_date: string;
  payment_type: PaymentType;
  payment_method: PaymentMethod;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  notes?: string | null;
  cycle_period?: string | null;
  created_by?: string | null;
  created_at: string;
  creator?: UserProfile;
  deal?: Deal;
}

export interface Deal {
  id: string;
  organization_id: string;
  pipeline_id: string;
  stage_id: string;
  company_id?: string | null;
  contact_id?: string | null;
  lead_id?: string | null;
  name: string;
  value: number;
  probability: number;
  expected_close_date?: string | null;
  actual_close_date?: string | null;
  owner_id?: string | null;
  source?: LeadSource;
  priority?: Priority;
  notes?: string | null;

  // Real Payment System Properties
  payment_type?: PaymentType;
  total_amount?: number;
  amount_paid?: number;
  amount_remaining?: number;
  payment_status?: PaymentStatus;
  monthly_amount?: number;
  billing_start_date?: string | null;
  next_payment_date?: string | null;
  payments?: Payment[];

  custom_fields?: Record<string, any>;
  is_deleted?: boolean;
  created_at: string;
  updated_at?: string;
  stage?: PipelineStage;
  owner?: UserProfile;
  company?: Company;
  contact?: Contact;
}

export interface Task {
  id: string;
  organization_id: string;
  title: string;
  description?: string | null;
  due_date: string;
  priority: Priority;
  status: TaskStatus;
  assigned_to?: string | null;
  created_by?: string | null;
  lead_id?: string | null;
  deal_id?: string | null;
  company_id?: string | null;
  contact_id?: string | null;
  completed_at?: string | null;
  completed_by?: string | null;
  is_deleted?: boolean;
  created_at: string;
  updated_at?: string;
  assignee?: UserProfile;
  lead?: Lead;
  deal?: Deal;
  company?: Company;
}

export interface Activity {
  id: string;
  organization_id: string;
  type: ActivityType;
  title: string;
  description?: string | null;
  duration_minutes?: number | null;
  user_id?: string | null;
  lead_id?: string | null;
  deal_id?: string | null;
  company_id?: string | null;
  contact_id?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
  user?: UserProfile;
}

export interface Note {
  id: string;
  organization_id: string;
  content: string;
  lead_id?: string | null;
  deal_id?: string | null;
  company_id?: string | null;
  contact_id?: string | null;
  created_by: string;
  is_deleted?: boolean;
  created_at: string;
  updated_at?: string;
  author?: UserProfile;
}

export interface Notification {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  entity_type?: string;
  entity_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  created_at: string;
  user?: UserProfile;
}

export interface CustomField {
  id: string;
  organization_id: string;
  entity_type: 'LEAD' | 'CONTACT' | 'COMPANY' | 'DEAL';
  name: string;
  label: string;
  field_type: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT';
  options?: string[];
  is_required: boolean;
  display_order: number;
  created_at: string;
}

export interface AdminMessage {
  id: string;
  organization_id: string;
  sender_id: string;
  sender_name: string;
  sender_email: string;
  message: string;
  tag?: 'URGENT' | 'DEAL_UPDATE' | 'CALL_DISPOSITION' | 'GENERAL' | 'LEAD_NOTE';
  lead_id?: string | null;
  created_at: string;
}

export interface CsvPreviewRow {
  rowNumber: number;
  rawData: Record<string, string>;
  mappedData: Partial<Lead> & {
    deal_value?: number;
    payment_type?: PaymentType;
    amount_paid?: number;
    payment_status?: PaymentStatus;
    monthly_amount?: number;
    next_payment_date?: string;
  };
  errors: string[];
  isDuplicate: boolean;
  duplicateReason?: string;
  existingRecord?: Lead;
  duplicateResolution: 'skip' | 'update' | 'create_anyway';
}

export interface CsvImportSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  importedRows: number;
  skippedRows: number;
  updatedRows: number;
  failedRows: number;
  dealsCreated?: number;
  paymentsCreated?: number;
  errorMessage?: string | null;
}
