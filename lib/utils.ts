import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCount(val: number | string | null | undefined): string | null {
  if (val === null || val === undefined) return null;
  const strVal = String(val).replace(/,/g, '').trim();
  if (!strVal || strVal === 'NaN' || strVal === 'undefined' || strVal === 'null') return null;
  const num = typeof val === 'number' ? val : parseFloat(strVal);
  if (isNaN(num) || num <= 0) return null;

  if (num >= 1_000_000) {
    const formatted = (num / 1_000_000).toFixed(1).replace(/\.0$/, '');
    return `${formatted}M`;
  }
  if (num >= 1_000) {
    const formatted = (num / 1_000).toFixed(1).replace(/\.0$/, '');
    return `${formatted}K`;
  }
  return num.toString();
}

