import { Currency as CurrencyModel } from '../types/models';
import { CurrencyCode } from '../types/enums';

/**
 * Default currencies available in the application
 */
export const DEFAULT_CURRENCIES: CurrencyModel[] = [
  {
    code: CurrencyCode.USD,
    symbol: '$',
    name: 'US Dollar',
    decimalPlaces: 2,
  },
  {
    code: CurrencyCode.VND,
    symbol: '₫',
    name: 'Vietnamese Dong',
    decimalPlaces: 0,
  },
  {
    code: CurrencyCode.SGD,
    symbol: 'S$',
    name: 'Singapore Dollar',
    decimalPlaces: 2,
  },
  {
    code: CurrencyCode.AUD,
    symbol: 'A$',
    name: 'Australian Dollar',
    decimalPlaces: 2,
  },
];
