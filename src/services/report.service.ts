import type {
  Account,
  ManualAsset,
  Transaction,
  TransactionType,
  Category,
  Budget,
} from '../types/models';
import { AccountType, AssetType, CurrencyCode, Group } from '../types/enums';
import { CalculationService } from './calculation.service';
import { getAssetCurrentValue } from '../utils/asset.utils';
import { getRateForMonth } from './exchangeRate.service';

export interface BalanceSheetData {
  assets: AssetGroup[];
  liabilities: AssetGroup[];
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
}

export interface AssetGroup {
  name: string;
  items: AssetItem[];
  total: number;
}

export interface AssetItem {
  id: string;
  name: string;
  value: number;
  type: string;
  currencyCode?: string;
  convertedValue?: number;
  conversionRate?: number;
}

export interface NetWorthTrendPoint {
  date: string;
  netWorth: number;
  assets: number;
  liabilities: number;
}

export interface CashFlowData {
  income: CategoryTotal[];
  expenses: CategoryTotal[];
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
}

export interface CategoryTotal {
  categoryId: string;
  categoryName: string;
  total: number;
  transactionCount: number;
}

export interface CashFlowTrendPoint {
  date: string;
  income: number;
  expenses: number;
  netCashFlow: number;
}

export interface BudgetPerformanceItem {
  budgetId: string;
  transactionTypeId: string;
  transactionTypeName: string;
  categoryId: string;
  categoryName: string;
  budgetedAmount: number;
  actualAmount: number;
  remaining: number;
  percentUsed: number;
  isIncome: boolean;
}

export interface BudgetPerformanceData {
  items: BudgetPerformanceItem[];
  totalBudgetedIncome: number;
  totalActualIncome: number;
  totalRemainingIncome: number;
  totalBudgetedExpenses: number;
  totalActualExpenses: number;
  totalRemainingExpenses: number;
  overallHealthScore: number;
}

export interface BudgetTrendPoint {
  date: string;
  budgeted: number;
  actual: number;
  variance: number;
  budgetedIncome: number;
  actualIncome: number;
}

export type PeriodType = 'monthly' | 'quarterly' | 'yearly' | 'custom';

/**
 * Report service for generating financial reports
 */
export class ReportService {
  private calculationService: CalculationService;

  constructor(calculationService: CalculationService) {
    this.calculationService = calculationService;
  }

  /**
   * Calculate balance sheet for a given date
   * @param accounts All accounts
   * @param manualAssets All manual assets
   * @param transactions All transactions up to the date
   * @param asOfDate Date to calculate balance sheet for (ISO string)
   * @param baseCurrency Optional base currency for conversion
   * @returns Balance sheet data
   */
  async calculateBalanceSheet(
    accounts: Account[],
    manualAssets: ManualAsset[],
    transactions: Transaction[],
    asOfDate: string,
    baseCurrency: CurrencyCode
  ): Promise<BalanceSheetData> {
    // Filter transactions up to the date
    const filteredTransactions = asOfDate
      ? transactions.filter((t) => t.date <= asOfDate)
      : transactions;

    // Manual assets don't need date filtering - valueHistory handles historical values
    const filteredManualAssets = manualAssets;

    // Get month for rate lookup (YYYY-MM format)
    const rateMonth = asOfDate.substring(0, 7);

    // Group assets by type
    const assetGroups = await this.groupAssets(
      accounts,
      filteredManualAssets,
      filteredTransactions,
      baseCurrency,
      rateMonth
    );
    const liabilityGroups = await this.groupLiabilities(
      accounts,
      filteredManualAssets,
      filteredTransactions,
      baseCurrency,
      rateMonth
    );

    const totalAssets = assetGroups.reduce((sum, group) => sum + group.total, 0);
    const totalLiabilities = liabilityGroups.reduce((sum, group) => sum + group.total, 0);
    const netWorth = totalAssets - totalLiabilities;

    return {
      assets: assetGroups,
      liabilities: liabilityGroups,
      netWorth,
      totalAssets,
      totalLiabilities,
    };
  }

