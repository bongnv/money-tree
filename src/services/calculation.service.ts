import type { Transaction, Account, Budget, ManualAsset } from '../types/models';
import { getAssetCurrentValue } from '../utils/asset.utils';

/**
 * Calculation service for account balances and transaction totals
 */
class CalculationService {
  /**
   * Calculate current balance for an account
   * @param account Account to calculate balance for
   * @param transactions All transactions
   * @returns Current balance
   */
  calculateAccountBalance(account: Account, transactions: Transaction[]): number {
    let balance = account.initialBalance;

    transactions.forEach((transaction) => {
      if (transaction.toAccountId === account.id) {
        balance += transaction.amount;
      }
      if (transaction.fromAccountId === account.id) {
        balance -= transaction.amount;
      }
    });

    return balance;
  }

  /**
   * Calculate balances for multiple accounts
   * @param accounts Accounts to calculate balances for
   * @param transactions All transactions
   * @returns Map of account ID to balance
   */
  calculateAccountBalances(accounts: Account[], transactions: Transaction[]): Map<string, number> {
    const balances = new Map<string, number>();

    accounts.forEach((account) => {
      balances.set(account.id, this.calculateAccountBalance(account, transactions));
    });

    return balances;
  }

  /**
   * Prorate a budget amount from one period to another
   * @param amount Original budget amount
   * @param fromPeriod Source period ('monthly' | 'quarterly' | 'yearly')
   * @param toPeriod Target period ('monthly' | 'quarterly' | 'yearly')
   * @returns Prorated amount
   */
  prorateBudget(
    amount: number,
    fromPeriod: 'monthly' | 'quarterly' | 'yearly',
    toPeriod: 'monthly' | 'quarterly' | 'yearly'
  ): number {
    if (fromPeriod === toPeriod) {
      return amount;
    }

    // Convert to monthly first
    let monthlyAmount: number;
    switch (fromPeriod) {
      case 'monthly':
        monthlyAmount = amount;
        break;
      case 'quarterly':
        monthlyAmount = amount / 3;
        break;
      case 'yearly':
        monthlyAmount = amount / 12;
        break;
    }

    // Convert from monthly to target period
    switch (toPeriod) {
      case 'monthly':
        return monthlyAmount;
      case 'quarterly':
        return monthlyAmount * 3;
      case 'yearly':
        return monthlyAmount * 12;
    }
  }

  /**
   * Calculate actual amount (income or expenses) for a transaction type within a date range
   * @param transactionTypeId Transaction type ID
   * @param transactions All transactions
   * @param startDate Start date (YYYY-MM-DD format)
   * @param endDate End date (YYYY-MM-DD format)
   * @returns Total amount for the transaction type in the period
   */
  calculateActualAmount(
    transactionTypeId: string,
    transactions: Transaction[],
    startDate: string,
    endDate: string
  ): number {
    return transactions
      .filter(
        (t) => t.transactionTypeId === transactionTypeId && t.date >= startDate && t.date <= endDate
      )
      .reduce((sum, t) => sum + t.amount, 0);
  }

  /**
   * Get the active budget for a transaction type on a specific date
   * @param budgets All budgets for a transaction type
   * @param transactionTypeId Transaction type ID to filter by
   * @param date Date to check (YYYY-MM-DD format)
   * @returns Active budget or undefined if no active budget found
   */
  getActiveBudgetForPeriod(
    budgets: Budget[],
    transactionTypeId: string,
    date: string
  ): Budget | undefined {
    return budgets.find((budget) => {
      if (budget.transactionTypeId !== transactionTypeId) {
        return false;
      }

      // Check start date constraint
      if (budget.startDate && date < budget.startDate) {
        return false;
      }

      // Check end date constraint
      if (budget.endDate && date > budget.endDate) {
        return false;
      }

      return true;
    });
  }

  /**
   * Count the number of days between two dates (inclusive)
   * @param startDate Start date (YYYY-MM-DD format)
   * @param endDate End date (YYYY-MM-DD format)
   * @returns Number of days between dates
   */
  getDaysInPeriod(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // +1 to include both start and end dates
  }

