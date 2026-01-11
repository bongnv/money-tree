import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  IconButton,
  Divider,
  LinearProgress,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useAccountStore } from '../../stores/useAccountStore';
import { useAppStore } from '../../stores/useAppStore';
import { useExchangeRateStore } from '../../stores/useExchangeRateStore';
import { BudgetDialog } from './BudgetDialog';
import { PeriodSelector } from '../common/PeriodSelector';
import { CategoryFilter } from '../common/CategoryFilter';
import { getBudgetPresets } from './periodPresets';
import type { Budget } from '../../types/models';
import { formatCurrency } from '../../utils/currency.utils';
import { calculationService } from '../../services/calculation.service';
import { Group, CurrencyCode } from '../../types/enums';

export const BudgetsPage: React.FC = () => {
  const { budgets, addBudget, updateBudget, deleteBudget } = useBudgetStore();
  const { transactionTypes, getCategoryById, categories } = useCategoryStore();
  const { transactions } = useTransactionStore();
  const { accounts } = useAccountStore();
  const baseCurrency = useAppStore((state) => state.baseCurrency);
  const getRateForMonth = useExchangeRateStore((state) => state.getRateForMonth);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>(undefined);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Initialize with current month
  const getCurrentMonthPeriod = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // Format date as YYYY-MM-DD without timezone issues
    const formatDate = (y: number, m: number, d: number): string => {
      const paddedMonth = String(m).padStart(2, '0');
      const paddedDay = String(d).padStart(2, '0');
      return `${y}-${paddedMonth}-${paddedDay}`;
    };

    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

    return {
      startDate: formatDate(year, month + 1, 1),
      endDate: formatDate(year, month + 1, lastDayOfMonth),
    };
  };

  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentMonthPeriod());

  const handleAdd = () => {
    setEditingBudget(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setDialogOpen(true);
  };

  const handleDelete = (budget: Budget) => {
    const transactionType = transactionTypes.find((tt) => tt.id === budget.transactionTypeId);
    const confirmMessage = `Are you sure you want to delete the budget for "${transactionType?.name}"?`;

    if (window.confirm(confirmMessage)) {
      deleteBudget(budget.id);
    }
  };

  const handleSubmit = (budgetData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingBudget) {
        // Update existing budget item
        updateBudget(editingBudget.id, budgetData);
      } else {
        // Add new budget item
        const newBudget: Budget = {
          id: `budget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...budgetData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        addBudget(newBudget);
      }
      setDialogOpen(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save budget');
    }
  };

  const getProgressColor = (percentage: number, isIncome: boolean): string => {
    if (isIncome) {
      // Income: green when meeting/exceeding target
      if (percentage >= 100) return 'success';
      if (percentage >= 60) return 'warning';
      return 'error';
    } else {
      // Expenses: green when under budget
      if (percentage < 80) return 'success';
      if (percentage <= 100) return 'warning';
      return 'error';
    }
  };

  // Group budget items by category with progress data
  const [groupedBudgets, setGroupedBudgets] = useState<
    Record<
      string,
      {
        category: any;
        items: {
          budget: Budget;
          transactionType: any;
          proratedBudget: number;
          actualAmount: number;
          percentage: number;
        }[];
        totalBudget: number;
        totalActual: number;
      }
    >
  >({});

  useEffect(() => {
    const calculateGroupedBudgets = async () => {
      // Filter budgets that are active during the selected period
      let activeBudgets = budgets.filter((budget) => {
        // Check if budget overlaps with selected period
        return (
          budget.startDate <= selectedPeriod.endDate && budget.endDate >= selectedPeriod.startDate
        );
      });

      // Filter by selected categories if any
      if (selectedCategories.length > 0) {
        activeBudgets = activeBudgets.filter((budget) => {
          const transactionType = transactionTypes.find((tt) => tt.id === budget.transactionTypeId);
          return transactionType && selectedCategories.includes(transactionType.categoryId);
        });
      }

      const grouped: Record<
        string,
        {
          category: any;
          items: {
            budget: Budget;
            transactionType: any;
            proratedBudget: number;
            actualAmount: number;
            percentage: number;
          }[];
          totalBudget: number;
          totalActual: number;
        }
      > = {};

      for (const budget of activeBudgets) {
        const transactionType = transactionTypes.find((tt) => tt.id === budget.transactionTypeId);
        if (!transactionType) continue;

        const category = getCategoryById(transactionType.categoryId);
        if (!category) continue;

        // Prorate budget for the selected period using day-based calculation
        let proratedBudget = calculationService.prorateBudgetForPeriod(
          budget,
          selectedPeriod.startDate,
          selectedPeriod.endDate
        );

        // Convert budget to base currency if needed
        if (baseCurrency && getRateForMonth && budget.currencyCode !== baseCurrency) {
          const month = selectedPeriod.startDate.slice(0, 7);
          const rate = await getRateForMonth(month, budget.currencyCode, baseCurrency);
          if (rate !== null) {
            proratedBudget = proratedBudget * rate;
          }
        }

        // Calculate actual amount with currency conversion
        let actualAmount = 0;
        const relevantTransactions = transactions.filter(
          (t) =>
            t.transactionTypeId === budget.transactionTypeId &&
            t.date >= selectedPeriod.startDate &&
            t.date <= selectedPeriod.endDate
        );

        for (const transaction of relevantTransactions) {
          let convertedAmount = transaction.amount;

          // Convert transaction amount to base currency if needed
          if (baseCurrency && getRateForMonth) {
            const accountId = transaction.fromAccountId || transaction.toAccountId;
            const account = accounts.find((a) => a.id === accountId);

            if (account && account.currencyCode !== baseCurrency) {
              const month = transaction.date.slice(0, 7);
              const rate = await getRateForMonth(month, account.currencyCode, baseCurrency);
              if (rate !== null) {
                convertedAmount = transaction.amount * rate;
              }
            }
          }

          actualAmount += convertedAmount;
        }

        const percentage = proratedBudget > 0 ? (actualAmount / proratedBudget) * 100 : 0;

        if (!grouped[category.id]) {
          grouped[category.id] = {
            category,
            items: [],
            totalBudget: 0,
            totalActual: 0,
          };
        }

        grouped[category.id].items.push({
          budget,
          transactionType,
          proratedBudget,
          actualAmount,
          percentage,
        });

        grouped[category.id].totalBudget += proratedBudget;
        grouped[category.id].totalActual += actualAmount;
      }

      setGroupedBudgets(grouped);
    };

    calculateGroupedBudgets();
  }, [
    budgets,
    transactionTypes,
    transactions,
    accounts,
    selectedPeriod,
    getCategoryById,
    selectedCategories,
    baseCurrency,
    getRateForMonth,
  ]);

  const getSectionTitle = (categoryGroup: Group): string => {
    return categoryGroup === Group.INCOME ? 'Targets' : 'Budgets';
  };

  const formatDateRange = (budget: Budget): string => {
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return `${formatDate(budget.startDate)} - ${formatDate(budget.endDate)}`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Budgets
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <PeriodSelector
            startDate={selectedPeriod.startDate}
            endDate={selectedPeriod.endDate}
            onChange={setSelectedPeriod}
            presets={getBudgetPresets()}
            allowCustom={false}
          />
          <CategoryFilter
            categories={categories}
            selectedCategories={selectedCategories}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedCategories(typeof value === 'string' ? value.split(',') : value);
            }}
            onClear={() => setSelectedCategories([])}
            label="Filter by Category"
            fullWidth={false}
            sx={{ minWidth: 250 }}
          />
          {selectedCategories.length > 0 && (
            <Button variant="outlined" onClick={() => setSelectedCategories([])} size="small">
              Clear Filter
            </Button>
          )}
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
            Add Budget
          </Button>
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Viewing period: {selectedPeriod.startDate} to {selectedPeriod.endDate}
      </Typography>

      {budgets.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No budgets set
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Click &quot;Add Budget&quot; to get started with budget planning
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
            Add Budget
          </Button>
        </Paper>
      ) : (
        <Box>
          {Object.values(groupedBudgets).map(({ category, items, totalBudget, totalActual }) => {
            // Get group from first transaction type in this category (all should have same group)
            const firstTransactionType = items[0]?.transactionType;
            const isIncome = firstTransactionType?.group === Group.INCOME;
            const totalPercentage = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

            return (
              <Paper key={category.id} sx={{ mb: 2 }}>
                <Box sx={{ p: 2, backgroundColor: 'grey.100' }}>
                  <Typography variant="h6">
                    {category.name}{' '}
                    {firstTransactionType && getSectionTitle(firstTransactionType.group)}
                  </Typography>
                </Box>
                <List disablePadding>
                  {items.map(
                    (
                      { budget, transactionType, proratedBudget, actualAmount, percentage },
                      index
                    ) => (
                      <React.Fragment key={budget.id}>
                        {index > 0 && <Divider />}
                        <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch', py: 1.5 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              mb: 0.5,
                            }}
                          >
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body1" fontWeight="medium">
                                {transactionType.name}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.25 }}
                              >
                                <Box component="span">
                                  {formatCurrency(actualAmount, CurrencyCode.USD)} of{' '}
                                  {formatCurrency(proratedBudget, CurrencyCode.USD)}
                                </Box>
                                <Box component="span" sx={{ color: 'text.primary' }}>
                                  ({percentage.toFixed(0)}%)
                                </Box>
                                <Box component="span">•</Box>
                                <Box component="span">
                                  {formatCurrency(budget.amount, CurrencyCode.USD)} {budget.period}
                                </Box>
                                <Box component="span">•</Box>
                                <Box component="span">{formatDateRange(budget)}</Box>
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', ml: 1 }}>
                              <IconButton
                                size="small"
                                aria-label="edit"
                                onClick={() => handleEdit(budget)}
                                sx={{ mr: 0.5 }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                aria-label="delete"
                                onClick={() => handleDelete(budget)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(percentage, 100)}
                            color={getProgressColor(percentage, isIncome) as any}
                            sx={{ height: 6, borderRadius: 1 }}
                          />
                        </ListItem>
                      </React.Fragment>
                    )
                  )}
                  <Divider />
                  <ListItem sx={{ backgroundColor: 'grey.50', py: 2 }}>
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Total
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {formatCurrency(totalActual, CurrencyCode.USD)} of{' '}
                          {formatCurrency(totalBudget, CurrencyCode.USD)} (
                          {totalPercentage.toFixed(0)}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(totalPercentage, 100)}
                        color={getProgressColor(totalPercentage, isIncome) as any}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>
                  </ListItem>
                </List>
              </Paper>
            );
          })}
        </Box>
      )}

      <BudgetDialog
        open={dialogOpen}
        budget={editingBudget}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />
    </Box>
  );
};
