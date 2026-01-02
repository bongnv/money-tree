import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import type { Category, TransactionType } from '../../types/models';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { CategoryList } from './CategoryList';
import { CategoryDialog } from './CategoryDialog';
import { TransactionTypeList } from './TransactionTypeList';
import { TransactionTypeDialog } from './TransactionTypeDialog';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`categories-tabpanel-${index}`}
      aria-labelledby={`categories-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

export const CategoriesPage: React.FC = () => {
  const {
    categories,
    transactionTypes,
    addCategory,
    updateCategory,
    deleteCategory,
    addTransactionType,
    updateTransactionType,
    deleteTransactionType,
    getTransactionTypesByCategory,
  } = useCategoryStore();

  const [tabValue, setTabValue] = useState(0);

  // Category state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
  const [categoryDeleteDialogOpen, setCategoryDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | undefined>();

  // Transaction Type state
  const [transactionTypeDialogOpen, setTransactionTypeDialogOpen] = useState(false);
  const [selectedTransactionType, setSelectedTransactionType] = useState<TransactionType | undefined>();
  const [transactionTypeDeleteDialogOpen, setTransactionTypeDeleteDialogOpen] = useState(false);
  const [transactionTypeToDelete, setTransactionTypeToDelete] = useState<TransactionType | undefined>();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Category handlers
  const handleOpenCategoryDialog = () => {
    setSelectedCategory(undefined);
    setCategoryDialogOpen(true);
  };

  const handleCloseCategoryDialog = () => {
    setCategoryDialogOpen(false);
    setSelectedCategory(undefined);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setCategoryDialogOpen(true);
  };

  const handleDeleteCategory = (category: Category) => {
    const relatedTransactionTypes = getTransactionTypesByCategory(category.id);
    if (relatedTransactionTypes.length > 0) {
      // Don't allow deletion if there are transaction types
      alert(`Cannot delete category "${category.name}" because it has ${relatedTransactionTypes.length} transaction type(s). Please delete the transaction types first.`);
      return;
    }
    setCategoryToDelete(category);
    setCategoryDeleteDialogOpen(true);
  };

  const handleConfirmDeleteCategory = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete.id);
    }
    setCategoryDeleteDialogOpen(false);
    setCategoryToDelete(undefined);
  };

  const handleCancelDeleteCategory = () => {
    setCategoryDeleteDialogOpen(false);
    setCategoryToDelete(undefined);
  };

  const handleSubmitCategory = (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedCategory) {
      updateCategory(selectedCategory.id, categoryData);
    } else {
      const newCategory: Category = {
        ...categoryData,
        id: `cat-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addCategory(newCategory);
    }
  };

  // Transaction Type handlers
  const handleOpenTransactionTypeDialog = () => {
    setSelectedTransactionType(undefined);
    setTransactionTypeDialogOpen(true);
  };

  const handleCloseTransactionTypeDialog = () => {
    setTransactionTypeDialogOpen(false);
    setSelectedTransactionType(undefined);
  };

  const handleEditTransactionType = (transactionType: TransactionType) => {
    setSelectedTransactionType(transactionType);
    setTransactionTypeDialogOpen(true);
  };

  const handleDeleteTransactionType = (transactionType: TransactionType) => {
    setTransactionTypeToDelete(transactionType);
    setTransactionTypeDeleteDialogOpen(true);
  };

  const handleConfirmDeleteTransactionType = () => {
    if (transactionTypeToDelete) {
      deleteTransactionType(transactionTypeToDelete.id);
    }
    setTransactionTypeDeleteDialogOpen(false);
    setTransactionTypeToDelete(undefined);
  };

  const handleCancelDeleteTransactionType = () => {
    setTransactionTypeDeleteDialogOpen(false);
    setTransactionTypeToDelete(undefined);
  };

  const handleSubmitTransactionType = (transactionTypeData: Omit<TransactionType, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedTransactionType) {
      updateTransactionType(selectedTransactionType.id, transactionTypeData);
    } else {
      const newTransactionType: TransactionType = {
        ...transactionTypeData,
        id: `tt-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addTransactionType(newTransactionType);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Categories & Transaction Types
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={tabValue === 0 ? handleOpenCategoryDialog : handleOpenTransactionTypeDialog}
        >
          {tabValue === 0 ? 'New Category' : 'New Transaction Type'}
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="categories tabs">
          <Tab label="Categories" id="categories-tab-0" aria-controls="categories-tabpanel-0" />
          <Tab label="Transaction Types" id="categories-tab-1" aria-controls="categories-tabpanel-1" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <CategoryList
          categories={categories}
          transactionTypes={transactionTypes}
          onEdit={handleEditCategory}
          onDelete={handleDeleteCategory}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <TransactionTypeList
          transactionTypes={transactionTypes}
          categories={categories}
          onEdit={handleEditTransactionType}
          onDelete={handleDeleteTransactionType}
        />
      </TabPanel>

      {/* Category Dialogs */}
      <CategoryDialog
        open={categoryDialogOpen}
        category={selectedCategory}
        onClose={handleCloseCategoryDialog}
        onSubmit={handleSubmitCategory}
      />

      <Dialog open={categoryDeleteDialogOpen} onClose={handleCancelDeleteCategory}>
        <DialogTitle>Delete Category</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{categoryToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDeleteCategory}>Cancel</Button>
          <Button onClick={handleConfirmDeleteCategory} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transaction Type Dialogs */}
      <TransactionTypeDialog
        open={transactionTypeDialogOpen}
        transactionType={selectedTransactionType}
        categories={categories}
        onClose={handleCloseTransactionTypeDialog}
        onSubmit={handleSubmitTransactionType}
      />

      <Dialog open={transactionTypeDeleteDialogOpen} onClose={handleCancelDeleteTransactionType}>
        <DialogTitle>Delete Transaction Type</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{transactionTypeToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDeleteTransactionType}>Cancel</Button>
          <Button onClick={handleConfirmDeleteTransactionType} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
