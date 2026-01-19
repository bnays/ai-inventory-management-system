// src/components/dashboard/products/add-product-modal.tsx
'use client';

import * as React from 'react';
import {
  Autocomplete, Button, Dialog, DialogActions, DialogContent, 
  DialogTitle, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Chip
} from '@mui/material';
import { useCategories } from '@/contexts/category-context';
import { useSuppliers } from '@/contexts/supplier-context'; // Ensure this context exists
import { useInventory } from '@/hooks/use-inventory';

export function AddProductModal({ open, onClose }: { open: boolean; onClose: () => void }): React.JSX.Element {
  const { categories } = useCategories();
  const { suppliers } = useSuppliers(); // Pull from your supplier management list
  const { addProduct } = useInventory();

  const [formData, setFormData] = React.useState({
    product_name: '',
    sku: '',
    category_id: '',
    unit_price: '',
    reorder_level: '',
    initial_stock: '',
  });

  const [selectedSuppliers, setSelectedSuppliers] = React.useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await addProduct({
        ...formData,
        category_id: Number(formData.category_id),
        unit_price: Number(formData.unit_price),
        reorder_level: Number(formData.reorder_level),
        initial_stock: Number(formData.initial_stock),
        // Map selected suppliers to the format your backend expects
        suppliers: selectedSuppliers.map(sup => ({
          supplier_id: sup.id,
          supply_price: Number(formData.unit_price), // You can add a specific price field later
          lead_time_days: 7 // Default lead time
        }))
      });
      onClose();
    } catch (error) {
      console.error('Create failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <DialogTitle>Add New Product</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField required fullWidth label="Product Name" 
              onChange={(e) => setFormData({...formData, product_name: e.target.value})} />
            
            <Stack direction="row" spacing={2}>
              <TextField required fullWidth label="SKU" 
                onChange={(e) => setFormData({...formData, sku: e.target.value})} />
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select label="Category" value={formData.category_id} 
                  onChange={(e) => setFormData({...formData, category_id: e.target.value as string})}>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            {/* NEW: Multi-Select Suppliers Field */}
            <Autocomplete
                multiple
                options={suppliers}
                getOptionLabel={(option) => option.name}
                filterSelectedOptions
                value={selectedSuppliers}
                onChange={(_, newValue) => setSelectedSuppliers(newValue)}
                renderInput={(params) => (
                    <TextField {...params} label="Suppliers" placeholder="Select multiple suppliers" />
                )}
                renderTags={(value, getTagProps) =>
                    value.map((option, index) => {
                    // Destructure to separate the key from the rest of the props
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                        <Chip 
                        key={key} // Pass the key explicitly
                        label={option.name} 
                        {...tagProps} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                        onClick={(e) => {e.preventDefault}}
                        />
                    );
                    })
                }
            />

            <Stack direction="row" spacing={2}>
              <TextField required fullWidth label="Unit Price" type="number" 
                onChange={(e) => setFormData({...formData, unit_price: e.target.value})} />
              <TextField required fullWidth label="Reorder Level" type="number" 
                onChange={(e) => setFormData({...formData, reorder_level: e.target.value})} />
            </Stack>
            
            <TextField fullWidth label="Initial Stock Level" type="number" 
              onChange={(e) => setFormData({...formData, initial_stock: e.target.value})} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Product'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}