// src/components/dashboard/categories/edit-category-modal.tsx
'use client';

import * as React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, OutlinedInput, Stack } from '@mui/material';
import { useCategories, type Category } from '@/contexts/category-context';

export function EditCategoryModal({ open, onClose, category }: { open: boolean; onClose: () => void; category: Category | null }) {
  const { updateCategory } = useCategories();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!category) return;

    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      await updateCategory(category.id, payload);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit Category</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <FormControl fullWidth required>
              <InputLabel>Category Name</InputLabel>
              <OutlinedInput name="name" defaultValue={category?.name} label="Category Name" required />
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Description</InputLabel>
              <OutlinedInput name="description" defaultValue={category?.description} label="Description" multiline rows={3} />
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>Save Changes</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}