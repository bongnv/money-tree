import type { Transaction, Account } from '../types/models';

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
  calculateAccountBalances(
    accounts: Account[],
    transactions: Transaction[]
  ): Map<string, number> {
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
        (t) =>
          t.transactionTypeId === transactionTypeId &&
          t.date >= startDate &&
          t.date <= endDate
      )
      .reduce((sum, t) => sum + t.amount, 0);
  }
}

export const calculationService = new CalculationService();
