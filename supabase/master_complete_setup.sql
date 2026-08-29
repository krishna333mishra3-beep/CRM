-- ========================================================
-- FIRST CLICK CRM — COMPLETE CONSOLIDATED POSTGRESQL SCHEMA
-- Ready to execute in Supabase SQL Editor (https://supabase.com/dashboard/project/myqegsydtpbkiarqobkp/sql)
-- ========================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ORGANIZATIONS
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    logo_url TEXT,
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency VARCHAR(10) DEFAULT 'INR',
    currency_symbol VARCHAR(10) DEFAULT '₹',
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. USER PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    phone VARCHAR(50),
    title VARCHAR(100),
    is_super_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ORGANIZATION MEMBERS (Roles & Permissions)
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'Sales Executive',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(organization_id, user_id)
);

-- 4. PIPELINES & STAGES
CREATE TABLE IF NOT EXISTS public.pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    probability INT DEFAULT 0,
    display_order INT DEFAULT 0,
    color VARCHAR(50) DEFAULT '#6366F1',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. COMPANIES
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    website VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. CONTACTS
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    full_name VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || COALESCE(last_name, '')) STORED,
    email VARCHAR(255),
    phone VARCHAR(50),
    job_title VARCHAR(100),
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. LEADS (Inquiries, Telecalling, CSV imports)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company_name VARCHAR(255),
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    source VARCHAR(50) DEFAULT 'MANUAL',
    status VARCHAR(50) DEFAULT 'NEW',
    priority VARCHAR(50) DEFAULT 'MEDIUM',
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    estimated_value NUMERIC(15, 2) DEFAULT 0.00,
    notes TEXT,
    custom_data JSONB DEFAULT '{}'::jsonb,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. DEALS & PAYMENT STRUCTURE
CREATE TABLE IF NOT EXISTS public.deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES public.pipeline_stages(id) ON DELETE RESTRICT,
    value NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    probability INT DEFAULT 10,
    expected_close_date DATE,
    actual_close_date DATE,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    source VARCHAR(50) DEFAULT 'MANUAL',
    priority VARCHAR(50) DEFAULT 'MEDIUM',
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    
    -- Payment management columns
    payment_type VARCHAR(50) DEFAULT 'ONE_TIME',
    total_amount NUMERIC(15, 2) DEFAULT 0.00,
    amount_paid NUMERIC(15, 2) DEFAULT 0.00,
    amount_remaining NUMERIC(15, 2) DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    monthly_amount NUMERIC(15, 2) DEFAULT 0.00,
    billing_start_date DATE,
    next_payment_date DATE,

    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. PAYMENTS (Transaction History)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_type VARCHAR(50) DEFAULT 'ONE_TIME',
    payment_method VARCHAR(50) DEFAULT 'UPI',
    status VARCHAR(50) DEFAULT 'COMPLETED',
    notes TEXT,
    cycle_period VARCHAR(50),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. ACTIVITIES (Calls, WhatsApp, Meetings, Emails, Dispositions)
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. TASKS & CALLBACKS
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    due_date TIMESTAMPTZ,
    priority VARCHAR(50) DEFAULT 'MEDIUM',
    status VARCHAR(50) DEFAULT 'PENDING',
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. NOTES
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO',
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. CUSTOM FIELDS & VALUES
CREATE TABLE IF NOT EXISTS public.custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL,
    options JSONB DEFAULT '[]'::jsonb,
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.custom_field_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    custom_field_id UUID NOT NULL REFERENCES public.custom_fields(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(custom_field_id, entity_id)
);

-- 16. ATTACHMENTS
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 17. ADMIN MESSAGES (Realtime Admin Room)
CREATE TABLE IF NOT EXISTS public.admin_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    sender_name VARCHAR(255) NOT NULL,
    sender_email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    tag VARCHAR(50) DEFAULT 'GENERAL',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ========================================================
-- INDEXES
-- ========================================================

CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);

CREATE INDEX IF NOT EXISTS idx_leads_org ON public.leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_owner ON public.leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contacts_org ON public.contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON public.contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);

CREATE INDEX IF NOT EXISTS idx_companies_org ON public.companies(organization_id);
CREATE INDEX IF NOT EXISTS idx_companies_owner ON public.companies(owner_id);

