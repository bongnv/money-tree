import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { BudgetDialog } from './BudgetDialog';
import type { Budget } from '../../types/models';
import { formatCurrency } from '../../utils/currency.utils';

export const BudgetsPage: React.FC = () => {
  const { budgets, addBudget, updateBudget, deleteBudget, getBudgetByTransactionTypeId } = useBudgetStore();
  const { transactionTypes, getCategoryById } = useCategoryStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>(undefined);

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

  const getPeriodLabel = (period: string): string => {
    switch (period) {
      case 'monthly':
        return 'per month';
      case 'quarterly':
        return 'per quarter';
      case 'yearly':
        return 'per year';
      default:
        return '';
    }
  };

  // Group budget items by category
  const groupedBudgets = budgets.reduce((acc, budget) => {
    const transactionType = transactionTypes.find((tt) => tt.id === budget.transactionTypeId);
    if (!transactionType) return acc;

    const category = getCategoryById(transactionType.categoryId);
    if (!category) return acc;

    if (!acc[category.id]) {
      acc[category.id] = {
        category,
        items: [],
      };
    }

    acc[category.id].items.push({
      budget,
      transactionType,
    });

    return acc;
  }, {} as Record<string, { category: any; items: { budget: Budget; transactionType: any }[] }>);

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
          {Object.values(groupedBudgets).map(({ category, items }) => (
            <Paper key={category.id} sx={{ mb: 2 }}>
              <Box sx={{ p: 2, backgroundColor: 'grey.100' }}>
                <Typography variant="h6">{category.name}</Typography>
              </Box>
              <List disablePadding>
                {items.map(({ budget, transactionType }, index) => (
                  <React.Fragment key={budget.id}>
                    {index > 0 && <Divider />}
                    <ListItem
                      secondaryAction={
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
                      }
                    >
                      <ListItemText
                        primary={transactionType.name}
                        secondary={`${formatCurrency(budget.amount, 'usd')} ${getPeriodLabel(budget.period)}`}
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          ))}
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
