-- ========================================================
-- DEALS PAYMENT TRACKING & PAYMENTS HISTORY TABLE MIGRATION
-- ========================================================

-- 1. Add Payment Tracking Columns to public.deals (if they do not already exist)
DO $do$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'deals' AND column_name = 'payment_type') THEN
        ALTER TABLE public.deals ADD COLUMN payment_type VARCHAR(50) DEFAULT 'ONE_TIME';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'deals' AND column_name = 'total_amount') THEN
        ALTER TABLE public.deals ADD COLUMN total_amount NUMERIC(15, 2) DEFAULT 0.00;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'deals' AND column_name = 'amount_paid') THEN
        ALTER TABLE public.deals ADD COLUMN amount_paid NUMERIC(15, 2) DEFAULT 0.00;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'deals' AND column_name = 'amount_remaining') THEN
        ALTER TABLE public.deals ADD COLUMN amount_remaining NUMERIC(15, 2) DEFAULT 0.00;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'deals' AND column_name = 'payment_status') THEN
        ALTER TABLE public.deals ADD COLUMN payment_status VARCHAR(50) DEFAULT 'PENDING';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'deals' AND column_name = 'monthly_amount') THEN
        ALTER TABLE public.deals ADD COLUMN monthly_amount NUMERIC(15, 2) DEFAULT 0.00;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'deals' AND column_name = 'billing_start_date') THEN
        ALTER TABLE public.deals ADD COLUMN billing_start_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'deals' AND column_name = 'next_payment_date') THEN
        ALTER TABLE public.deals ADD COLUMN next_payment_date DATE;
    END IF;
END $do$;

-- 2. Populate initial values for existing deals if necessary
UPDATE public.deals
SET 
    total_amount = COALESCE(NULLIF(total_amount, 0), value, 0.00),
    amount_remaining = CASE 
        WHEN amount_remaining IS NULL OR amount_remaining = 0 THEN GREATEST(0.00, COALESCE(NULLIF(total_amount, 0), value, 0.00) - COALESCE(amount_paid, 0.00))
        ELSE amount_remaining
    END,
    payment_status = CASE 
        WHEN COALESCE(amount_paid, 0.00) >= COALESCE(NULLIF(total_amount, 0), value, 0.00) AND COALESCE(NULLIF(total_amount, 0), value, 0.00) > 0 THEN 'PAID'
        WHEN COALESCE(amount_paid, 0.00) > 0 THEN 'PARTIALLY_PAID'
        ELSE 'PENDING'
    END
WHERE total_amount IS NULL OR total_amount = 0.00;

-- 3. Create public.payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_type VARCHAR(50) DEFAULT 'ONE_TIME', -- ONE_TIME, MONTHLY_RECURRING
    payment_method VARCHAR(50) DEFAULT 'UPI', -- Cash, UPI, Bank Transfer, Card, Other
    status VARCHAR(50) DEFAULT 'COMPLETED', -- COMPLETED, PENDING, FAILED
    notes TEXT,
    cycle_period VARCHAR(50),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS idx_payments_org ON public.payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_deal ON public.payments(deal_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

CREATE INDEX IF NOT EXISTS idx_deals_payment_status ON public.deals(payment_status);
CREATE INDEX IF NOT EXISTS idx_deals_payment_type ON public.deals(payment_type);
CREATE INDEX IF NOT EXISTS idx_deals_next_payment ON public.deals(next_payment_date);

-- 5. Row Level Security (RLS)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can read payments" ON public.payments;
CREATE POLICY "Org members can read payments"
    ON public.payments FOR SELECT
    USING (public.user_belongs_to_org(organization_id));

DROP POLICY IF EXISTS "Org members can insert payments" ON public.payments;
CREATE POLICY "Org members can insert payments"
    ON public.payments FOR INSERT
    WITH CHECK (public.user_belongs_to_org(organization_id));

DROP POLICY IF EXISTS "Org members can update payments" ON public.payments;
CREATE POLICY "Org members can update payments"
    ON public.payments FOR UPDATE
    USING (public.user_belongs_to_org(organization_id));

DROP POLICY IF EXISTS "Org members can delete payments" ON public.payments;
CREATE POLICY "Org members can delete payments"
    ON public.payments FOR DELETE
    USING (public.user_belongs_to_org(organization_id));
