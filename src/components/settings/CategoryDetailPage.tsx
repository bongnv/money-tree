import React, { useState } from 'react';
import { Container, Typography, Box, Button, Breadcrumbs, Link } from '@mui/material';
import { Add as AddIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { TransactionTypeList } from '@/components/categories/TransactionTypeList';
import { TransactionTypeDialog } from '@/components/categories/TransactionTypeDialog';
import type { TransactionType } from '@/types/models';
import { useStore } from '@/contexts/StoreContext';

export const CategoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    categories,
    transactionTypes: allTransactionTypes,
    addTransactionType,
    updateTransactionType,
    deleteTransactionType,
  } = useStore();

  const category = categories.find((c) => c.id === id);
  const categoryTransactionTypes = allTransactionTypes.filter((tt) => tt.categoryId === id);

  const [transactionTypeDialogOpen, setTransactionTypeDialogOpen] = useState(false);
  const [selectedTransactionType, setSelectedTransactionType] = useState<
    TransactionType | undefined
  >();

  if (!category) {
    return (
      <Container maxWidth="lg">
        <Typography variant="h4">Category not found</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/settings/categories')}>
          Back to Categories
        </Button>
      </Container>
    );
  }

  const handleOpenTransactionTypeDialog = () => {
    setSelectedTransactionType(undefined);
    setTransactionTypeDialogOpen(true);
  };

  const handleEditTransactionType = (transactionType: TransactionType) => {
    setSelectedTransactionType(transactionType);
    setTransactionTypeDialogOpen(true);
  };

  const handleCloseTransactionTypeDialog = () => {
    setTransactionTypeDialogOpen(false);
    setSelectedTransactionType(undefined);
  };

  const handleSubmitTransactionType = async (
    transactionType: Omit<TransactionType, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (selectedTransactionType?.id) {
      await updateTransactionType(selectedTransactionType.id, transactionType);
    } else {
      await addTransactionType(transactionType);
    }
    handleCloseTransactionTypeDialog();
  };

  const handleDeleteTransactionType = async (transactionType: TransactionType) => {
    if (
      window.confirm(
        `Are you sure you want to delete the transaction type "${transactionType.name}"?`
      )
    ) {
      await deleteTransactionType(transactionType.id);
    }
  };

  const handleArchiveTransactionType = async (transactionType: TransactionType) => {
    if (transactionType.isActive) {
      await updateTransactionType(transactionType.id, { isActive: false });
    } else {
      await updateTransactionType(transactionType.id, { isActive: true });
    }
  };

  return (
    <Container maxWidth="lg">
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/settings/categories')}
          sx={{ cursor: 'pointer' }}
        >
          Categories
        </Link>
        <Typography color="text.primary">{category.name}</Typography>
      </Breadcrumbs>

      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/settings/categories')}
          sx={{ mb: 2 }}
        >
          Back to Categories
        </Button>
        <Typography variant="h4" component="h1">
          {category.name}
        </Typography>
        {category.description && (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            {category.description}
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h5" component="h2">
          Transaction Types
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenTransactionTypeDialog}
        >
          New Transaction Type
        </Button>
      </Box>

      <TransactionTypeList
        transactionTypes={categoryTransactionTypes}
        categories={categories || []}
        onEdit={handleEditTransactionType}
        onDelete={handleDeleteTransactionType}
        onArchive={handleArchiveTransactionType}
      />

      <TransactionTypeDialog
        open={transactionTypeDialogOpen}
        transactionType={selectedTransactionType}
        categories={categories || []}
        categoryId={category.id}
        onClose={handleCloseTransactionTypeDialog}
        onSubmit={handleSubmitTransactionType}
      />
    </Container>
  );
};
