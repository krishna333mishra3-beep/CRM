'use client';

import React, { useState } from 'react';
import Papa from 'papaparse';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Eye,
  Check,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { useCrm } from '@/context/crm-context';
import { CsvPreviewRow, CsvImportSummary } from '@/types/crm';
import { downloadCsvFile, formatCurrency } from '@/lib/utils';

interface CsvImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CRM_FIELDS = [
  { id: 'full_name', label: 'Full Name / Client Name *', group: 'Lead Info' },
  { id: 'first_name', label: 'First Name', group: 'Lead Info' },
  { id: 'last_name', label: 'Last Name', group: 'Lead Info' },
  { id: 'phone', label: 'Phone / Mobile Number', group: 'Lead Info' },
  { id: 'email', label: 'Email Address', group: 'Lead Info' },
  { id: 'company_name', label: 'Company / Business', group: 'Lead Info' },
  { id: 'source', label: 'Lead Source', group: 'Lead Info' },
  { id: 'status', label: 'Lead Status', group: 'Lead Info' },
  { id: 'priority', label: 'Priority', group: 'Lead Info' },
  { id: 'deal_value', label: 'Deal / Contract Value (₹)', group: 'Deal & Payments' },
  { id: 'payment_type', label: 'Payment Type (One-Time / Recurring)', group: 'Deal & Payments' },
  { id: 'amount_paid', label: 'Amount Paid (₹ Upfront)', group: 'Deal & Payments' },
  { id: 'payment_status', label: 'Payment Status (Pending, Paid, Partial)', group: 'Deal & Payments' },
  { id: 'monthly_amount', label: 'Monthly Amount / MRR (₹)', group: 'Deal & Payments' },
  { id: 'next_payment_date', label: 'Next Payment Due Date', group: 'Deal & Payments' },
  { id: 'notes', label: 'Notes & Remarks', group: 'General' },
];

const SAMPLE_CSV_CONTENT = `name,phone,email,company,source,status,deal_value,payment_type,amount_paid,payment_status,monthly_amount,next_payment_date,notes
Rahul Sharma,9876543210,rahul@gmail.com,ABC Salon,COLD_CALL,NEW,80000,ONE_TIME,30000,PARTIALLY_PAID,,,Met at beauty expo
Amit Patel,9876543211,amit@gmail.com,XYZ Fitness,INSTAGRAM,CONTACTED,15000,MONTHLY_RECURRING,15000,PAID,15000,2026-03-25,Monthly SaaS plan
Neha Kapoor,9876543212,neha@gmail.com,PQR Studio,REFERRAL,QUALIFIED,50000,ONE_TIME,50000,PAID,,,Full payment via UPI
Rohan Verma,9876543213,rohan@verma.com,Verma Enterprises,GOOGLE,DEMO,120000,ONE_TIME,0,PENDING,,,Proposal sent
Priya Menon,9876543214,priya@menon.com,Menon Consulting,WEBSITE,NEW,25000,MONTHLY_RECURRING,0,PENDING,25000,2026-03-01,Follow-up for billing`;

