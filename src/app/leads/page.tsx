'use client';

import React, { Suspense } from 'react';
import { CrmLayout } from '@/components/layout/crm-layout';
import { LeadsTable } from '@/components/leads/leads-table';

export default function LeadsPage() {
  return (
    <CrmLayout>
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading leads...</div>}>
        <LeadsTable />
      </Suspense>
    </CrmLayout>
  );
}
