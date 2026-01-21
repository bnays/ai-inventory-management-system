'use client';

import * as React from 'react';
import { Stack, Typography, Button } from '@mui/material';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { CategoriesTable } from '@/components/dashboard/categories/categories-table';
import { EditCategoryModal } from '@/components/dashboard/categories/edit-category-modal';
import { AddCategoryModal } from '@/components/dashboard/categories/add-category-modal';
import { DeleteConfirmationDialog } from '@/components/dashboard/layout/delete-confimation-dialog';
import { useCategories, type Category } from '@/contexts/category-context';

export default function Page(): React.JSX.Element {
  const { categories, refreshCategories, deleteCategory } = useCategories();
  
  // Modal visibility states
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  
  // Action states
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<Category | null>(null);

  React.useEffect(() => {
    refreshCategories().catch(console.error);
  }, [refreshCategories]);

  // Trigger for Edit button in Table
  const handleEditClick = (category: Category) => {
    setSelectedCategory(category);
    setIsEditOpen(true);
  };

  // Trigger for Delete button in Table
  const handleDeleteClick = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteOpen(true);
  };

  // Logic to execute the delete
  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    
    setIsDeleting(true);
    try {
      await deleteCategory(selectedCategory.id);
      setIsDeleteOpen(false);
      setSelectedCategory(null);
    } catch (err: any) {
      // This will catch the "Cannot delete: products linked" error from your backend
      alert(err.message || "Failed to delete category.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3} sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h4" fontWeight="bold">Categories</Typography>
        <Button 
          startIcon={<PlusIcon />} 
          variant="contained" 
          onClick={() => setIsAddOpen(true)}
        >
          Add Category
        </Button>
      </Stack>

      <CategoriesTable 
        rows={categories} 
        onEdit={handleEditClick} 
        onDelete={handleDeleteClick} 
      />

      <AddCategoryModal open={isAddOpen} onClose={() => setIsAddOpen(false)} />
      
      <EditCategoryModal 
        open={isEditOpen} 
        category={selectedCategory} 
        onClose={() => {
          setIsEditOpen(false);
          setSelectedCategory(null);
        }} 
      />

      <DeleteConfirmationDialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteCategory}
        title="Delete Category?"
        content={`Are you sure you want to delete "${selectedCategory?.name}"?`}
        isLoading={isDeleting}
        />
    </Stack>
  );
}