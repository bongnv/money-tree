/**
 * Group enum for transaction categorization
 * Defines the high-level grouping of transactions
 */
export enum Group {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
  INVESTMENT = 'investment',
}

/**
 * Account type enum
 * Defines different types of financial accounts
 */
export enum AccountType {
  CASH = 'cash',
  BANK_ACCOUNT = 'bank_account',
  CREDIT_CARD = 'credit_card',
  INVESTMENT = 'investment',
  LOAN = 'loan',
  OTHER = 'other',
}

/**
 * Budget period enum
 * Defines the frequency/period for budgets
 */
export enum BudgetPeriod {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

/**
 * Asset type enum
 * Defines different types of manual assets and liabilities
 */
export enum AssetType {
  REAL_ESTATE = 'real_estate',
  SUPERANNUATION = 'superannuation',
  INVESTMENT = 'investment',
  LIABILITY = 'liability',
  OTHER = 'other',
}

