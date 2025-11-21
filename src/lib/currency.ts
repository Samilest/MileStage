// Supported currencies with their symbols and formats
export const CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar', format: 'en-US' },
  EUR: { symbol: '€', name: 'Euro', format: 'de-DE' },
  GBP: { symbol: '£', name: 'British Pound', format: 'en-GB' },
  CAD: { symbol: '$', name: 'Canadian Dollar', format: 'en-CA' },
  AUD: { symbol: '$', name: 'Australian Dollar', format: 'en-AU' },
  JPY: { symbol: '¥', name: 'Japanese Yen', format: 'ja-JP' },
  CHF: { symbol: 'CHF', name: 'Swiss Franc', format: 'de-CH' },
  INR: { symbol: '₹', name: 'Indian Rupee', format: 'en-IN' },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

/**
 * Format amount with currency symbol
 * @param amount - Number to format
 * @param currency - Currency code (defaults to USD)
 * @returns Formatted string like "$500" or "€500"
 */
export function formatCurrency(amount: number, currency: CurrencyCode = 'USD'): string {
  const currencyInfo = CURRENCIES[currency];
  
  return new Intl.NumberFormat(currencyInfo.format, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get just the symbol for a currency
 * @param currency - Currency code
 * @returns Symbol like "$" or "€"
 */
export function getCurrencySymbol(currency: CurrencyCode = 'USD'): string {
  return CURRENCIES[currency].symbol;
}