export function CsvImporterModal({ isOpen, onClose }: CsvImporterModalProps) {
  const { validateCsv, executeCsvImport } = useCrm();

  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'result'>('upload');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [previewRows, setPreviewRows] = useState<CsvPreviewRow[]>([]);
  const [summary, setSummary] = useState<CsvImportSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setStep('upload');
      setCsvHeaders([]);
      setRawRows([]);
      setColumnMapping({});
      setPreviewRows([]);
      setSummary(null);
      setIsProcessing(false);
      setDragActive(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownloadSample = () => {
    downloadCsvFile(SAMPLE_CSV_CONTENT, 'firstclick_leads_deals_sample.csv');
  };

  const processCsvFile = (file: File) => {
    setIsProcessing(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = results.data as Record<string, string>[];

        setCsvHeaders(headers);
        setRawRows(rows);

        // Auto-guess column mappings intelligently including deal & payment columns
        const initialMapping: Record<string, string> = {};
        CRM_FIELDS.forEach((field) => {
          const matchedHeader = headers.find((h) => {
            const cleanH = h.toLowerCase().replace(/[^a-z0-9]/g, '');
            const cleanField = field.id.toLowerCase().replace(/[^a-z0-9]/g, '');
            const cleanLabel = field.label.toLowerCase().replace(/[^a-z0-9]/g, '');

            if (cleanH === cleanField || cleanH === cleanLabel) return true;

            if (field.id === 'full_name') {
              return ['name', 'fullname', 'contactname', 'leadname', 'clientname', 'person', 'client'].includes(cleanH);
            }
            if (field.id === 'first_name') {
              return ['firstname', 'fname', 'first'].includes(cleanH);
            }
            if (field.id === 'last_name') {
              return ['lastname', 'lname', 'last', 'surname'].includes(cleanH);
            }
            if (field.id === 'phone') {
              return ['phone', 'mobile', 'mobilenumber', 'contactnumber', 'phonenumber', 'tel', 'cell', 'whatsapp', 'phone1', 'mobile1'].includes(cleanH);
            }
            if (field.id === 'email') {
              return ['email', 'emailaddress', 'mail', 'emailid', 'email1'].includes(cleanH);
            }
            if (field.id === 'company_name') {
              return ['company', 'companyname', 'business', 'businessname', 'org', 'organization', 'firm', 'agency'].includes(cleanH);
            }
            if (field.id === 'source') {
              return ['source', 'leadsource', 'channel', 'medium', 'utm', 'campaign'].includes(cleanH);
            }
            if (field.id === 'status') {
              return ['status', 'disposition', 'stage', 'leadstatus', 'callstatus'].includes(cleanH);
            }
            if (field.id === 'priority') {
              return ['priority', 'urgency', 'importance'].includes(cleanH);
            }
            if (field.id === 'deal_value') {
              return ['dealvalue', 'value', 'dealval', 'contractvalue', 'totalamount', 'amount', 'budget', 'revenue', 'price', 'estimatedvalue'].includes(cleanH);
            }
            if (field.id === 'payment_type') {
              return ['paymenttype', 'paytype', 'billingtype', 'subscriptiontype', 'type'].includes(cleanH);
            }
            if (field.id === 'amount_paid') {
              return ['amountpaid', 'paid', 'paidamount', 'advance', 'received', 'totalpaid'].includes(cleanH);
            }
            if (field.id === 'payment_status') {
              return ['paymentstatus', 'paystatus', 'billingstatus'].includes(cleanH);
            }
            if (field.id === 'monthly_amount') {
              return ['monthlyamount', 'mrr', 'monthlyfee', 'monthlyrate', 'recurringamount'].includes(cleanH);
            }
            if (field.id === 'next_payment_date') {
              return ['nextpaymentdate', 'nextduedate', 'duedate', 'nextpayment', 'nextdate'].includes(cleanH);
            }
            if (field.id === 'notes') {
              return ['notes', 'note', 'description', 'remarks', 'comment', 'comments', 'detail', 'details'].includes(cleanH);
            }

            return false;
          });

          if (matchedHeader) {
            initialMapping[field.id] = matchedHeader;
          }
        });

        setColumnMapping(initialMapping);
        setStep('mapping');
        setIsProcessing(false);
      },
      error: (err) => {
        alert('Error parsing CSV file: ' + err.message);
        setIsProcessing(false);
      },
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processCsvFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processCsvFile(e.target.files[0]);
    }
  };

  const proceedToPreview = () => {
    const { previewRows: validated, summary: resSummary } = validateCsv(rawRows, columnMapping);
    setPreviewRows(validated);
    setSummary(resSummary);
    setStep('preview');
  };

  const handleDuplicateResolutionChange = (rowNumber: number, resolution: 'skip' | 'update' | 'create_anyway') => {
    setPreviewRows((prev) =>
      prev.map((r) => (r.rowNumber === rowNumber ? { ...r, duplicateResolution: resolution } : r))
    );
  };

  const runImport = async () => {
    setIsProcessing(true);
    try {
      const finalSummary = await executeCsvImport(previewRows);
      setSummary(finalSummary);
      setStep('result');
    } catch (e: any) {
      console.error('Import error:', e);
      setSummary({
        totalRows: previewRows.length,
        validRows: previewRows.filter((r) => !r.errors?.length).length,
        invalidRows: previewRows.filter((r) => r.errors?.length).length,
        duplicateRows: previewRows.filter((r) => r.isDuplicate).length,
        importedRows: 0,
        skippedRows: 0,
        updatedRows: 0,
        failedRows: previewRows.length,
        errorMessage: e?.message || 'Database import error',
      });
      setStep('result');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAll = () => {
    setStep('upload');
    setCsvHeaders([]);
    setRawRows([]);
    setColumnMapping({});
    setPreviewRows([]);
    setSummary(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 my-6 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                CSV Lead & Deal Importer
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold">
                  Real Supabase Sync
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bulk import leads, create linked deals, and record payments with duplicate handling
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="px-6 py-3 bg-slate-100/70 dark:bg-slate-800/80 border-b border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs font-semibold shrink-0">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'upload' ? 'bg-indigo-600 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>1</span>
            <span className={step === 'upload' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'}>Upload CSV</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'mapping' ? 'bg-indigo-600 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>2</span>
            <span className={step === 'mapping' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'}>Map Columns</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'preview' ? 'bg-indigo-600 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>3</span>
            <span className={step === 'preview' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'}>Preview & Duplicates</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'result' ? 'bg-emerald-600 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>4</span>
            <span className={step === 'result' ? 'text-emerald-600 font-bold' : 'text-slate-500 dark:text-slate-400'}>Database Result</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
                  dragActive ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-800 dark:text-white">Drag & drop your CSV file here</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  Upload contacts, leads, deal values, and payment records. Automatically detects headers and checks for duplicates.
                </p>

                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileInput}
                    className="hidden"
                    id="csv-file-input"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Choose CSV File</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSample}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-600" />
                    Download Sample CSV (with Deals & Payments)
                  </button>
                </div>
              </div>

              {/* Supported Columns Guide */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" /> Supported & Auto-Mapped CSV Headers:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="font-semibold text-indigo-600">Lead Fields:</span>{' '}
                    <code className="bg-white dark:bg-slate-700 px-1 py-0.5 rounded font-mono">name</code>,{' '}
                    <code className="bg-white dark:bg-slate-700 px-1 py-0.5 rounded font-mono">phone</code>,{' '}
                    <code className="bg-white dark:bg-slate-700 px-1 py-0.5 rounded font-mono">email</code>,{' '}
                    <code className="bg-white dark:bg-slate-700 px-1 py-0.5 rounded font-mono">company</code>,{' '}
                    <code className="bg-white dark:bg-slate-700 px-1 py-0.5 rounded font-mono">source</code>
                  </div>
                  <div>
                    <span className="font-semibold text-emerald-600">Deal & Payment Fields:</span>{' '}
                    <code className="bg-white dark:bg-slate-700 px-1 py-0.5 rounded font-mono">deal_value</code>,{' '}
                    <code className="bg-white dark:bg-slate-700 px-1 py-0.5 rounded font-mono">payment_type</code>,{' '}
                    <code className="bg-white dark:bg-slate-700 px-1 py-0.5 rounded font-mono">amount_paid</code>,{' '}
                    <code className="bg-white dark:bg-slate-700 px-1 py-0.5 rounded font-mono">payment_status</code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {step === 'mapping' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Match CSV Columns to CRM Fields</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Detected {csvHeaders.length} columns and {rawRows.length} rows in CSV file.
                  </p>
                </div>
                <button onClick={resetAll} className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 flex items-center gap-1 cursor-pointer">
                  <ArrowLeft className="w-3.5 h-3.5" /> Re-upload file
                </button>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">CRM Field</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-center">Direction</th>
                      <th className="p-3">Matched CSV Header</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {CRM_FIELDS.map((field) => (
                      <tr key={field.id} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                          {field.label}
                        </td>
                        <td className="p-3 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className={`inline-flex px-2 py-0.5 rounded ${
                            field.group === 'Deal & Payments'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            {field.group}
                          </span>
                        </td>
                        <td className="p-3 text-center text-slate-400">→</td>
                        <td className="p-3">
                          <select
                            value={columnMapping[field.id] || ''}
                            onChange={(e) =>
                              setColumnMapping({ ...columnMapping, [field.id]: e.target.value })
                            }
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">-- Do Not Import --</option>
                            {csvHeaders.map((header) => (
                              <option key={header} value={header}>
                                {header} (e.g. &ldquo;{rawRows[0]?.[header] || ''}&rdquo;)
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Back
                </button>
                <button
                  onClick={proceedToPreview}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Preview & Validate Data</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & DUPLICATE RESOLUTION */}
          {step === 'preview' && summary && (
            <div className="space-y-6">
              {/* Validation Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Total Records</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{summary.totalRows}</div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <div className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Valid Rows</div>
                  <div className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mt-1">{summary.validRows}</div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">Duplicates Detected</div>
                  <div className="text-xl font-bold text-amber-800 dark:text-amber-300 mt-1">{summary.duplicateRows}</div>
                </div>
                <div className="bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-800">
                  <div className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400">Invalid Rows</div>
                  <div className="text-xl font-bold text-rose-800 dark:text-rose-300 mt-1">{summary.invalidRows}</div>
                </div>
              </div>

              {/* Rows Preview Table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Row Preview (Showing first 25 of {previewRows.length} rows)</span>
                  <span className="text-slate-500 font-normal">Choose duplicate action for each conflicting record</span>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400 font-semibold sticky top-0">
                      <tr>
                        <th className="p-2.5">Row</th>
                        <th className="p-2.5">Lead Name</th>
                        <th className="p-2.5">Phone / Email</th>
                        <th className="p-2.5">Deal Value</th>
                        <th className="p-2.5">Payment</th>
                        <th className="p-2.5">Validation & Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {previewRows.slice(0, 25).map((row) => {
                        const m = row.mappedData;
                        const dealVal = Number(m.deal_value || m.estimated_value || 0);
                        const paidVal = Number(m.amount_paid || 0);

                        return (
                          <tr
                            key={row.rowNumber}
                            className={
                              row.errors.length > 0
                                ? 'bg-rose-50/50 dark:bg-rose-950/20'
                                : row.isDuplicate
                                ? 'bg-amber-50/40 dark:bg-amber-950/20'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }
                          >
                            <td className="p-2.5 font-mono text-slate-500">#{row.rowNumber}</td>
                            <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">
                              {m.full_name || '—'}
                              {m.company_name && (
                                <div className="text-[10px] text-slate-400 font-normal">{m.company_name}</div>
                              )}
                            </td>
                            <td className="p-2.5 text-slate-600 dark:text-slate-400">
                              <div>{m.phone || '—'}</div>
                              <div className="text-[10px] text-slate-400">{m.email}</div>
                            </td>
                            <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                              {dealVal > 0 ? formatCurrency(dealVal) : '—'}
                            </td>
                            <td className="p-2.5">
                              {paidVal > 0 ? (
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                  {formatCurrency(paidVal)} paid
                                </span>
                              ) : (
                                <span className="text-slate-400">₹0</span>
                              )}
                            </td>
                            <td className="p-2.5">
                              {row.errors.length > 0 ? (
                                <div className="text-rose-600 font-semibold flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{row.errors.join(', ')}</span>
                                </div>
                              ) : row.isDuplicate ? (
                                <div className="space-y-1">
                                  <div className="text-amber-800 dark:text-amber-300 text-[10px] font-semibold flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                                    {row.duplicateReason}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleDuplicateResolutionChange(row.rowNumber, 'skip')}
                                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer ${
                                        row.duplicateResolution === 'skip'
                                          ? 'bg-slate-700 text-white border-slate-700'
                                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                                      }`}
                                    >
                                      SKIP
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDuplicateResolutionChange(row.rowNumber, 'update')}
                                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer ${
                                        row.duplicateResolution === 'update'
                                          ? 'bg-indigo-600 text-white border-indigo-600'
                                          : 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 border-indigo-300 dark:border-indigo-800'
                                      }`}
                                    >
                                      UPDATE EXISTING
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDuplicateResolutionChange(row.rowNumber, 'create_anyway')}
                                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer ${
                                        row.duplicateResolution === 'create_anyway'
                                          ? 'bg-amber-600 text-white border-amber-600'
                                          : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                                      }`}
                                    >
                                      CREATE ANYWAY
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setStep('mapping')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Modify Column Mappings
                </button>
                <button
                  onClick={runImport}
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Execute Supabase Import</span>
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: IMPORT COMPLETE RESULT */}
          {step === 'result' && summary && (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white">IMPORT COMPLETED ✓</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Records have been synced to real Supabase tables (<code className="font-mono">leads</code>, <code className="font-mono">deals</code>, <code className="font-mono">payments</code>).
                </p>
              </div>

              {/* Stats breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto text-left">
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Total Rows</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">{summary.totalRows}</div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <div className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Leads Imported</div>
                  <div className="text-lg font-bold text-emerald-800 dark:text-emerald-300">{summary.importedRows}</div>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800">
                  <div className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-400">Deals Created</div>
                  <div className="text-lg font-bold text-indigo-800 dark:text-indigo-300">{summary.dealsCreated ?? 0}</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/40 p-3 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-400">Payments Recorded</div>
                  <div className="text-lg font-bold text-purple-800 dark:text-purple-300">{summary.paymentsCreated ?? 0}</div>
                </div>
              </div>

              {/* Error notice if any failed */}
              {summary.failedRows && summary.failedRows > 0 ? (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 rounded-xl max-w-xl mx-auto text-left flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">{summary.failedRows} rows encountered errors:</span> {summary.errorMessage || 'Database validation error'}
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  onClick={resetAll}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Import Another File
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
                >
                  View Imported Records
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
