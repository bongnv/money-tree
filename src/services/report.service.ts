import type { Account, ManualAsset, Transaction } from '../types/models';
import { AccountType, AssetType } from '../types/enums';
import { calculationService } from './calculation.service';

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
}

export interface NetWorthTrendPoint {
  date: string;
  netWorth: number;
  assets: number;
  liabilities: number;
}

/**
 * Report service for generating financial reports
 */
class ReportService {
  /**
   * Calculate balance sheet for a given date
   * @param accounts All accounts
   * @param manualAssets All manual assets
   * @param transactions All transactions up to the date
   * @param asOfDate Date to calculate balance sheet for (ISO string)
   * @returns Balance sheet data
   */
  calculateBalanceSheet(
    accounts: Account[],
    manualAssets: ManualAsset[],
    transactions: Transaction[],
    asOfDate?: string
  ): BalanceSheetData {
    // Filter transactions up to the date
    const filteredTransactions = asOfDate
      ? transactions.filter((t) => t.date <= asOfDate)
      : transactions;

    // Filter manual assets up to the date
    const filteredManualAssets = asOfDate
      ? manualAssets.filter((a) => a.date <= asOfDate)
      : manualAssets;

    // Group assets by type
    const assetGroups = this.groupAssets(accounts, filteredManualAssets, filteredTransactions);
    const liabilityGroups = this.groupLiabilities(
      accounts,
      filteredManualAssets,
      filteredTransactions
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
  private groupAssets(
    accounts: Account[],
    manualAssets: ManualAsset[],
    transactions: Transaction[]
  ): AssetGroup[] {
    const groups: Map<string, AssetItem[]> = new Map();

    // Add account assets (positive balance accounts, excluding credit cards and loans)
    accounts
      .filter((a) => a.type !== AccountType.CREDIT_CARD && a.type !== AccountType.LOAN)
      .forEach((account) => {
        const balance = calculationService.calculateAccountBalance(account, transactions);
        if (balance > 0) {
          const groupName = this.getAccountGroupName(account.type);
          if (!groups.has(groupName)) {
            groups.set(groupName, []);
          }
          groups.get(groupName)!.push({
            id: account.id,
            name: account.name,
            value: balance,
            type: account.type,
          });
        }
      });

    // Add manual assets (positive value)
    manualAssets
      .filter((a) => a.value >= 0 && a.type !== AssetType.LIABILITY)
      .forEach((asset) => {
        const groupName = this.getManualAssetGroupName(asset.type);
        if (!groups.has(groupName)) {
          groups.set(groupName, []);
        }
        groups.get(groupName)!.push({
          id: asset.id,
          name: asset.name,
          value: asset.value,
          type: asset.type,
        });
      });

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
  private groupLiabilities(
    accounts: Account[],
    manualAssets: ManualAsset[],
    transactions: Transaction[]
  ): AssetGroup[] {
    const groups: Map<string, AssetItem[]> = new Map();

    // Add credit cards and loans (always show as liabilities)
    accounts
      .filter((a) => a.type === AccountType.CREDIT_CARD || a.type === AccountType.LOAN)
      .forEach((account) => {
        const balance = calculationService.calculateAccountBalance(account, transactions);
        // For credit cards/loans, the liability is the absolute value of negative balances
        const liability = Math.abs(Math.min(balance, 0));
        if (liability > 0) {
          const groupName = this.getAccountGroupName(account.type);
          if (!groups.has(groupName)) {
            groups.set(groupName, []);
          }
          groups.get(groupName)!.push({
            id: account.id,
            name: account.name,
            value: liability,
            type: account.type,
          });
        }
      });

    // Add other accounts with negative balances (e.g., overdrafts)
    accounts
      .filter((a) => a.type !== AccountType.CREDIT_CARD && a.type !== AccountType.LOAN)
      .forEach((account) => {
        const balance = calculationService.calculateAccountBalance(account, transactions);
        if (balance < 0) {
          const groupName = this.getAccountGroupName(account.type);
          if (!groups.has(groupName)) {
            groups.set(groupName, []);
          }
          groups.get(groupName)!.push({
            id: account.id,
            name: account.name,
            value: Math.abs(balance),
            type: account.type,
          });
        }
      });

    // Add manual liabilities
    manualAssets
      .filter((a) => a.type === AssetType.LIABILITY || a.value < 0)
      .forEach((asset) => {
        const groupName = 'Liabilities';
        if (!groups.has(groupName)) {
          groups.set(groupName, []);
        }
        groups.get(groupName)!.push({
          id: asset.id,
          name: asset.name,
          value: Math.abs(asset.value),
          type: asset.type,
        });
      });

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
      case AssetType.INVESTMENT:
        return 'Investments';
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
   * @returns Array of net worth trend points
   */
  calculateNetWorthTrend(
    accounts: Account[],
    manualAssets: ManualAsset[],
    transactions: Transaction[],
    startDate: string,
    endDate: string,
    interval: number = 30
  ): NetWorthTrendPoint[] {
    const trend: NetWorthTrendPoint[] = [];
    // Parse dates as local dates to avoid timezone issues
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);

    let currentDate = new Date(start);
    while (currentDate <= end) {
      // Format date in local timezone
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const balanceSheet = this.calculateBalanceSheet(
        accounts,
        manualAssets,
        transactions,
        dateStr
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
      const balanceSheet = this.calculateBalanceSheet(
        accounts,
        manualAssets,
        transactions,
        endDate
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
  calculateMonthOverMonthComparison(
    accounts: Account[],
    manualAssets: ManualAsset[],
    transactions: Transaction[],
    currentDate: string
  ): {
    current: BalanceSheetData;
    previous: BalanceSheetData;
    change: number;
    changePercent: number;
  } {
    const current = this.calculateBalanceSheet(accounts, manualAssets, transactions, currentDate);

    // Calculate previous month date (parse as local date to avoid timezone issues)
    const [year, month, day] = currentDate.split('-').map(Number);
    const currentDateObj = new Date(year, month - 1, day);
    currentDateObj.setMonth(currentDateObj.getMonth() - 1);
    const previousDate = `${currentDateObj.getFullYear()}-${String(currentDateObj.getMonth() + 1).padStart(2, '0')}-${String(currentDateObj.getDate()).padStart(2, '0')}`;

    const previous = this.calculateBalanceSheet(
      accounts,
      manualAssets,
      transactions,
      previousDate
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
  calculateYearOverYearComparison(
    accounts: Account[],
    manualAssets: ManualAsset[],
    transactions: Transaction[],
    currentDate: string
  ): {
    current: BalanceSheetData;
    previous: BalanceSheetData;
    change: number;
    changePercent: number;
  } {
    const current = this.calculateBalanceSheet(accounts, manualAssets, transactions, currentDate);

    // Calculate previous year date (parse as local date to avoid timezone issues)
    const [year, month, day] = currentDate.split('-').map(Number);
    const currentDateObj = new Date(year, month - 1, day);
    currentDateObj.setFullYear(currentDateObj.getFullYear() - 1);
    const previousDate = `${currentDateObj.getFullYear()}-${String(currentDateObj.getMonth() + 1).padStart(2, '0')}-${String(currentDateObj.getDate()).padStart(2, '0')}`;

    const previous = this.calculateBalanceSheet(
      accounts,
      manualAssets,
      transactions,
      previousDate
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
}

export const reportService = new ReportService();
