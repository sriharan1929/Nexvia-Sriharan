import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CURRENCY_SYMBOL } from './constants';

/**
 * Merge Tailwind CSS class names intelligently (shadcn/ui standard)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format paise amount to display string
 * 99950 → "₹999.50"
 */
export function formatPrice(paise: number): string {
  return `${CURRENCY_SYMBOL}${(paise / 100).toFixed(2)}`;
}

/**
 * Format date to locale string
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
