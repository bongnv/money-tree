import { Currency } from '../types/models';

/**
 * Default currencies available in the application
 */
export const DEFAULT_CURRENCIES: Currency[] = [
  {
    id: 'usd',
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimalPlaces: 2,
  },
  {
    id: 'eur',
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimalPlaces: 2,
  },
  {
    id: 'gbp',
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    decimalPlaces: 2,
  },
  {
    id: 'jpy',
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    decimalPlaces: 0,
  },
  {
    id: 'cad',
    code: 'CAD',
    symbol: 'CA$',
    name: 'Canadian Dollar',
    decimalPlaces: 2,
  },
  {
    id: 'aud',
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    decimalPlaces: 2,
  },
  {
    id: 'chf',
    code: 'CHF',
    symbol: 'CHF',
    name: 'Swiss Franc',
    decimalPlaces: 2,
  },
  {
    id: 'cny',
    code: 'CNY',
    symbol: '¥',
    name: 'Chinese Yuan',
    decimalPlaces: 2,
  },
  {
    id: 'inr',
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    decimalPlaces: 2,
  },
  {
    id: 'vnd',
    code: 'VND',
    symbol: '₫',
    name: 'Vietnamese Dong',
    decimalPlaces: 0,
  },
  {
    id: 'sgd',
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    decimalPlaces: 2,
  },
];
