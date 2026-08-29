'use client';

import { CrmLayout } from '@/components/layout/crm-layout';
import { DashboardView } from '@/components/dashboard/dashboard-view';

export default function DashboardPage() {
  return (
    <CrmLayout>
      <DashboardView />
    </CrmLayout>
  );
}
