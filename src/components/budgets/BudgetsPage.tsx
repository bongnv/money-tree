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
import { BudgetDialog } from './BudgetDialog';
import { PeriodSelector } from '../common/PeriodSelector';
import { CategoryFilter } from '../common/CategoryFilter';
import { getBudgetPresets } from './periodPresets';
import type { Budget } from '../../types/models';
import { formatCurrency } from '../../utils/currency.utils';
import { useCalculationService } from '../../contexts/ServiceProviders';
import { Group } from '../../types/enums';

export const BudgetsPage: React.FC = () => {
  const { budgets, addBudget, updateBudget, deleteBudget } = useBudgetStore();
  const { transactionTypes, getCategoryById, categories } = useCategoryStore();
  const { transactions } = useTransactionStore();
  const { accounts } = useAccountStore();
  const baseCurrency = useAppStore((state) => state.baseCurrency);
  const calculationService = useCalculationService();

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

      const grouped = await calculationService.calculateBudgetGrouping(
        activeBudgets,
        transactions,
        transactionTypes,
        accounts,
        selectedPeriod,
        baseCurrency,
        getCategoryById
      );

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
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ mb: { xs: 2, sm: 3 } }}>
          Budgets
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: { xs: 1, sm: 2 },
            alignItems: { xs: 'stretch', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            flexWrap: 'wrap',
          }}
        >
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
            sx={{ minWidth: { xs: '100%', sm: 250 } }}
          />
          <Box sx={{ display: 'flex', gap: 1, flexGrow: { xs: 1, sm: 0 } }}>
            {selectedCategories.length > 0 && (
              <Button
                variant="outlined"
                onClick={() => setSelectedCategories([])}
                size="small"
                sx={{ flexGrow: { xs: 1, sm: 0 } }}
              >
                Clear Filter
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              sx={{ flexGrow: { xs: 1, sm: 0 } }}
            >
              Add Budget
            </Button>
          </Box>
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
                        <ListItem
                          sx={{
                            flexDirection: 'column',
                            alignItems: 'stretch',
                            py: 1.5,
                            px: { xs: 1, sm: 2 },
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              mb: 0.5,
                              gap: 1,
                            }}
                          >
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body1" fontWeight="medium">
                                {transactionType.name}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  display: 'flex',
                                  gap: { xs: 0.5, sm: 1 },
                                  flexWrap: 'wrap',
                                  mt: 0.25,
                                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                }}
                              >
                                <Box component="span">
                                  {formatCurrency(actualAmount, baseCurrency)} of{' '}
                                  {formatCurrency(proratedBudget, baseCurrency)}
                                </Box>
                                <Box component="span" sx={{ color: 'text.primary' }}>
                                  ({percentage.toFixed(0)}%)
                                </Box>
                                <Box
                                  component="span"
                                  sx={{ display: { xs: 'none', sm: 'inline' } }}
                                >
                                  •
                                </Box>
                                <Box component="span">
                                  {formatCurrency(budget.amount, baseCurrency)} {budget.period}
                                </Box>
                                <Box
                                  component="span"
                                  sx={{ display: { xs: 'none', sm: 'inline' } }}
                                >
                                  •
                                </Box>
                                <Box
                                  component="span"
                                  sx={{
                                    width: { xs: '100%', sm: 'auto' },
                                    mt: { xs: 0.25, sm: 0 },
                                  }}
                                >
                                  {formatDateRange(budget)}
                                </Box>
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', flexShrink: 0 }}>
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
                  <ListItem sx={{ backgroundColor: 'grey.50', py: 2, px: { xs: 1, sm: 2 } }}>
                    <Box sx={{ width: '100%' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1,
                          gap: 1,
                          flexWrap: { xs: 'wrap', sm: 'nowrap' },
                        }}
                      >
                        <Typography variant="subtitle1" fontWeight="bold">
                          Total
                        </Typography>
                        <Typography
                          variant="subtitle1"
                          fontWeight="bold"
                          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                        >
                          {formatCurrency(totalActual, baseCurrency)} of{' '}
                          {formatCurrency(totalBudget, baseCurrency)} ({totalPercentage.toFixed(0)}
                          %)
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
