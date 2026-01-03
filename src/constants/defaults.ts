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
  {
    id: 'aud',
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    decimalPlaces: 2,
  },
];