CREATE INDEX IF NOT EXISTS idx_deals_org ON public.deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_deals_pipeline ON public.deals(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_owner ON public.deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_payment_status ON public.deals(payment_status);
CREATE INDEX IF NOT EXISTS idx_deals_payment_type ON public.deals(payment_type);

CREATE INDEX IF NOT EXISTS idx_payments_deal ON public.payments(deal_id);
CREATE INDEX IF NOT EXISTS idx_payments_org ON public.payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_activities_org ON public.activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_activities_lead ON public.activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_deal ON public.activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_activities_created ON public.activities(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_org ON public.tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

CREATE INDEX IF NOT EXISTS idx_notes_org ON public.notes(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON public.audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_messages_org ON public.admin_messages(organization_id, created_at ASC);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check org membership
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = org_id
        AND user_id = auth.uid()
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view profiles of their org co-members" ON public.profiles;
CREATE POLICY "Users can view profiles of their org co-members"
    ON public.profiles FOR SELECT
    USING (
        id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.organization_members m1
            JOIN public.organization_members m2 ON m1.organization_id = m2.organization_id
            WHERE m1.user_id = auth.uid() AND m2.user_id = profiles.id
        )
    );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Organizations Policies
DROP POLICY IF EXISTS "Members can view their organization" ON public.organizations;
CREATE POLICY "Members can view their organization" ON public.organizations FOR SELECT USING (public.user_belongs_to_org(id));

DROP POLICY IF EXISTS "Org admins can update organization" ON public.organizations;
CREATE POLICY "Org admins can update organization" ON public.organizations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = organizations.id
            AND user_id = auth.uid()
            AND role IN ('Owner', 'Admin')
        )
    );

DROP POLICY IF EXISTS "Authenticated users can create organization" ON public.organizations;
CREATE POLICY "Authenticated users can create organization" ON public.organizations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Organization Members Policies
DROP POLICY IF EXISTS "Members can view organization members" ON public.organization_members;
CREATE POLICY "Members can view organization members" ON public.organization_members FOR SELECT USING (public.user_belongs_to_org(organization_id));

DROP POLICY IF EXISTS "Admins can manage organization members" ON public.organization_members;
CREATE POLICY "Admins can manage organization members" ON public.organization_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = organization_members.organization_id
            AND user_id = auth.uid()
            AND role IN ('Owner', 'Admin')
        )
    );

