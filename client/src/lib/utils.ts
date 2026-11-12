import { CURRENCY_SYMBOL } from './constants';

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

/**
 * Combine class names (simple version)
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