  /**
   * Count the number of months between two dates (inclusive, approximate)
   * @param startDate Start date (YYYY-MM-DD format)
   * @param endDate End date (YYYY-MM-DD format)
   * @returns Number of months between dates (rounded)
   */
  private getMonthsInPeriod(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const monthsDiff =
      (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
    return monthsDiff;
  }

  /**
   * Prorate a budget for a specific period using simple period conversions
   * Uses straightforward multiplication: quarterly = monthly × 3, yearly = monthly × 12
   * @param budget Budget to prorate
   * @param startDate Start of viewing period (YYYY-MM-DD format)
   * @param endDate End of viewing period (YYYY-MM-DD format)
   * @returns Prorated budget amount for the period
   */
  prorateBudgetForPeriod(budget: Budget, startDate: string, endDate: string): number {
    // Calculate overlap between budget date range and viewing period
    const overlapStart = budget.startDate > startDate ? budget.startDate : startDate;
    const overlapEnd = budget.endDate < endDate ? budget.endDate : endDate;

    // If no overlap, return 0
    if (overlapStart > overlapEnd) {
      return 0;
    }

    // Calculate months in viewing period (approximate)
    const monthsInPeriod = this.getMonthsInPeriod(startDate, endDate);

    // Convert budget amount to monthly equivalent
    let monthlyAmount: number;
    switch (budget.period) {
      case 'monthly':
        monthlyAmount = budget.amount;
        break;
      case 'quarterly':
        monthlyAmount = budget.amount / 3;
        break;
      case 'yearly':
        monthlyAmount = budget.amount / 12;
        break;
    }

    // Calculate prorated amount based on viewing period
    const proratedAmount = monthlyAmount * monthsInPeriod;

    // Handle partial overlaps by calculating the ratio
    const totalPeriodDays = this.getDaysInPeriod(startDate, endDate);
    const overlapDays = this.getDaysInPeriod(overlapStart, overlapEnd);

    if (overlapDays < totalPeriodDays) {
      // Budget is only active for part of the viewing period
      return proratedAmount * (overlapDays / totalPeriodDays);
    }

    return proratedAmount;
  }

  /**
   * Calculate net worth (sum of all account balances + manual assets)
   * @param accounts All accounts
   * @param transactions All transactions
   * @param manualAssets All manual assets
   * @param baseCurrency Optional base currency for conversion (if null, no conversion)
   * @param getRateForMonth Optional function to get exchange rate for a month
   * @param currentMonth Current month in YYYY-MM format for rate lookup
   * @returns Total net worth (in base currency if provided)
   */
  async calculateNetWorth(
    accounts: Account[],
    transactions: Transaction[],
    manualAssets: ManualAsset[],
    baseCurrency?: string | null,
    getRateForMonth?: (month: string, from: string, to: string) => Promise<number | null>,
    currentMonth?: string
  ): Promise<number> {
    const accountBalances = this.calculateAccountBalances(accounts, transactions);

    let totalAccountBalance = 0;
    for (const account of accounts) {
      const balance = accountBalances.get(account.id) || 0;

      if (baseCurrency && getRateForMonth && currentMonth && account.currencyCode) {
        if (account.currencyCode !== baseCurrency) {
          const rate = await getRateForMonth(currentMonth, account.currencyCode, baseCurrency);
          if (rate === null) {
            throw new Error(
              `Missing exchange rate for ${account.currencyCode} → ${baseCurrency} in ${currentMonth}. Please fetch exchange rates in Settings → Exchange Rates.`
            );
          }
          totalAccountBalance += balance * rate;
        } else {
          totalAccountBalance += balance;
        }
      } else {
        totalAccountBalance += balance;
      }
    }
    let totalAssets = 0;
    for (const asset of manualAssets) {
      const assetValue = getAssetCurrentValue(asset);
      if (baseCurrency && getRateForMonth && currentMonth && asset.currencyCode) {
        if (asset.currencyCode !== baseCurrency) {
          const rate = await getRateForMonth(currentMonth, asset.currencyCode, baseCurrency);
          if (rate === null) {
            throw new Error(
              `Missing exchange rate for ${asset.currencyCode.toUpperCase()} → ${baseCurrency.toUpperCase()} in ${currentMonth}. Please fetch exchange rates in Settings → Exchange Rates.`
            );
          }
          totalAssets += assetValue * rate;
        } else {
          totalAssets += assetValue;
        }
      } else {
        totalAssets += assetValue;
      }
    }

    return totalAccountBalance + totalAssets;
  }

  /**
   * Calculate savings rate ((income - expenses) / income × 100%)
   * @param income Total income
   * @param expenses Total expenses
   * @returns Savings rate as percentage (0-100)
   */
  calculateSavingsRate(income: number, expenses: number): number {
    if (income === 0) {
      return 0;
    }
    return ((income - expenses) / income) * 100;
  }

  /**
   * Convert a transaction amount to base currency
   * @param transaction Transaction to convert
   * @param accounts List of accounts to lookup transaction account
   * @param baseCurrency Target currency code
   * @param getRateForMonth Function to get exchange rate (from useExchangeRateStore)
   * @returns Converted amount, or original amount if conversion not needed/possible
   */
  async convertTransactionAmount(
    transaction: Transaction,
    accounts: Account[],
    baseCurrency: string,
    getRateForMonth: (month: string, from: string, to: string) => Promise<number | null>
  ): Promise<number> {
    // Find the account for this transaction
    const accountId = transaction.fromAccountId || transaction.toAccountId;
    const account = accounts.find((a) => a.id === accountId);

    // No conversion if account not found or same currency
    if (!account || account.currencyCode === baseCurrency) {
      return transaction.amount;
    }

    // Convert using transaction month
    const month = transaction.date.slice(0, 7); // YYYY-MM
    const rate = await getRateForMonth(month, account.currencyCode, baseCurrency);
    if (rate !== null) {
      return transaction.amount * rate;
    }

    return transaction.amount;
  }

  /**
   * Convert a budget amount to base currency
   * @param budget Budget to convert
   * @param month Month for exchange rate (usually period start month)
   * @param baseCurrency Target currency code
   * @param getRateForMonth Function to get exchange rate (from useExchangeRateStore)
   * @returns Converted amount, or original amount if conversion not needed/possible
   */
  async convertBudgetAmount(
    budget: Budget,
    month: string,
    baseCurrency?: string,
    getRateForMonth?: (month: string, from: string, to: string) => Promise<number | null>
  ): Promise<number> {
    // No conversion if no base currency
    if (!baseCurrency) {
      return budget.amount;
    }

    // No conversion if same currency
    if (budget.currencyCode === baseCurrency) {
      return budget.amount;
    }

    // Convert using specified month
    if (getRateForMonth) {
      const rate = await getRateForMonth(month, budget.currencyCode, baseCurrency);
      if (rate !== null) {
        return budget.amount * rate;
      }
    }

    return budget.amount;
  }

  /**
   * Sum transaction amounts with currency conversion
   * @param transactions Transactions to sum
   * @param accounts List of accounts for currency lookup
   * @param baseCurrency Target currency code
   * @param getRateForMonth Function to get exchange rate (from useExchangeRateStore)
   * @returns Total converted amount
   */
  async sumTransactionAmounts(
    transactions: Transaction[],
    accounts: Account[],
    baseCurrency: string,
    getRateForMonth: (month: string, from: string, to: string) => Promise<number | null>
  ): Promise<number> {
    let total = 0;
    for (const transaction of transactions) {
      const convertedAmount = await this.convertTransactionAmount(
        transaction,
        accounts,
        baseCurrency,
        getRateForMonth
      );
      total += convertedAmount;
    }
    return total;
  }
}

export const calculationService = new CalculationService();
