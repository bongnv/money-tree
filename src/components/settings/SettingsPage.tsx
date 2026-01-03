import React, { useState } from 'react';
import { Container, Typography, Tabs, Tab, Box } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CategoryIcon from '@mui/icons-material/Category';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SyncIcon from '@mui/icons-material/Sync';
import { AccountsPage } from '../accounts/AccountsPage';
import { ManualAssetsPage } from '../assets/ManualAssetsPage';
import { CategoryList } from '../categories/CategoryList';
import { CategoryDialog } from '../categories/CategoryDialog';
import { TransactionTypeList } from '../categories/TransactionTypeList';
import { TransactionTypeDialog } from '../categories/TransactionTypeDialog';
import { DataSyncSettings } from './DataSyncSettings';
import { useCategoryStore } from '../../stores/useCategoryStore';
import type { Category, TransactionType } from '../../types/models';
import { Add as AddIcon } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
};

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

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

  // Category state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
  const [categoryDeleteDialogOpen, setCategoryDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | undefined>();

  // Transaction Type state
  const [transactionTypeDialogOpen, setTransactionTypeDialogOpen] = useState(false);
  const [selectedTransactionType, setSelectedTransactionType] = useState<
    TransactionType | undefined
  >();
  const [transactionTypeDeleteDialogOpen, setTransactionTypeDeleteDialogOpen] = useState(false);
  const [transactionTypeToDelete, setTransactionTypeToDelete] = useState<
    TransactionType | undefined
  >();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
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
      alert(
        `Cannot delete category "${category.name}" because it has ${relatedTransactionTypes.length} transaction type(s). Please delete the transaction types first.`
      );
      return;
    }
    setCategoryToDelete(category);
    setCategoryDeleteDialogOpen(true);
  };

  const handleConfirmDeleteCategory = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete.id);
      setCategoryDeleteDialogOpen(false);
      setCategoryToDelete(undefined);
    }
  };

  const handleCancelDeleteCategory = () => {
    setCategoryDeleteDialogOpen(false);
    setCategoryToDelete(undefined);
  };

  const handleSubmitCategory = (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedCategory) {
      updateCategory(selectedCategory.id, category);
    } else {
      const newCategory: Category = {
        ...category,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addCategory(newCategory);
    }
    handleCloseCategoryDialog();
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
      setTransactionTypeDeleteDialogOpen(false);
      setTransactionTypeToDelete(undefined);
    }
  };

  const handleCancelDeleteTransactionType = () => {
    setTransactionTypeDeleteDialogOpen(false);
    setTransactionTypeToDelete(undefined);
  };

  const handleSubmitTransactionType = (
    transactionType: Omit<TransactionType, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (selectedTransactionType) {
      updateTransactionType(selectedTransactionType.id, transactionType);
    } else {
      const newTransactionType: TransactionType = {
        ...transactionType,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addTransactionType(newTransactionType);
    }
    handleCloseTransactionTypeDialog();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Settings</Typography>
        {(activeTab === 2 || activeTab === 3) && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={activeTab === 2 ? handleOpenCategoryDialog : handleOpenTransactionTypeDialog}
          >
            {activeTab === 2 ? 'New Category' : 'New Transaction Type'}
          </Button>
        )}
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<AccountBalanceWalletIcon />} label="Transactional" iconPosition="start" />
          <Tab icon={<AccountBalanceIcon />} label="Manual Assets" iconPosition="start" />
          <Tab icon={<CategoryIcon />} label="Categories" iconPosition="start" />
          <Tab icon={<ReceiptIcon />} label="Transaction Types" iconPosition="start" />
          <Tab icon={<SyncIcon />} label="Data & Sync" iconPosition="start" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <AccountsPage />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <ManualAssetsPage />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <CategoryList
          categories={categories}
          transactionTypes={transactionTypes}
          onEdit={handleEditCategory}
          onDelete={handleDeleteCategory}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <TransactionTypeList
          transactionTypes={transactionTypes}
          categories={categories}
          onEdit={handleEditTransactionType}
          onDelete={handleDeleteTransactionType}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        <DataSyncSettings />
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
            Are you sure you want to delete the category &quot;{categoryToDelete?.name}&quot;? This
            action cannot be undone.
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
            Are you sure you want to delete the transaction type &quot;
            {transactionTypeToDelete?.name}&quot;? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDeleteTransactionType}>Cancel</Button>
          <Button onClick={handleConfirmDeleteTransactionType} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
