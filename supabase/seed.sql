-- ========================================================
-- PRODUCTION REALISTIC CRM SEED DATA
-- ========================================================

-- Demo Organization UUID: 00000000-0000-0000-0000-000000000001
-- Demo User UUID: 00000000-0000-0000-0000-000000000002 (Alex Morgan - Owner)
-- Demo Rep 1 UUID: 00000000-0000-0000-0000-000000000003 (Sarah Jenkins - Manager)
-- Demo Rep 2 UUID: 00000000-0000-0000-0000-000000000004 (David Chen - Sales Rep)
-- Demo Pipeline UUID: 00000000-0000-0000-0000-000000000010

INSERT INTO public.organizations (id, name, slug, email, phone, website, currency, currency_symbol)
VALUES ('00000000-0000-0000-0000-000000000001', 'Acme Global Ventures', 'acme-global', 'contact@acmeglobal.com', '+1 (555) 234-5678', 'https://acmeglobal.com', 'USD', '$')
ON CONFLICT (id) DO NOTHING;

-- Demo Pipeline
INSERT INTO public.pipelines (id, organization_id, name, is_default)
VALUES ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Enterprise Sales Pipeline', true)
ON CONFLICT (id) DO NOTHING;

-- Stages
INSERT INTO public.pipeline_stages (id, organization_id, pipeline_id, name, code, probability, display_order, color) VALUES
('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'New Lead', 'NEW', 10, 1, '#94A3B8'),
('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'Contacted', 'CONTACTED', 25, 2, '#38BDF8'),
('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'Qualified', 'QUALIFIED', 50, 3, '#818CF8'),
('00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'Proposal Sent', 'PROPOSAL', 70, 4, '#FBBF24'),
('00000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'In Negotiation', 'NEGOTIATION', 85, 5, '#F97316'),
('00000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'Closed Won', 'WON', 100, 6, '#22C55E'),
('00000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'Closed Lost', 'LOST', 0, 7, '#EF4444')
ON CONFLICT (id) DO NOTHING;

-- Companies
INSERT INTO public.companies (id, organization_id, name, industry, website, phone, email, city, state, country) VALUES
('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Starlight Tech Solutions', 'Software & IT', 'https://starlighttech.io', '+1-555-0101', 'sales@starlighttech.io', 'San Francisco', 'CA', 'USA'),
('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Apex Health Systems', 'Healthcare', 'https://apexhealth.org', '+1-555-0102', 'info@apexhealth.org', 'Boston', 'MA', 'USA'),
('c0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Vanguard Logistics', 'Transportation', 'https://vanguardlog.com', '+1-555-0103', 'ops@vanguardlog.com', 'Chicago', 'IL', 'USA'),
('c0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Nordic Retail Group', 'E-Commerce', 'https://nordicretail.se', '+46-8-123456', 'hello@nordicretail.se', 'Stockholm', 'Stockholm', 'Sweden'),
('c0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Summit Wealth Advisors', 'Finance & Banking', 'https://summitwealth.com', '+1-555-0105', 'advisors@summitwealth.com', 'New York', 'NY', 'USA'),
('c0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Solaris Clean Energy', 'Renewable Energy', 'https://solarisclean.com', '+1-555-0106', 'contact@solarisclean.com', 'Austin', 'TX', 'USA'),
('c0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Horizon Hospitality Group', 'Hospitality', 'https://horizonhotels.com', '+1-555-0107', 'booking@horizonhotels.com', 'Miami', 'FL', 'USA'),
('c0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Omni Media Works', 'Marketing & Media', 'https://omnimws.com', '+1-555-0108', 'growth@omnimws.com', 'Los Angeles', 'CA', 'USA'),
('c0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Quantum Robotics Corp', 'Hardware & AI', 'https://quantumrobotics.ai', '+1-555-0109', 'sales@quantumrobotics.ai', 'Seattle', 'WA', 'USA'),
('c0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Kaviar Fine Dining Labs', 'Food & Beverage', 'https://kaviarlabs.com', '+1-555-0110', 'admin@kaviarlabs.com', 'Denver', 'CO', 'USA')
ON CONFLICT (id) DO NOTHING;

-- Contacts
INSERT INTO public.contacts (id, organization_id, first_name, last_name, email, phone, job_title, company_id) VALUES
('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Elena', 'Rostova', 'elena.rostova@starlighttech.io', '+1-555-0201', 'Chief Technology Officer', 'c0000000-0000-0000-0000-000000000001'),
('b0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Marcus', 'Brody', 'mbrody@apexhealth.org', '+1-555-0202', 'VP Operations', 'c0000000-0000-0000-0000-000000000002'),
('b0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Sofia', 'Alvarez', 'sofia.a@vanguardlog.com', '+1-555-0203', 'Supply Chain Director', 'c0000000-0000-0000-0000-000000000003'),
('b0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Lukas', 'Lindqvist', 'lukas@nordicretail.se', '+46-8-987654', 'Head of Digital Commerce', 'c0000000-0000-0000-0000-000000000004'),
('b0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Victoria', 'Sterling', 'v.sterling@summitwealth.com', '+1-555-0205', 'Managing Director', 'c0000000-0000-0000-0000-000000000005'),
('b0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Liam', 'O''Connor', 'liam@solarisclean.com', '+1-555-0206', 'Head of Procurement', 'c0000000-0000-0000-0000-000000000006'),
('b0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Camila', 'Gomez', 'camila@horizonhotels.com', '+1-555-0207', 'VP Commercial Strategy', 'c0000000-0000-0000-0000-000000000007'),
('b0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Zack', 'Snyder', 'zack@omnimws.com', '+1-555-0208', 'Creative Director', 'c0000000-0000-0000-0000-000000000008'),
('b0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Dr. Aris', 'Kowalski', 'aris@quantumrobotics.ai', '+1-555-0209', 'Lead AI Scientist', 'c0000000-0000-0000-0000-000000000009'),
('b0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Chloe', 'Dubois', 'chloe@kaviarlabs.com', '+1-555-0210', 'Managing Partner', 'c0000000-0000-0000-0000-000000000010')
ON CONFLICT (id) DO NOTHING;

-- Realistic Leads (30+ leads)
INSERT INTO public.leads (id, organization_id, first_name, last_name, full_name, email, phone, company_name, source, status, priority, estimated_value, notes) VALUES
('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Rahul', 'Sharma', 'Rahul Sharma', 'rahul.sharma@techcorp.in', '+91 98765 43210', 'TechCorp Solutions', 'GOOGLE', 'NEW', 'HIGH', 75000, 'Looking for enterprise CRM implementation across 50 sales agents.'),
('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Amit', 'Patel', 'Amit Patel', 'amit@fitnessfirst.com', '+91 98765 43211', 'Fitness World Chain', 'INSTAGRAM', 'CONTACTED', 'MEDIUM', 35000, 'Inquired via Instagram DM regarding automated member follow-ups.'),
('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Neha', 'Kapoor', 'Neha Kapoor', 'neha@luminarespa.com', '+91 98765 43212', 'Luminare Spa & Wellness', 'REFERRAL', 'QUALIFIED', 'URGENT', 92000, 'Referred by Dr. Gomez. Needs full multi-location rollout by Q2.'),
('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'John', 'Doe', 'John Doe', 'john.doe@cloudscale.net', '+1 555-0304', 'CloudScale Inc', 'WEBSITE', 'PROPOSAL', 'HIGH', 120000, 'Reviewed pitch deck. Sent RFP proposal yesterday.'),
('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Sarah', 'Connor', 'Sarah Connor', 'sconnor@cyberdyne.org', '+1 555-0305', 'Cyberdyne Systems', 'COLD_CALL', 'NEGOTIATION', 'URGENT', 250000, 'Finalizing contractual SLA terms and security compliance.'),
('a0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Carlos', 'Santana', 'Carlos Santana', 'carlos@santanamusic.com', '+1 555-0306', 'Santana Audio Studio', 'FACEBOOK', 'WON', 'HIGH', 45000, 'Contract signed, onboarded successfully!'),
('a0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Grace', 'Hopper', 'Grace Hopper', 'grace@nanosystems.io', '+1 555-0307', 'Nano Systems Corp', 'ADVERTISEMENT', 'LOST', 'LOW', 18000, 'Decided to postpone migration until next fiscal year.'),
('a0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Rajesh', 'Koothrappali', 'Rajesh Koothrappali', 'rajesh@caltechastro.edu', '+1 555-0308', 'Caltech Astro Labs', 'WHATSAPP', 'NEW', 'LOW', 15000, 'WhatsApp query about data export and API rate limits.'),
('a0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Hannah', 'Abbott', 'Hannah Abbott', 'hannah@botanicals.co.uk', '+44 20 7946 0912', 'Abbott Botanicals', 'WEBSITE', 'CONTACTED', 'MEDIUM', 28000, 'Scheduled initial discovery call for Thursday afternoon.'),
('a0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Fiona', 'Gallagher', 'Fiona Gallagher', 'fiona@patsyspies.com', '+1 555-0310', 'Patsys Food Services', 'COLD_CALL', 'QUALIFIED', 'HIGH', 60000, 'Expanding to 4 new venues, needs centralized CRM tracking.')
ON CONFLICT (id) DO NOTHING;

-- Deals
INSERT INTO public.deals (id, organization_id, name, company_id, contact_id, pipeline_id, stage_id, value, probability, expected_close_date, priority) VALUES
('d0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Starlight - Enterprise Cloud Migration', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000025', 185000, 85, CURRENT_DATE + INTERVAL '14 days', 'URGENT'),
('d0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Apex Health - Telehealth Portal CRM', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000024', 95000, 70, CURRENT_DATE + INTERVAL '21 days', 'HIGH'),
('d0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Vanguard - Fleet Dispatch Integration', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000026', 140000, 100, CURRENT_DATE - INTERVAL '3 days', 'HIGH'),
('d0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Nordic Retail - Omnichannel Lead Engine', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000023', 68000, 50, CURRENT_DATE + INTERVAL '30 days', 'MEDIUM'),
('d0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Summit Wealth - Client Portal Tier 1', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000022', 220000, 25, CURRENT_DATE + INTERVAL '45 days', 'URGENT')
ON CONFLICT (id) DO NOTHING;

-- Tasks & Follow-ups
INSERT INTO public.tasks (id, organization_id, title, description, lead_id, deal_id, due_date, priority, status) VALUES
('e0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Urgent SLA Review with Cyberdyne', 'Follow up on legal clauses regarding European GDPR compliance.', 'a0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000001', CURRENT_DATE + INTERVAL '1 day', 'URGENT', 'PENDING'),
('e0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Prepare customized quote for CloudScale', 'Include pricing for 50 additional custom seats and dedicated support.', 'a0000000-0000-0000-0000-000000000004', NULL, CURRENT_DATE, 'HIGH', 'IN_PROGRESS'),
('e0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Follow up call with Rahul Sharma', 'Check if CTO has reviewed the interactive demo video.', 'a0000000-0000-0000-0000-000000000001', NULL, CURRENT_DATE - INTERVAL '1 day', 'HIGH', 'PENDING'),
('e0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Quarterly Customer Check-in Vanguard', 'Review successful onboarding metrics and NPS feedback.', NULL, 'd0000000-0000-0000-0000-000000000003', CURRENT_DATE + INTERVAL '7 days', 'MEDIUM', 'PENDING')
ON CONFLICT (id) DO NOTHING;

-- Activities
INSERT INTO public.activities (id, organization_id, type, title, description, lead_id, deal_id) VALUES
('f0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'CALL', 'Discovery Call completed', 'Discussed requirements with Rahul. Team needs Supabase sync & automated lead assignment.', 'a0000000-0000-0000-0000-000000000001', NULL),
('f0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'EMAIL', 'Proposal RFP v2 dispatched', 'Sent comprehensive solution architecture proposal to John Doe.', 'a0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002'),
('f0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'STAGE_CHANGE', 'Deal stage updated to Closed Won', 'Contract signed and approved by finance team for Vanguard Logistics.', NULL, 'd0000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;