-- Standard Org Tables RLS Policies (Leads, Deals, Payments, Contacts, Companies, Tasks, Activities, Notes)
DROP POLICY IF EXISTS "Org members can read leads" ON public.leads;
CREATE POLICY "Org members can read leads" ON public.leads FOR SELECT USING (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org members can insert leads" ON public.leads;
CREATE POLICY "Org members can insert leads" ON public.leads FOR INSERT WITH CHECK (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org members can update leads" ON public.leads;
CREATE POLICY "Org members can update leads" ON public.leads FOR UPDATE USING (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org members can delete leads" ON public.leads;
CREATE POLICY "Org members can delete leads" ON public.leads FOR DELETE USING (public.user_belongs_to_org(organization_id));

DROP POLICY IF EXISTS "Org members can read contacts" ON public.contacts;
CREATE POLICY "Org members can read contacts" ON public.contacts FOR SELECT USING (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org members can insert contacts" ON public.contacts;
CREATE POLICY "Org members can insert contacts" ON public.contacts FOR INSERT WITH CHECK (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org members can update contacts" ON public.contacts;
CREATE POLICY "Org members can update contacts" ON public.contacts FOR UPDATE USING (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org members can delete contacts" ON public.contacts;
CREATE POLICY "Org members can delete contacts" ON public.contacts FOR DELETE USING (public.user_belongs_to_org(organization_id));

DROP POLICY IF EXISTS "Org members can read companies" ON public.companies;
CREATE POLICY "Org members can read companies" ON public.companies FOR SELECT USING (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org members can insert companies" ON public.companies;
CREATE POLICY "Org members can insert companies" ON public.companies FOR INSERT WITH CHECK (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org members can update companies" ON public.companies;
CREATE POLICY "Org members can update companies" ON public.companies FOR UPDATE USING (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org members can delete companies" ON public.companies;
CREATE POLICY "Org members can delete companies" ON public.companies FOR DELETE USING (public.user_belongs_to_org(organization_id));

DROP POLICY IF EXISTS "Org members can read pipelines" ON public.pipelines;
CREATE POLICY "Org members can read pipelines" ON public.pipelines FOR SELECT USING (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org admins can manage pipelines" ON public.pipelines;
CREATE POLICY "Org admins can manage pipelines" ON public.pipelines FOR ALL USING (public.user_belongs_to_org(organization_id));

DROP POLICY IF EXISTS "Org members can read pipeline_stages" ON public.pipeline_stages;
CREATE POLICY "Org members can read pipeline_stages" ON public.pipeline_stages FOR SELECT USING (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org admins can manage pipeline_stages" ON public.pipeline_stages;
CREATE POLICY "Org admins can manage pipeline_stages" ON public.pipeline_stages FOR ALL USING (public.user_belongs_to_org(organization_id));

DROP POLICY IF EXISTS "Org members can read deals" ON public.deals;
CREATE POLICY "Org members can read deals" ON public.deals FOR SELECT USING (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org members can insert deals" ON public.deals;
CREATE POLICY "Org members can insert deals" ON public.deals FOR INSERT WITH CHECK (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org members can update deals" ON public.deals;
CREATE POLICY "Org members can update deals" ON public.deals FOR UPDATE USING (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org members can delete deals" ON public.deals;
CREATE POLICY "Org members can delete deals" ON public.deals FOR DELETE USING (public.user_belongs_to_org(organization_id));

DROP POLICY IF EXISTS "Org members can read payments" ON public.payments;
CREATE POLICY "Org members can read payments" ON public.payments FOR SELECT USING (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org members can insert payments" ON public.payments;
CREATE POLICY "Org members can insert payments" ON public.payments FOR INSERT WITH CHECK (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org members can update payments" ON public.payments;
CREATE POLICY "Org members can update payments" ON public.payments FOR UPDATE USING (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org members can delete payments" ON public.payments;
CREATE POLICY "Org members can delete payments" ON public.payments FOR DELETE USING (public.user_belongs_to_org(organization_id));

DROP POLICY IF EXISTS "Org members can read activities" ON public.activities;
CREATE POLICY "Org members can read activities" ON public.activities FOR SELECT USING (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org members can insert activities" ON public.activities;
CREATE POLICY "Org members can insert activities" ON public.activities FOR INSERT WITH CHECK (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org members can update activities" ON public.activities;
CREATE POLICY "Org members can update activities" ON public.activities FOR UPDATE USING (public.user_belongs_to_org(organization_id));

DROP POLICY IF EXISTS "Org members can read tasks" ON public.tasks;
CREATE POLICY "Org members can read tasks" ON public.tasks FOR SELECT USING (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org members can insert tasks" ON public.tasks;
CREATE POLICY "Org members can insert tasks" ON public.tasks FOR INSERT WITH CHECK (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org members can update tasks" ON public.tasks;
CREATE POLICY "Org members can update tasks" ON public.tasks FOR UPDATE USING (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org members can delete tasks" ON public.tasks;
CREATE POLICY "Org members can delete tasks" ON public.tasks FOR DELETE USING (public.user_belongs_to_org(organization_id));

DROP POLICY IF EXISTS "Org members can read notes" ON public.notes;
CREATE POLICY "Org members can read notes" ON public.notes FOR SELECT USING (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org members can insert notes" ON public.notes;
CREATE POLICY "Org members can insert notes" ON public.notes FOR INSERT WITH CHECK (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org members can update notes" ON public.notes;
CREATE POLICY "Org members can update notes" ON public.notes FOR UPDATE USING (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org members can delete notes" ON public.notes;
CREATE POLICY "Org members can delete notes" ON public.notes FOR DELETE USING (public.user_belongs_to_org(organization_id));

DROP POLICY IF EXISTS "Users can read their notifications" ON public.notifications;
CREATE POLICY "Users can read their notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Org members can insert notifications" ON public.notifications;
CREATE POLICY "Org members can insert notifications" ON public.notifications FOR INSERT WITH CHECK (public.user_belongs_to_org(organization_id));

DROP POLICY IF EXISTS "Org members can read audit logs" ON public.audit_logs;
CREATE POLICY "Org members can read audit logs" ON public.audit_logs FOR SELECT USING (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org members can insert audit logs" ON public.audit_logs;
CREATE POLICY "Org members can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (public.user_belongs_to_org(organization_id));

DROP POLICY IF EXISTS "Org members can read custom fields" ON public.custom_fields;
CREATE POLICY "Org members can read custom fields" ON public.custom_fields FOR SELECT USING (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org admins can manage custom fields" ON public.custom_fields;
CREATE POLICY "Org admins can manage custom fields" ON public.custom_fields FOR ALL USING (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org members can access custom field values" ON public.custom_field_values;
CREATE POLICY "Org members can access custom field values" ON public.custom_field_values FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.custom_fields cf
        WHERE cf.id = custom_field_values.custom_field_id
        AND public.user_belongs_to_org(cf.organization_id)
    )
);

DROP POLICY IF EXISTS "Org members can read attachments" ON public.attachments;
CREATE POLICY "Org members can read attachments" ON public.attachments FOR SELECT USING (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org members can insert attachments" ON public.attachments;
CREATE POLICY "Org members can insert attachments" ON public.attachments FOR INSERT WITH CHECK (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org members can delete attachments" ON public.attachments;
CREATE POLICY "Org members can delete attachments" ON public.attachments FOR DELETE USING (public.user_belongs_to_org(organization_id));

DROP POLICY IF EXISTS "Org members can view admin messages" ON public.admin_messages;
CREATE POLICY "Org members can view admin messages" ON public.admin_messages FOR SELECT USING (public.user_belongs_to_org(organization_id));
DROP POLICY IF EXISTS "Org members can send admin messages" ON public.admin_messages;
CREATE POLICY "Org members can send admin messages" ON public.admin_messages FOR INSERT WITH CHECK (public.user_belongs_to_org(organization_id));

-- ========================================================
-- AUTOMATIC PROFILE TRIGGER ON SIGNUP
-- ========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
    default_pipeline_id UUID;
BEGIN
    -- 1. Insert Profile
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;

    -- 2. Create Default Organization for the user if they are registering fresh
    INSERT INTO public.organizations (name, slug, email)
    VALUES (
        COALESCE(new.raw_user_meta_data->>'org_name', split_part(new.email, '@', 1) || '''s CRM'),
        lower(regexp_replace(COALESCE(new.raw_user_meta_data->>'org_name', split_part(new.email, '@', 1)), '[^a-zA-Z0-9]', '-', 'g')) || '-' || substring(gen_random_uuid()::text from 1 for 6),
        new.email
    ) RETURNING id INTO new_org_id;

    -- 3. Make user the Owner in organization_members
    INSERT INTO public.organization_members (organization_id, user_id, role, status)
    VALUES (new_org_id, new.id, 'Owner', 'active')
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    -- 4. Create Standard Sales Pipeline & Stages
    INSERT INTO public.pipelines (organization_id, name, is_default)
    VALUES (new_org_id, 'Standard Sales Pipeline', true)
    RETURNING id INTO default_pipeline_id;

    INSERT INTO public.pipeline_stages (organization_id, pipeline_id, name, code, probability, display_order, color) VALUES
    (new_org_id, default_pipeline_id, 'New Lead', 'NEW', 10, 1, '#94A3B8'),
    (new_org_id, default_pipeline_id, 'Contacted', 'CONTACTED', 25, 2, '#38BDF8'),
    (new_org_id, default_pipeline_id, 'Qualified', 'QUALIFIED', 50, 3, '#818CF8'),
    (new_org_id, default_pipeline_id, 'Proposal Sent', 'PROPOSAL', 70, 4, '#FBBF24'),
    (new_org_id, default_pipeline_id, 'In Negotiation', 'NEGOTIATION', 85, 5, '#F97316'),
    (new_org_id, default_pipeline_id, 'Closed Won', 'WON', 100, 6, '#22C55E'),
    (new_org_id, default_pipeline_id, 'Closed Lost', 'LOST', 0, 7, '#EF4444');

    -- 5. Welcome Notification
    INSERT INTO public.notifications (organization_id, user_id, title, message, type)
    VALUES (
        new_org_id,
        new.id,
        'Welcome to your CRM!',
        'Your organization and sales pipeline are ready. Start adding leads or import your CSV.',
        'INFO'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ========================================================
-- RELOAD POSTGREST SCHEMA CACHE
-- ========================================================
NOTIFY pgrst, 'reload schema';