  /**
   * Group assets by type
   */
  private async groupAssets(
    accounts: Account[],
    manualAssets: ManualAsset[],
    transactions: Transaction[],
    baseCurrency: CurrencyCode,
    rateMonth: string
  ): Promise<AssetGroup[]> {
    const groups: Map<string, AssetItem[]> = new Map();

    // Add account assets (positive balance accounts, excluding credit cards and loans)
    const assetAccounts = accounts.filter(
      (a) => a.type !== AccountType.CREDIT_CARD && a.type !== AccountType.LOAN
    );
    for (const account of assetAccounts) {
      const balance = this.calculationService.calculateAccountBalance(account, transactions);
      if (balance > 0) {
        const groupName = this.getAccountGroupName(account.type);
        if (!groups.has(groupName)) {
          groups.set(groupName, []);
        }

        let convertedValue = balance;
        let conversionRate: number | undefined;

        // Apply currency conversion if base currency is specified
        if (account.currencyCode !== baseCurrency) {
          const rate = await getRateForMonth(rateMonth, account.currencyCode, baseCurrency);
          convertedValue = balance * rate;
          conversionRate = rate;
        }

        groups.get(groupName)!.push({
          id: account.id,
          name: account.name,
          value: convertedValue,
          type: account.type,
          currencyCode: account.currencyCode,
          convertedValue:
            baseCurrency && account.currencyCode !== baseCurrency ? convertedValue : undefined,
          conversionRate,
        });
      }
    }

    // Add manual assets (positive value)
    const positiveAssets = manualAssets.filter((a) => {
      const value = getAssetCurrentValue(a);
      return value >= 0 && a.type !== AssetType.LIABILITY;
    });
    for (const asset of positiveAssets) {
      const groupName = this.getManualAssetGroupName(asset.type);
      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }

      const assetValue = getAssetCurrentValue(asset);
      let convertedValue = assetValue;
      let conversionRate: number | undefined;

      // Apply currency conversion if base currency is specified
      if (asset.currencyCode !== baseCurrency) {
        const rate = await getRateForMonth(rateMonth, asset.currencyCode, baseCurrency);
        convertedValue = assetValue * rate;
        conversionRate = rate;
      }

      groups.get(groupName)!.push({
        id: asset.id,
        name: asset.name,
        value: convertedValue,
        type: asset.type,
        currencyCode: asset.currencyCode,
        convertedValue:
          baseCurrency && asset.currencyCode !== baseCurrency ? convertedValue : undefined,
        conversionRate,
      });
    }

