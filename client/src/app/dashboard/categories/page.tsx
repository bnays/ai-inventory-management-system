'use client';

import * as React from 'react';
import { 
  Button, Stack, Typography, Box, useTheme, 
  CircularProgress, Paper 
} from '@mui/material';
import { 
  Plus as PlusIcon, 
  Folders, 
  ArrowClockwise 
} from '@phosphor-icons/react';
import { CategoriesTable } from '@/components/dashboard/categories/categories-table';
import { EditCategoryModal } from '@/components/dashboard/categories/edit-category-modal';
import { AddCategoryModal } from '@/components/dashboard/categories/add-category-modal';
import { DeleteConfirmationDialog } from '@/components/dashboard/layout/delete-confimation-dialog';
import { useCategories, type Category } from '@/contexts/category-context';

export default function Page(): React.JSX.Element {
  const theme = useTheme();
  const { categories, refreshCategories, deleteCategory } = useCategories();
  
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<Category | null>(null);

  React.useEffect(() => {
    refreshCategories().catch(console.error);
  }, [refreshCategories]);

  const handleEditClick = (category: Category) => {
    setSelectedCategory(category);
    setIsEditOpen(true);
  };

  const handleDeleteClick = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteOpen(true);
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    setIsDeleting(true);
    try {
      await deleteCategory(selectedCategory.id);
      setIsDeleteOpen(false);
      setSelectedCategory(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete category.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh' }}>
      
      {/* --- PAGE HEADER --- */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ color: 'neutral.900', letterSpacing: '-0.02em' }}>
            Category
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Folders size={18} weight="duotone" color={theme.palette.primary.main} />
            <Typography variant="body2" color="text.secondary" fontWeight="500">
              Organize Categories
            </Typography>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button 
            startIcon={<ArrowClockwise size={18} weight="bold" />} 
            variant="outlined" 
            onClick={() => refreshCategories()}
            sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, bgcolor: 'white' }}
          >
            Refresh
          </Button>
          <Button 
            startIcon={<PlusIcon size={18} weight="bold" />} 
            variant="contained" 
            onClick={() => setIsAddOpen(true)}
            sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, px: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          >
            Add Category
          </Button>
        </Stack>
      </Stack>

      {/* --- TABLE CONTAINER --- */}
      <Paper sx={{ borderRadius: 5, border: '1px solid #eaecf0', overflow: 'hidden', boxShadow: 'none' }}>
        <CategoriesTable 
          rows={categories} 
          onEdit={handleEditClick} 
          onDelete={handleDeleteClick} 
        />
      </Paper>

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
        content={`Are you sure you want to delete "${selectedCategory?.name}"? All associated product links will be set to uncategorized.`}
        isLoading={isDeleting}
      />
    </Box>
  );
}