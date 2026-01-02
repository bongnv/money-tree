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
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { BudgetDialog } from './BudgetDialog';
import type { Budget } from '../../types/models';
import { formatCurrency } from '../../utils/currency.utils';
import { calculationService } from '../../services/calculation.service';
import { Group } from '../../types/enums';

export const BudgetsPage: React.FC = () => {
  const { budgets, addBudget, updateBudget, deleteBudget, getBudgetByTransactionTypeId } = useBudgetStore();
  const { transactionTypes, getCategoryById } = useCategoryStore();
  const { transactions } = useTransactionStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>(undefined);

  // Get current month's date range
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const lastDay = new Date(year, month, 0).getDate();
    
    return {
      startDate: `${year}-${String(month).padStart(2, '0')}-01`,
      endDate: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    };
  }, []);

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
    if (editingBudget) {
      // Update existing budget item
      updateBudget(editingBudget.id, budgetData);
    } else {
      // Check if budget already exists for this transaction type
      const existing = getBudgetByTransactionTypeId(budgetData.transactionTypeId);
      if (existing) {
        alert('A budget already exists for this transaction type. Please edit the existing budget instead.');
        return;
      }

      // Add new budget item
      const newBudget: Budget = {
        id: `budget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...budgetData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addBudget(newBudget);
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
    return budgets.reduce((acc, budget) => {
      const transactionType = transactionTypes.find((tt) => tt.id === budget.transactionTypeId);
      if (!transactionType) return acc;

      const category = getCategoryById(transactionType.categoryId);
      if (!category) return acc;

      // Prorate budget to monthly
      const monthlyBudget = calculationService.prorateBudget(budget.amount, budget.period, 'monthly');
      
      // Calculate actual amount for current month
      const actualAmount = calculationService.calculateActualAmount(
        budget.transactionTypeId,
        transactions,
        startDate,
        endDate
      );

      const percentage = monthlyBudget > 0 ? (actualAmount / monthlyBudget) * 100 : 0;

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
        monthlyBudget,
        actualAmount,
        percentage,
      });

      acc[category.id].totalBudget += monthlyBudget;
      acc[category.id].totalActual += actualAmount;

      return acc;
    }, {} as Record<string, { 
      category: any; 
      items: { 
        budget: Budget; 
        transactionType: any; 
        monthlyBudget: number;
        actualAmount: number;
        percentage: number;
      }[];
      totalBudget: number;
      totalActual: number;
    }>);
  }, [budgets, transactionTypes, transactions, startDate, endDate, getCategoryById]);

  const getSectionTitle = (categoryGroup: Group): string => {
    return categoryGroup === Group.INCOME ? 'Targets' : 'Budgets';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Budgets
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Add Budget
        </Button>
      </Box>

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
                  {items.map(({ budget, transactionType, monthlyBudget, actualAmount, percentage }, index) => (
                    <React.Fragment key={budget.id}>
                      {index > 0 && <Divider />}
                      <ListItem
                        sx={{ flexDirection: 'column', alignItems: 'stretch', py: 2 }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <ListItemText
                            primary={transactionType.name}
                            secondary={
                              <Box component="span">
                                <Box component="span" sx={{ display: 'block' }}>
                                  {formatCurrency(actualAmount, 'usd')} of {formatCurrency(monthlyBudget, 'usd')} 
                                  {' '}({percentage.toFixed(0)}%)
                                </Box>
                                <Box component="span" sx={{ display: 'block', fontSize: '0.75rem', color: 'text.secondary' }}>
                                  Original: {formatCurrency(budget.amount, 'usd')} {budget.period}
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
                  ))}
                  <Divider />
                  <ListItem sx={{ backgroundColor: 'grey.50', py: 2 }}>
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Total
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {formatCurrency(totalActual, 'usd')} of {formatCurrency(totalBudget, 'usd')}
                          {' '}({totalPercentage.toFixed(0)}%)
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
