import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { categoryService } from '../../services/category.service';
import { transactionTypeService } from '../../services/transactionType.service';
import { Container, Typography, Box, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { CategoryList } from '../categories/CategoryList';
import { CategoryDialog } from '../categories/CategoryDialog';
import type { Category } from '../../types/models';

export const CategoriesListPage: React.FC = () => {
  const navigate = useNavigate();
  const categories = useLiveQuery(() => categoryService.getActive()) ?? [];
  const transactionTypes = useLiveQuery(() => transactionTypeService.getActive()) ?? [];

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

  const handleSubmitCategory = async (
    categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>
  ) => {
    if (selectedCategory?.id) {
      await categoryService.update(selectedCategory.id, categoryData);
    } else {
      await categoryService.create(categoryData);
    }
    handleCloseCategoryDialog();
  };

  const handleDeleteCategory = async (category: Category) => {
    if (
      window.confirm(
        `Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`
      )
    ) {
      await categoryService.delete(category.id);
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
        categories={categories || []}
        transactionTypes={transactionTypes || []}
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
