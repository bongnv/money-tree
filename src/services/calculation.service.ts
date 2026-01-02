import type { Transaction, Account, Budget } from '../types/models';

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
   * Calculate total income for a period
   * @param transactions Transactions to sum
   * @returns Total income amount
   */
  calculateTotalIncome(transactions: Transaction[]): number {
    return transactions
      .filter((t) => t.toAccountId && !t.fromAccountId)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  /**
   * Calculate total expenses for a period
   * @param transactions Transactions to sum
   * @returns Total expense amount
   */
  calculateTotalExpenses(transactions: Transaction[]): number {
    return transactions
      .filter((t) => t.fromAccountId && !t.toAccountId)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  /**
   * Calculate total transfers for a period
   * @param transactions Transactions to sum
   * @returns Total transfer amount
   */
  calculateTotalTransfers(transactions: Transaction[]): number {
    return transactions
      .filter((t) => t.fromAccountId && t.toAccountId)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  /**
   * Calculate net income (income - expenses) for a period
   * @param transactions Transactions to calculate from
   * @returns Net income amount
   */
  calculateNetIncome(transactions: Transaction[]): number {
    return this.calculateTotalIncome(transactions) - this.calculateTotalExpenses(transactions);
  }

  /**
   * Calculate total for specific transaction type
   * @param transactionTypeId Transaction type ID
   * @param transactions All transactions
   * @returns Total amount for the transaction type
   */
  calculateTotalByType(transactionTypeId: string, transactions: Transaction[]): number {
    return transactions
      .filter((t) => t.transactionTypeId === transactionTypeId)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  /**
   * Calculate total for specific category
   * @param _categoryId Category ID (not used in calculation, only for identification)
   * @param transactions All transactions
   * @param transactionTypeIds Transaction type IDs in the category
   * @returns Total amount for the category
   */
  calculateTotalByCategory(
    _categoryId: string,
    transactions: Transaction[],
    transactionTypeIds: string[]
  ): number {
    return transactions
      .filter((t) => transactionTypeIds.includes(t.transactionTypeId))
      .reduce((sum, t) => sum + t.amount, 0);
  }

  /**
   * Group transactions by transaction type and calculate totals
   * @param transactions Transactions to group
   * @returns Map of transaction type ID to total amount
   */
  groupByTypeWithTotals(transactions: Transaction[]): Map<string, number> {
    const totals = new Map<string, number>();

    transactions.forEach((transaction) => {
      const current = totals.get(transaction.transactionTypeId) || 0;
      totals.set(transaction.transactionTypeId, current + transaction.amount);
    });

    return totals;
  }

  /**
   * Calculate running balances for an account over time
   * @param account Account to calculate for
   * @param transactions All transactions (should be sorted by date)
   * @returns Array of { date, balance } objects
   */
  calculateRunningBalance(
    account: Account,
    transactions: Transaction[]
  ): Array<{ date: string; balance: number }> {
    const accountTransactions = transactions
      .filter((t) => t.fromAccountId === account.id || t.toAccountId === account.id)
      .sort((a, b) => a.date.localeCompare(b.date));

    let balance = account.initialBalance;
    const balances: Array<{ date: string; balance: number }> = [
      { date: account.createdAt, balance },
    ];

    accountTransactions.forEach((transaction) => {
      if (transaction.toAccountId === account.id) {
        balance += transaction.amount;
      }
      if (transaction.fromAccountId === account.id) {
        balance -= transaction.amount;
      }
      balances.push({ date: transaction.date, balance });
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
}

export const calculationService = new CalculationService();
