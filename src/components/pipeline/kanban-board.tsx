'use client';

import React, { useState } from 'react';
import {
  KanbanSquare,
  Plus,
  DollarSign,
  Building,
  Calendar,
  MoreVertical,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  User,
  CreditCard,
  Repeat,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useCrm } from '@/context/crm-context';
import { useAuth } from '@/context/auth-context';
import { Deal, PipelineStage, PaymentStatus } from '@/types/crm';
import { formatCurrency, formatDate, getPriorityColor } from '@/lib/utils';
import { DealModal } from '@/components/deals/deal-modal';

export function KanbanBoard() {
  const { deals, pipeline, updateDealStage } = useCrm();
  const { organization } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStageForNewDeal, setSelectedStageForNewDeal] = useState<string | undefined>(undefined);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const stages = pipeline?.stages || [];

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('text/plain', dealId);
    setDraggedDealId(dealId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain') || draggedDealId;
    if (!dealId) return;

    const deal = deals.find((d) => d.id === dealId);
    const targetStage = stages.find((s) => s.id === targetStageId);

    if (deal && deal.stage_id !== targetStageId) {
      updateDealStage(dealId, targetStageId);
      setToastMessage(`Moved "${deal.name}" to ${targetStage?.name || 'New Stage'}`);
      setTimeout(() => setToastMessage(null), 3000);
    }
    setDraggedDealId(null);
  };

  const getPaymentBadge = (status?: PaymentStatus) => {
    const s = status || 'PENDING';
    if (s === 'PAID') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-2.5 h-2.5" /> PAID
        </span>
      );
    }
    if (s === 'PARTIALLY_PAID') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-2.5 h-2.5" /> PARTIAL
        </span>
      );
    }
    if (s === 'OVERDUE') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-2.5 h-2.5" /> OVERDUE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
        PENDING
      </span>
    );
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <KanbanSquare className="w-4 h-4" />
            <span>Visual Sales Progression</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            Sales Pipeline Kanban
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
              {pipeline?.name || 'Standard Sales Pipeline'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Drag & drop deals across lifecycle stages. Live updates sync with Supabase and CRM analytics.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingDeal(null);
            setSelectedStageForNewDeal(stages[0]?.id);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Deal</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-800 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Kanban Board Horizontal Scroll Container */}
      <div className="overflow-x-auto pb-6 custom-scrollbar">
        <div className="flex items-start gap-4 min-w-[1300px]">
          {stages.map((stage) => {
            const stageDeals = deals.filter((d) => d.stage_id === stage.id);
            const totalStageValue = stageDeals.reduce((sum, d) => sum + (Number(d.total_amount ?? d.value ?? 0)), 0);

            return (
              <div
                key={stage.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
                className="w-76 shrink-0 bg-slate-100/90 rounded-2xl p-3.5 border border-slate-200/90 flex flex-col max-h-[calc(100vh-220px)] shadow-2xs"
              >
                {/* Column Header */}
                <div className="p-1.5 flex items-center justify-between border-b border-slate-200/70 pb-2.5 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }}></span>
                    <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">{stage.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800 font-bold">
                      {stageDeals.length}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setEditingDeal(null);
                      setSelectedStageForNewDeal(stage.id);
                      setIsModalOpen(true);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    title="Add deal to this stage"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Stage Total Value Metric */}
                <div className="px-1.5 pb-2 text-[11px] font-bold text-slate-600 flex items-center justify-between">
                  <span>Total Value:</span>
                  <span className="font-extrabold text-slate-900">{formatCurrency(totalStageValue)}</span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 custom-scrollbar">
                  {stageDeals.length === 0 ? (
                    <div className="p-6 border-2 border-dashed border-slate-200/90 rounded-2xl text-center text-[11px] font-semibold text-slate-400 bg-white/40">
                      Drop deals here
                    </div>
                  ) : (
                    stageDeals.map((deal) => {
                      const priorityStyle = getPriorityColor(deal.priority || 'MEDIUM');
                      const totalVal = Number(deal.total_amount ?? deal.value ?? 0);
                      const paidVal = Number(deal.amount_paid ?? 0);
                      const remainingVal = Number(deal.amount_remaining ?? Math.max(0, totalVal - paidVal));

                      return (
                        <div
                          key={deal.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, deal.id)}
                          onClick={() => {
                            setEditingDeal(deal);
                            setIsModalOpen(true);
                          }}
                          className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-grab active:cursor-grabbing space-y-2 group"
                        >
                          {/* Deal Name & Payment Badge */}
                          <div className="flex items-start justify-between gap-1.5">
                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                              {deal.name}
                            </h4>
                            {getPaymentBadge(deal.payment_status)}
                          </div>

                          {/* Company / Client */}
                          {deal.company && (
                            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 truncate">
                              <Building className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{deal.company.name}</span>
                            </div>
                          )}

                          {/* Value & Payment Type */}
                          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-xs">
                            <div>
                              <div className="font-extrabold text-slate-900">
                                {formatCurrency(totalVal)}
                              </div>
                              {deal.payment_type === 'MONTHLY_RECURRING' && (
                                <div className="text-[10px] text-purple-600 font-semibold flex items-center gap-0.5">
                                  <Repeat className="w-2.5 h-2.5" /> Recurring
                                </div>
                              )}
                            </div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${priorityStyle.bg}`}>
                              {deal.priority}
                            </span>
                          </div>

                          {/* Paid vs Remaining Breakdown */}
                          {paidVal > 0 && (
                            <div className="text-[10px] text-slate-500 font-medium flex items-center justify-between bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                              <span>Paid: <span className="font-bold text-emerald-600">{formatCurrency(paidVal)}</span></span>
                              <span>Rem: <span className="font-bold text-amber-600">{formatCurrency(remainingVal)}</span></span>
                            </div>
                          )}

                          {/* Date & Owner */}
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 font-medium">
                            <span>{deal.expected_close_date ? formatDate(deal.expected_close_date) : 'No due date'}</span>
                            <span className="font-bold text-slate-700">
                              {deal.owner?.full_name?.split(' ')[0] || 'Team'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <DealModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        deal={editingDeal}
        defaultStageId={selectedStageForNewDeal}
      />
    </div>
  );
}
