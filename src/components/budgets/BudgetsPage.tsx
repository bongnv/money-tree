import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  LinearProgress,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { BudgetDialog } from './BudgetDialog';
import { PeriodSelector, type PeriodOption } from './PeriodSelector';
import type { Budget } from '../../types/models';
import { formatCurrency } from '../../utils/currency.utils';
import { calculationService } from '../../services/calculation.service';
import { Group } from '../../types/enums';

export const BudgetsPage: React.FC = () => {
  const { budgets, addBudget, updateBudget, deleteBudget } = useBudgetStore();
  const { transactionTypes, getCategoryById } = useCategoryStore();
  const { transactions } = useTransactionStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>(undefined);

  // Initialize with current month
  const getCurrentMonthPeriod = (): PeriodOption => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const monthStartDate = new Date(year, month, 1);
    const monthEndDate = new Date(year, month + 1, 0);

    return {
      label: `${monthNames[month]} ${year}`,
      startDate: monthStartDate.toISOString().split('T')[0],
      endDate: monthEndDate.toISOString().split('T')[0],
    };
  };

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>(getCurrentMonthPeriod());

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
  const groupedBudgets = useMemo(() => {
    // Filter budgets that are active during the selected period
    const activeBudgets = budgets.filter((budget) => {
      // Check if budget overlaps with selected period
      return (
        budget.startDate <= selectedPeriod.endDate && budget.endDate >= selectedPeriod.startDate
      );
    });

    return activeBudgets.reduce(
      (acc, budget) => {
        const transactionType = transactionTypes.find((tt) => tt.id === budget.transactionTypeId);
        if (!transactionType) return acc;

        const category = getCategoryById(transactionType.categoryId);
        if (!category) return acc;

        // Prorate budget for the selected period using day-based calculation
        const proratedBudget = calculationService.prorateBudgetForPeriod(
          budget,
          selectedPeriod.startDate,
          selectedPeriod.endDate
        );

        // Calculate actual amount for selected period
        const actualAmount = calculationService.calculateActualAmount(
          budget.transactionTypeId,
          transactions,
          selectedPeriod.startDate,
          selectedPeriod.endDate
        );

        const percentage = proratedBudget > 0 ? (actualAmount / proratedBudget) * 100 : 0;

        if (!acc[category.id]) {
          acc[category.id] = {
            category,
            items: [],
            totalBudget: 0,
            totalActual: 0,
          };
        }

        acc[category.id].items.push({
          budget,
          transactionType,
          proratedBudget,
          actualAmount,
          percentage,
        });

        acc[category.id].totalBudget += proratedBudget;
        acc[category.id].totalActual += actualAmount;

        return acc;
      },
      {} as Record<
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
    );
  }, [budgets, transactionTypes, transactions, selectedPeriod, getCategoryById]);

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
          <PeriodSelector value={selectedPeriod.label} onChange={setSelectedPeriod} />
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
            Add Budget
          </Button>
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Viewing period: {selectedPeriod.label}
      </Typography>

      {budgets.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No budgets set
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Click "Add Budget" to get started with budget planning
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
            Add Budget
          </Button>
        </Paper>
      ) : (
        <Box>
          {Object.values(groupedBudgets).map(({ category, items, totalBudget, totalActual }) => {
            const isIncome = category.group === Group.INCOME;
            const totalPercentage = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

            return (
              <Paper key={category.id} sx={{ mb: 2 }}>
                <Box sx={{ p: 2, backgroundColor: 'grey.100' }}>
                  <Typography variant="h6">
                    {category.name} {getSectionTitle(category.group)}
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
                        <ListItem sx={{ flexDirection: 'column', alignItems: 'stretch', py: 2 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              mb: 1,
                            }}
                          >
                            <ListItemText
                              primary={transactionType.name}
                              secondary={
                                <Box component="span">
                                  <Box component="span" sx={{ display: 'block' }}>
                                    {formatCurrency(actualAmount, 'usd')} of{' '}
                                    {formatCurrency(proratedBudget, 'usd')} ({percentage.toFixed(0)}
                                    %)
                                  </Box>
                                  <Box
                                    component="span"
                                    sx={{
                                      display: 'block',
                                      fontSize: '0.75rem',
                                      color: 'text.secondary',
                                    }}
                                  >
                                    Original: {formatCurrency(budget.amount, 'usd')} {budget.period}
                                    {' • '}
                                    {formatDateRange(budget)}
                                  </Box>
                                </Box>
                              }
                            />
                            <Box>
                              <IconButton
                                edge="end"
                                aria-label="edit"
                                onClick={() => handleEdit(budget)}
                                sx={{ mr: 1 }}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                edge="end"
                                aria-label="delete"
                                onClick={() => handleDelete(budget)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(percentage, 100)}
                            color={getProgressColor(percentage, isIncome) as any}
                            sx={{ height: 8, borderRadius: 1 }}
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
                          {formatCurrency(totalActual, 'usd')} of{' '}
                          {formatCurrency(totalBudget, 'usd')} ({totalPercentage.toFixed(0)}%)
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
