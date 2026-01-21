'use client';

import * as React from 'react';
import { 
  Button, Dialog, DialogActions, DialogContent, 
  DialogTitle, FormControl, InputLabel, OutlinedInput, Stack 
} from '@mui/material';
import { useCategories } from '@/contexts/category-context';
import { apiRequest } from '@/lib/api-client';

export function AddCategoryModal({ open, onClose }: { open: boolean, onClose: () => void }): React.JSX.Element {
  const { refreshCategories } = useCategories();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get('name'),
      description: formData.get('description'), // Now supported by your DB
    };

    try {
      await apiRequest('/categories', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      await refreshCategories(); 
      onClose();
    } catch (err) {
      console.error('Failed to add category:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <DialogTitle>Add New Category</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <FormControl fullWidth required>
              <InputLabel>Category Name</InputLabel>
              <OutlinedInput label="Category Name" name="name" placeholder="e.g. Raw Materials" />
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Description</InputLabel>
              <OutlinedInput 
                label="Description" 
                name="description" 
                multiline 
                rows={3} 
                placeholder="Describe the items in this category" 
              />
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button disabled={isSubmitting} type="submit" variant="contained">
            {isSubmitting ? 'Saving...' : 'Add Category'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}