    // Convert to AssetGroup array
    return Array.from(groups.entries()).map(([name, items]) => ({
      name,
      items,
      total: items.reduce((sum, item) => sum + item.value, 0),
    }));
  }

  /**
   * Group liabilities by type
   */
  private async groupLiabilities(
    accounts: Account[],
    manualAssets: ManualAsset[],
    transactions: Transaction[],
    baseCurrency: CurrencyCode,
    rateMonth: string
  ): Promise<AssetGroup[]> {
    const groups: Map<string, AssetItem[]> = new Map();

    // Add credit cards and loans (always show as liabilities)
    const liabilityAccounts = accounts.filter(
      (a) => a.type === AccountType.CREDIT_CARD || a.type === AccountType.LOAN
    );
    for (const account of liabilityAccounts) {
      const balance = this.calculationService.calculateAccountBalance(account, transactions);
      // For credit cards/loans, the liability is the absolute value of negative balances
      const liability = Math.abs(Math.min(balance, 0));
      if (liability > 0) {
        const groupName = this.getAccountGroupName(account.type);
        if (!groups.has(groupName)) {
          groups.set(groupName, []);
        }

        let convertedValue = liability;
        let conversionRate: number | undefined;

        // Apply currency conversion if base currency is specified
        if (account.currencyCode !== baseCurrency) {
          const rate = await getRateForMonth(rateMonth, account.currencyCode, baseCurrency);
          convertedValue = liability * rate;
          conversionRate = rate;
        }

        groups.get(groupName)!.push({
          id: account.id,
          name: account.name,
          value: convertedValue,
          type: account.type,
          currencyCode: account.currencyCode,
          convertedValue:
            baseCurrency && account.currencyCode !== baseCurrency ? convertedValue : undefined,
          conversionRate,
        });
      }
    }

    // Add other accounts with negative balances (e.g., overdrafts)
    const overdraftAccounts = accounts.filter(
      (a) => a.type !== AccountType.CREDIT_CARD && a.type !== AccountType.LOAN
    );
    for (const account of overdraftAccounts) {
      const balance = this.calculationService.calculateAccountBalance(account, transactions);
      if (balance < 0) {
        const groupName = this.getAccountGroupName(account.type);
        if (!groups.has(groupName)) {
          groups.set(groupName, []);
        }

        const liability = Math.abs(balance);
        let convertedValue = liability;
        let conversionRate: number | undefined;

        // Apply currency conversion if base currency is specified
        if (account.currencyCode !== baseCurrency) {
          const rate = await getRateForMonth(rateMonth, account.currencyCode, baseCurrency);
          convertedValue = liability * rate;
          conversionRate = rate;
        }

        groups.get(groupName)!.push({
          id: account.id,
          name: account.name,
          value: convertedValue,
          type: account.type,
          currencyCode: account.currencyCode,
          convertedValue:
            baseCurrency && account.currencyCode !== baseCurrency ? convertedValue : undefined,
          conversionRate,
        });
      }
    }

    // Add manual liabilities
    const liabilityAssets = manualAssets.filter((a) => {
      const value = getAssetCurrentValue(a);
      return a.type === AssetType.LIABILITY || value < 0;
    });
    for (const asset of liabilityAssets) {
      const groupName = 'Liabilities';
      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }

      const assetValue = getAssetCurrentValue(asset);
      const liability = Math.abs(assetValue);
      let convertedValue = liability;
      let conversionRate: number | undefined;

      // Apply currency conversion if base currency is specified
      if (asset.currencyCode !== baseCurrency) {
        const rate = await getRateForMonth(rateMonth, asset.currencyCode, baseCurrency);
        if (rate !== null) {
          convertedValue = liability * rate;
          conversionRate = rate;
        }
      }

      groups.get(groupName)!.push({
        id: asset.id,
        name: asset.name,
        value: convertedValue,
        type: asset.type,
        currencyCode: asset.currencyCode,
        convertedValue: asset.currencyCode !== baseCurrency ? convertedValue : undefined,
        conversionRate,
      });
    }

    // Convert to AssetGroup array
    return Array.from(groups.entries()).map(([name, items]) => ({
      name,
      items,
      total: items.reduce((sum, item) => sum + item.value, 0),
    }));
  }

  /**
   * Get group name for account type
   */
  private getAccountGroupName(type: AccountType): string {
    switch (type) {
      case AccountType.CASH:
        return 'Cash & Cash Equivalents';
      case AccountType.BANK_ACCOUNT:
        return 'Bank Accounts';
      case AccountType.CREDIT_CARD:
        return 'Credit Cards';
      case AccountType.LOAN:
        return 'Loans';
      case AccountType.INVESTMENT:
        return 'Investments';
      default:
        return 'Other Assets';
    }
  }

  /**
   * Get group name for manual asset type
   */
  private getManualAssetGroupName(type: AssetType): string {
    switch (type) {
      case AssetType.REAL_ESTATE:
        return 'Real Estate';
      case AssetType.SUPERANNUATION:
        return 'Superannuation';
      case AssetType.STOCKS_AND_SHARES:
        return 'Stocks & Shares';
      case AssetType.LIABILITY:
        return 'Liabilities';
      default:
        return 'Other Assets';
    }
  }

  /**
   * Calculate net worth trend over time
   * @param accounts All accounts
   * @param manualAssets All manual assets
   * @param transactions All transactions
   * @param startDate Start date for trend (ISO string)
   * @param endDate End date for trend (ISO string)
   * @param interval Number of days between data points (default: 30)
   * @param baseCurrency Optional base currency for conversion
   * @returns Array of net worth trend points
   */
  async calculateNetWorthTrend(
    accounts: Account[],
    manualAssets: ManualAsset[],
    transactions: Transaction[],
    startDate: string,
    endDate: string,
    interval: number = 30,
    baseCurrency: CurrencyCode
  ): Promise<NetWorthTrendPoint[]> {
    const trend: NetWorthTrendPoint[] = [];
    // Parse dates as local dates to avoid timezone issues
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);

    const currentDate = new Date(start);
    while (currentDate <= end) {
      // Format date in local timezone
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const balanceSheet = await this.calculateBalanceSheet(
        accounts,
        manualAssets,
        transactions,
        dateStr,
        baseCurrency
      );

      trend.push({
        date: dateStr,
        netWorth: balanceSheet.netWorth,
        assets: balanceSheet.totalAssets,
        liabilities: balanceSheet.totalLiabilities,
      });

      currentDate.setDate(currentDate.getDate() + interval);
    }

    // Always include the end date as the final data point if not already included
    const lastPoint = trend[trend.length - 1];
    if (lastPoint && lastPoint.date !== endDate) {
      const balanceSheet = await this.calculateBalanceSheet(
        accounts,
        manualAssets,
        transactions,
        endDate,
        baseCurrency
      );

      trend.push({
        date: endDate,
        netWorth: balanceSheet.netWorth,
        assets: balanceSheet.totalAssets,
        liabilities: balanceSheet.totalLiabilities,
      });
    }

    return trend;
  }

  /**
   * Calculate month-over-month comparison
   */
  async calculateMonthOverMonthComparison(
    accounts: Account[],
    manualAssets: ManualAsset[],
    transactions: Transaction[],
    currentDate: string,
    baseCurrency: CurrencyCode
  ): Promise<{
    current: BalanceSheetData;
    previous: BalanceSheetData;
    change: number;
    changePercent: number;
  }> {
    const current = await this.calculateBalanceSheet(
      accounts,
      manualAssets,
      transactions,
      currentDate,
      baseCurrency
    );

    // Calculate previous month date (parse as local date to avoid timezone issues)
    const [year, month, day] = currentDate.split('-').map(Number);
    const currentDateObj = new Date(year, month - 1, day);
    currentDateObj.setMonth(currentDateObj.getMonth() - 1);
    const previousDate = `${currentDateObj.getFullYear()}-${String(currentDateObj.getMonth() + 1).padStart(2, '0')}-${String(currentDateObj.getDate()).padStart(2, '0')}`;

    const previous = await this.calculateBalanceSheet(
      accounts,
      manualAssets,
      transactions,
      previousDate,
      baseCurrency
    );

    const change = current.netWorth - previous.netWorth;
    const changePercent = previous.netWorth !== 0 ? (change / previous.netWorth) * 100 : 0;

    return {
      current,
      previous,
      change,
      changePercent,
    };
  }

  /**
   * Calculate year-over-year comparison
   */
  async calculateYearOverYearComparison(
    accounts: Account[],
    manualAssets: ManualAsset[],
    transactions: Transaction[],
    currentDate: string,
    baseCurrency: CurrencyCode
  ): Promise<{
    current: BalanceSheetData;
    previous: BalanceSheetData;
    change: number;
    changePercent: number;
  }> {
    const current = await this.calculateBalanceSheet(
      accounts,
      manualAssets,
      transactions,
      currentDate,
      baseCurrency
    );

    // Calculate previous year date (parse as local date to avoid timezone issues)
    const [year, month, day] = currentDate.split('-').map(Number);
    const currentDateObj = new Date(year, month - 1, day);
    currentDateObj.setFullYear(currentDateObj.getFullYear() - 1);
    const previousDate = `${currentDateObj.getFullYear()}-${String(currentDateObj.getMonth() + 1).padStart(2, '0')}-${String(currentDateObj.getDate()).padStart(2, '0')}`;

    const previous = await this.calculateBalanceSheet(
      accounts,
      manualAssets,
      transactions,
      previousDate,
      baseCurrency
    );

    const change = current.netWorth - previous.netWorth;
    const changePercent = previous.netWorth !== 0 ? (change / previous.netWorth) * 100 : 0;

    return {
      current,
      previous,
      change,
      changePercent,
    };
  }

  /**
   * Calculate cash flow for a date range
   * @param transactions All transactions
   * @param transactionTypes All transaction types
   * @param categories All categories
   * @param startDate Start date (YYYY-MM-DD)
   * @param endDate End date (YYYY-MM-DD)
   * @param accounts All accounts (needed for currency lookup)
   * @param baseCurrency Optional base currency for conversion
   * @returns Cash flow data grouped by category
   */
  async calculateCashFlow(
    transactions: Transaction[],
    transactionTypes: TransactionType[],
    categories: Category[],
    startDate: string,
    endDate: string,
    accounts: Account[] = [],
    baseCurrency: CurrencyCode
  ): Promise<CashFlowData> {
    // Filter transactions in date range and exclude transfers
    const filteredTransactions = transactions.filter(
      (t) => t.date >= startDate && t.date <= endDate
    );

    // Create lookup maps
    const typeData = new Map(transactionTypes.map((t) => [t.id, t]));
    const categoryData = new Map(categories.map((c) => [c.id, c]));
    const accountData = accounts ? new Map(accounts.map((a) => [a.id, a])) : new Map();

    // Group transactions by category
    const incomeByCategory = new Map<string, { total: number; count: number }>();
    const expensesByCategory = new Map<string, { total: number; count: number }>();

    for (const transaction of filteredTransactions) {
      const transactionType = typeData.get(transaction.transactionTypeId);
      if (!transactionType) continue;

      const category = categoryData.get(transactionType.categoryId);
      if (!category) continue;

      // Skip transfers and asset transactions (they're not regular income/expenses)
      if (
        transactionType.group === Group.TRANSFER ||
        transactionType.group === Group.ASSET_PURCHASE ||
        transactionType.group === Group.ASSET_SALE
      )
        continue;

      // Determine the account for currency lookup
      const accountId =
        transactionType.group === Group.INCOME
          ? transaction.toAccountId
          : transaction.fromAccountId;
      const account = accountId ? accountData.get(accountId) : null;

      // Convert amount if needed
      let convertedAmount = transaction.amount;
      if (account && account.currencyCode !== baseCurrency) {
        const month = transaction.date.substring(0, 7); // YYYY-MM
        const rate = await getRateForMonth(month, account.currencyCode, baseCurrency);
        if (rate !== null) {
          convertedAmount = transaction.amount * rate;
        }
      }

      const targetMap =
        transactionType.group === Group.INCOME ? incomeByCategory : expensesByCategory;
      const existing = targetMap.get(category.id) || { total: 0, count: 0 };
      targetMap.set(category.id, {
        total: existing.total + convertedAmount,
        count: existing.count + 1,
      });
    }

    // Convert to arrays
    const income: CategoryTotal[] = Array.from(incomeByCategory.entries()).map(
      ([categoryId, data]) => ({
        categoryId,
        categoryName: categoryData.get(categoryId)?.name || 'Unknown',
        total: data.total,
        transactionCount: data.count,
      })
    );

    const expenses: CategoryTotal[] = Array.from(expensesByCategory.entries()).map(
      ([categoryId, data]) => ({
        categoryId,
        categoryName: categoryData.get(categoryId)?.name || 'Unknown',
        total: data.total,
        transactionCount: data.count,
      })
    );

    const totalIncome = income.reduce((sum, cat) => sum + cat.total, 0);
    const totalExpenses = expenses.reduce((sum, cat) => sum + cat.total, 0);
    const netCashFlow = totalIncome - totalExpenses;

    return {
      income,
      expenses,
      totalIncome,
      totalExpenses,
      netCashFlow,
    };
  }

  /**
   * Calculate cash flow trend over time
   * @param transactions All transactions
   * @param transactionTypes All transaction types
   * @param categories All categories
   * @param startDate Start date (YYYY-MM-DD)
   * @param endDate End date (YYYY-MM-DD)
   * @param intervalDays Interval between data points in days
   * @param accounts All accounts (needed for currency lookup)
   * @param baseCurrency Optional base currency for conversion
   * @returns Array of cash flow trend points
   */
  async calculateCashFlowTrend(
    transactions: Transaction[],
    transactionTypes: TransactionType[],
    categories: Category[],
    startDate: string,
    endDate: string,
    intervalDays: number = 30,
    accounts: Account[] = [],
    baseCurrency: CurrencyCode
  ): Promise<CashFlowTrendPoint[]> {
    // Parse dates
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);

    if (start > end) return [];

    const trendPoints: CashFlowTrendPoint[] = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const periodEnd = new Date(currentDate);
      periodEnd.setDate(periodEnd.getDate() + intervalDays - 1);
      if (periodEnd > end) periodEnd.setTime(end.getTime());

      // Format dates as YYYY-MM-DD
      const periodStartStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const periodEndStr = `${periodEnd.getFullYear()}-${String(periodEnd.getMonth() + 1).padStart(2, '0')}-${String(periodEnd.getDate()).padStart(2, '0')}`;

      // Calculate cash flow for this period
      const cashFlow = await this.calculateCashFlow(
        transactions,
        transactionTypes,
        categories,
        periodStartStr,
        periodEndStr,
        accounts,
        baseCurrency
      );

      trendPoints.push({
        date: periodStartStr,
        income: cashFlow.totalIncome,
        expenses: cashFlow.totalExpenses,
        netCashFlow: cashFlow.netCashFlow,
      });

      // Move to next period
      currentDate.setDate(currentDate.getDate() + intervalDays);
    }

    return trendPoints;
  }

  /**
   * Calculate budget performance for a period
   * @param budgets All budgets
   * @param transactions All transactions
   * @param transactionTypes All transaction types
   * @param categories All categories
   * @param startDate Start date (YYYY-MM-DD)
   * @param endDate End date (YYYY-MM-DD)
   * @param accounts All accounts (needed for currency lookup)
   * @param baseCurrency Optional base currency for conversion
   * @returns Budget performance data
   */
  async calculateBudgetPerformance(
    budgets: Budget[],
    transactions: Transaction[],
    transactionTypes: TransactionType[],
    categories: Category[],
    startDate: string,
    endDate: string,
    accounts: Account[] = [],
    baseCurrency: CurrencyCode
  ): Promise<BudgetPerformanceData> {
    const items: BudgetPerformanceItem[] = [];
    let totalBudgetedIncome = 0;
    let totalActualIncome = 0;
    let totalBudgetedExpenses = 0;
    let totalActualExpenses = 0;

    // Group budgets by transaction type for easier lookup
    const budgetsByType = new Map<string, Budget>();
    budgets.forEach((budget) => {
      budgetsByType.set(budget.transactionTypeId, budget);
    });

    // Process each transaction type that has a budget
    for (const [transactionTypeId, budget] of budgetsByType) {
      const transactionType = transactionTypes.find((tt) => tt.id === transactionTypeId);
      if (!transactionType) continue;

      const category = categories.find((c) => c.id === transactionType.categoryId);
      if (!category) continue;

      // Prorate budget for the viewing period
      const budgetedAmount = this.calculationService.prorateBudgetForPeriod(
        budget,
        startDate,
        endDate
      );

      // Convert budget to base currency if needed
      let convertedBudgetedAmount = budgetedAmount;
      if (budget.currencyCode !== baseCurrency) {
        const month = startDate.slice(0, 7);
        const rate = await getRateForMonth(month, budget.currencyCode, baseCurrency);
        if (rate !== null) {
          convertedBudgetedAmount = budgetedAmount * rate;
        }
      }

      // Calculate actual amount with currency conversion
      let actualAmount = 0;
      const relevantTransactions = transactions.filter(
        (t) => t.transactionTypeId === transactionTypeId && t.date >= startDate && t.date <= endDate
      );

      for (const transaction of relevantTransactions) {
        let convertedAmount = transaction.amount;

        // Convert transaction amount to base currency if needed
        const accountId = transaction.fromAccountId || transaction.toAccountId;
        const account = accounts.find((a) => a.id === accountId);

        if (account && account.currencyCode !== baseCurrency) {
          const month = transaction.date.slice(0, 7);
          const rate = await getRateForMonth(month, account.currencyCode, baseCurrency);
          if (rate !== null) {
            convertedAmount = transaction.amount * rate;
          }
        }

        actualAmount += convertedAmount;
      }

      const remaining = convertedBudgetedAmount - actualAmount;
      const percentUsed =
        convertedBudgetedAmount > 0 ? (actualAmount / convertedBudgetedAmount) * 100 : 0;
      const isIncome = transactionType.group === Group.INCOME;

      items.push({
        budgetId: budget.id,
        transactionTypeId: transactionType.id,
        transactionTypeName: transactionType.name,
        categoryId: category.id,
        categoryName: category.name,
        budgetedAmount: convertedBudgetedAmount,
        actualAmount,
        remaining,
        percentUsed,
        isIncome,
      });

      // Accumulate totals
      if (isIncome) {
        totalBudgetedIncome += convertedBudgetedAmount;
        totalActualIncome += actualAmount;
      } else {
        totalBudgetedExpenses += convertedBudgetedAmount;
        totalActualExpenses += actualAmount;
      }
    }

    // Calculate overall health score (0-100)
    // For income: higher actual is better (score = min(actual/budgeted * 100, 100))
    // For expenses: lower actual is better (score = max((budgeted-actual)/budgeted * 100, 0))
    let healthScore = 100;
    const scores: number[] = [];

    items.forEach((item) => {
      if (item.isIncome) {
        // Income: 100% when meeting target, proportionally less when below
        const score =
          item.budgetedAmount > 0 ? (item.actualAmount / item.budgetedAmount) * 100 : 100;
        scores.push(Math.min(score, 100));
      } else {
        // Expenses: 100% when well under budget, 0% when over budget
        const score =
          item.budgetedAmount > 0
            ? ((item.budgetedAmount - item.actualAmount) / item.budgetedAmount) * 100
            : 100;
        scores.push(Math.max(Math.min(score, 100), 0));
      }
    });

    if (scores.length > 0) {
      healthScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }

    return {
      items,
      totalBudgetedIncome,
      totalActualIncome,
      totalRemainingIncome: totalBudgetedIncome - totalActualIncome,
      totalBudgetedExpenses,
      totalActualExpenses,
      totalRemainingExpenses: totalBudgetedExpenses - totalActualExpenses,
      overallHealthScore: healthScore,
    };
  }

  /**
   * Calculate budget trend over time
   * @param budgets All budgets
   * @param transactions All transactions
   * @param transactionTypes All transaction types
   * @param categories All categories
   * @param startDate Start date (YYYY-MM-DD)
   * @param endDate End date (YYYY-MM-DD)
   * @param intervalDays Interval between data points in days
   * @param accounts All accounts (needed for currency lookup)
   * @param baseCurrency Optional base currency for conversion
   * @returns Array of budget trend points
   */
  async calculateBudgetTrend(
    budgets: Budget[],
    transactions: Transaction[],
    transactionTypes: TransactionType[],
    categories: Category[],
    startDate: string,
    endDate: string,
    intervalDays: number = 30,
    accounts: Account[] = [],
    baseCurrency: CurrencyCode
  ): Promise<BudgetTrendPoint[]> {
    // Parse dates
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);

    if (start > end) return [];

    const trendPoints: BudgetTrendPoint[] = [];
    const currentDate = new Date(start);

    // Track cumulative totals
    let cumulativeBudgeted = 0;
    let cumulativeActual = 0;

    while (currentDate <= end) {
      const periodEnd = new Date(currentDate);
      periodEnd.setDate(periodEnd.getDate() + intervalDays - 1);
      if (periodEnd > end) periodEnd.setTime(end.getTime());

      // Format end date as YYYY-MM-DD
      const periodEndStr = `${periodEnd.getFullYear()}-${String(periodEnd.getMonth() + 1).padStart(2, '0')}-${String(periodEnd.getDate()).padStart(2, '0')}`;

      // Calculate budget performance from START to this point (cumulative)
      const performance = await this.calculateBudgetPerformance(
        budgets,
        transactions,
        transactionTypes,
        categories,
        startDate, // Always from the start
        periodEndStr, // To this period end
        accounts,
        baseCurrency
      );

      // Use cumulative totals for expenses and income
      cumulativeBudgeted = performance.totalBudgetedExpenses;
      cumulativeActual = performance.totalActualExpenses;
      const variance = cumulativeActual - cumulativeBudgeted;

      trendPoints.push({
        date: periodEndStr, // Use end date to show "as of" this date
        budgeted: cumulativeBudgeted,
        actual: cumulativeActual,
        variance,
        budgetedIncome: performance.totalBudgetedIncome,
        actualIncome: performance.totalActualIncome,
      });

      // Move to next period
      currentDate.setDate(currentDate.getDate() + intervalDays);
    }

    return trendPoints;
  }
}
