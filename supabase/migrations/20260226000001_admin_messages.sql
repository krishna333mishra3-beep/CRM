-- ========================================================
-- 18. ADMINS ROOM MESSAGES (REALTIME COLLABORATION)
-- ========================================================

CREATE TABLE IF NOT EXISTS public.admin_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    sender_name VARCHAR(255) NOT NULL,
    sender_email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    tag VARCHAR(50) DEFAULT 'GENERAL', -- GENERAL, URGENT, DEAL_UPDATE, CALL_DISPOSITION, LEAD_NOTE
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_messages_org ON public.admin_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_admin_messages_created ON public.admin_messages(created_at DESC);

ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view admin messages within their organization"
ON public.admin_messages FOR SELECT
USING (public.user_belongs_to_org(organization_id));

CREATE POLICY "Users can insert admin messages in their organization"
ON public.admin_messages FOR INSERT
WITH CHECK (public.user_belongs_to_org(organization_id));
