import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = 'MYR') {
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency }).format(value);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatAxisCurrency(value: number) {
  if (value >= 1000) return `RM ${(value / 1000).toFixed(0)}k`;
  return `RM ${value}`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}
