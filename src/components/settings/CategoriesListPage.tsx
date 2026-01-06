import React, { useState } from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { CategoryList } from '../categories/CategoryList';
import { CategoryDialog } from '../categories/CategoryDialog';
import { useCategoryStore } from '../../stores/useCategoryStore';
import type { Category } from '../../types/models';

export const CategoriesListPage: React.FC = () => {
  const navigate = useNavigate();
  const { categories, transactionTypes, addCategory, updateCategory, deleteCategory } =
    useCategoryStore();

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();

  const handleOpenCategoryDialog = () => {
    setSelectedCategory(undefined);
    setCategoryDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setCategoryDialogOpen(true);
  };

  const handleCloseCategoryDialog = () => {
    setCategoryDialogOpen(false);
    setSelectedCategory(undefined);
  };

  const handleSubmitCategory = (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedCategory) {
      updateCategory(selectedCategory.id, {
        ...categoryData,
        id: selectedCategory.id,
        createdAt: selectedCategory.createdAt,
        updatedAt: new Date().toISOString(),
      });
    } else {
      const now = new Date().toISOString();
      addCategory({
        ...categoryData,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      });
    }
    handleCloseCategoryDialog();
  };

  const handleDeleteCategory = (category: Category) => {
    if (
      window.confirm(
        `Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`
      )
    ) {
      deleteCategory(category.id);
    }
  };

  const handleCategoryClick = (category: Category) => {
    navigate(`/settings/categories/${category.id}`);
  };

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Categories
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCategoryDialog}>
          New Category
        </Button>
      </Box>

      <CategoryList
        categories={categories}
        transactionTypes={transactionTypes}
        onEdit={handleEditCategory}
        onDelete={handleDeleteCategory}
        onClick={handleCategoryClick}
      />

      <CategoryDialog
        open={categoryDialogOpen}
        category={selectedCategory}
        onClose={handleCloseCategoryDialog}
        onSubmit={handleSubmitCategory}
      />
    </Container>
  );
};
