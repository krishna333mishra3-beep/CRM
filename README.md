# First Click CRM — Production Ready Full-Stack SaaS

A modern, commercial multi-tenant CRM web application built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL, Auth, RLS, Storage, Realtime)**.

---

## 🌟 Key Features

### 1. Authentication & Multi-Tenancy
- **Supabase Auth**: Email/password authentication, Google OAuth SSO integration, session persistence.
- **Organization Isolation**: Strict PostgreSQL Row Level Security (`RLS`) enforcing tenant boundaries with `user_belongs_to_org` function.
- **RBAC Roles**: `Owner`, `Admin`, `Manager`, `Sales Executive`, `Employee`, `Viewer`.

### 2. Comprehensive Leads Module & Advanced CSV Importer
- **Full Lead Lifecycle**: `NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL`, `NEGOTIATION`, `WON`, `LOST`.
- **Multi-channel Acquisition Sources**: Website, Instagram, Facebook, Google, WhatsApp, Referral, Cold Call, Advertisement, Scraped, Manual.
- **Production-Grade CSV Importer**:
  - Drag & drop CSV file parser with PapaParse.
  - Sample CSV template generation & download.
  - Dynamic visual column mapping with intelligent heuristic matching.
  - Pre-import validation engine flagging specific invalid row numbers and reasons.
  - Duplicate detection engine (checks existing DB records by Email & Phone, plus file internal duplicates).
  - Granular duplicate resolution options: `Skip`, `Update Existing`, `Create Anyway`.
  - Real batch insertion into the CRM database with complete metrics reporting.
- **CSV Exporter**: Exports filtered sets for Leads, Contacts, Companies, and Deals.

### 3. Sales Pipeline & Interactive Drag & Drop Kanban
- Visual columns: `New Lead`, `Contacted`, `Qualified`, `Proposal Sent`, `In Negotiation`, `Closed Won`, `Closed Lost`.
- Drag-and-drop cards with automatic deal probability calculation, stage transition logging, activity recording, and audit trails.

### 4. Executive Analytics & Dashboard
- **Top KPI Cards**: Total Leads, New Leads, Qualified Leads, Open Deals, Won Revenue, Pipeline Total Value, Win Conversion Rate.
- **Interactive Recharts**:
  - Leads Inflow & Growth Trend.
  - Lead Acquisition Source Distribution (Donut Chart).
  - Pipeline Stages Value Breakdown (Bar Chart).
  - Quota Target vs Actual Revenue Leaderboard.

### 5. Multi-Entity Management
- **Companies**: Firmographic details, address, website, linked contacts, deal volume summaries.
- **Contacts**: Directory with job titles, corporate affiliations, and direct communications.
- **Deals**: Commercial terms, close dates, win probabilities, owner assignments.
- **Tasks & Follow-ups**: Dedicated Overdue, Today, Upcoming, and Completed views.
- **Activities & Timeline**: Chronological interaction logs for calls, emails, WhatsApp messages, meetings, notes, and stage changes.
- **Global Search**: Debounced search bar with instant multi-entity preview and deep links.
- **Custom Fields Engine**: Extensible fields (Text, Number, Date, Boolean, Select) for all entities.
- **Audit Logs**: Immutable log of record modifications and team actions.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Run Supabase Database Migrations
Apply the migration in `supabase/migrations/20260225000000_crm_schema.sql` and `supabase/seed.sql` in your Supabase SQL Editor.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

### 5. Build for Production
```bash
npm run build
npm start
```
