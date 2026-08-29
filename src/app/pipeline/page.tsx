'use client';

import { CrmLayout } from '@/components/layout/crm-layout';
import { KanbanBoard } from '@/components/pipeline/kanban-board';

export default function PipelinePage() {
  return (
    <CrmLayout>
      <KanbanBoard />
    </CrmLayout>
  );
}
