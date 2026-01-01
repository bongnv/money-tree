import { Currency, Category } from '../types/models';
import { Group } from '../types/enums';

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

/**
 * Default categories for organizing transactions
 */
export const DEFAULT_CATEGORIES: Category[] = [
  // Income categories
  {
    id: 'income-salary',
    name: 'Salary & Wages',
    group: Group.INCOME,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'income-business',
    name: 'Business Income',
    group: Group.INCOME,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'income-investment',
    name: 'Investment Income',
    group: Group.INCOME,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'income-other',
    name: 'Other Income',
    group: Group.INCOME,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Expense categories
  {
    id: 'expense-housing',
    name: 'Housing',
    group: Group.EXPENSE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'expense-transportation',
    name: 'Transportation',
    group: Group.EXPENSE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'expense-food',
    name: 'Food & Dining',
    group: Group.EXPENSE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'expense-utilities',
    name: 'Utilities',
    group: Group.EXPENSE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'expense-healthcare',
    name: 'Healthcare',
    group: Group.EXPENSE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'expense-insurance',
    name: 'Insurance',
    group: Group.EXPENSE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'expense-personal',
    name: 'Personal Care',
    group: Group.EXPENSE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'expense-entertainment',
    name: 'Entertainment',
    group: Group.EXPENSE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'expense-education',
    name: 'Education',
    group: Group.EXPENSE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'expense-shopping',
    name: 'Shopping',
    group: Group.EXPENSE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'expense-travel',
    name: 'Travel',
    group: Group.EXPENSE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'expense-other',
    name: 'Other Expenses',
    group: Group.EXPENSE,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Transfer category
  {
    id: 'transfer-general',
    name: 'Account Transfer',
    group: Group.TRANSFER,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Investment categories
  {
    id: 'investment-stocks',
    name: 'Stocks',
    group: Group.INVESTMENT,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'investment-bonds',
    name: 'Bonds',
    group: Group.INVESTMENT,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'investment-realestate',
    name: 'Real Estate',
    group: Group.INVESTMENT,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'investment-retirement',
    name: 'Retirement',
    group: Group.INVESTMENT,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'investment-other',
    name: 'Other Investments',
    group: Group.INVESTMENT,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

