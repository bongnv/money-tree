import { Currency as CurrencyModel } from '../types/models';
import { Currency } from '../types/enums';

/**
 * Default currencies available in the application
 */
export const DEFAULT_CURRENCIES: CurrencyModel[] = [
  {
    id: Currency.USD,
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimalPlaces: 2,
  },
  {
    id: Currency.VND,
    code: 'VND',
    symbol: '₫',
    name: 'Vietnamese Dong',
    decimalPlaces: 0,
  },
  {
    id: Currency.SGD,
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    decimalPlaces: 2,
  },
  {
    id: Currency.AUD,
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    decimalPlaces: 2,
  },
];
