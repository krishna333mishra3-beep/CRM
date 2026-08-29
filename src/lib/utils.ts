import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number | string | null | undefined,
  currency: string = 'INR',
  symbol: string = '₹',
  compact: boolean = false
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount || 0;
  if (isNaN(num)) return `${symbol}0`;

  if (compact) {
    if (currency === 'INR' || symbol === '₹') {
      if (Math.abs(num) >= 10000000) {
        return `${symbol}${(num / 10000000).toFixed(2)} Cr`;
      }
      if (Math.abs(num) >= 100000) {
        return `${symbol}${(num / 100000).toFixed(1)} L`;
      }
    } else {
      if (Math.abs(num) >= 1000000) {
        return `${symbol}${(num / 1000000).toFixed(2)}M`;
      }
    }
  }

  if (currency === 'INR' || symbol === '₹') {
    return `${symbol}${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  }

  return `${symbol}${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function formatDate(dateString: string | null | undefined, dateFormat: string = 'MMM dd, yyyy'): string {
  if (!dateString) return '—';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    if (!isValid(date)) return '—';
    return format(date, dateFormat);
  } catch {
    return '—';
  }
}

export function formatDateTime(dateString: string | null | undefined): string {
  return formatDate(dateString, 'MMM dd, yyyy hh:mm a');
}

export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    if (!isValid(date)) return '—';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return '—';
  }
}

export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

export function downloadCsvFile(csvContent: string, fileName: string = 'export.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'NEW':
      return { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500' };
    case 'CONTACTED':
      return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' };
    case 'NOT_PICKED':
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' };
    case 'INTERESTED':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
    case 'FOLLOW_UP':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
    case 'DEMO':
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' };
    case 'QUALIFIED':
      return { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500' };
    case 'PROPOSAL':
      return { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', dot: 'bg-pink-500' };
    case 'NEGOTIATION':
      return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' };
    case 'WON':
      return { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', dot: 'bg-emerald-600' };
    case 'LOST':
      return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300', dot: 'bg-slate-500' };
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' };
  }
}

export function getPriorityColor(priority: string) {
  switch (priority) {
    case 'URGENT':
      return { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300' };
    case 'HIGH':
      return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' };
    case 'MEDIUM':
      return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' };
    case 'LOW':
      return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' };
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' };
  }
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return 'FC';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
