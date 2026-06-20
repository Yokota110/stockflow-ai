import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = 'JPY') {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatAxisCurrency(value: number) {
  if (value >= 1000000) return `¥${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `¥${(value / 1000).toFixed(0)}k`;
  return `¥${value}`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}
