// src/components/dashboard/products/edit-product-modal.tsx
'use client';

import * as React from 'react';
import {
  Autocomplete, Button, Chip, Dialog, DialogActions, DialogContent, 
  DialogTitle, FormControl, InputLabel, MenuItem, Select, Stack, TextField
} from '@mui/material';
import { useCategories } from '@/contexts/category-context';
import { useSuppliers } from '@/contexts/supplier-context'; // Import your supplier context
import { useInventory } from '@/hooks/use-inventory';
import type { Product } from './products-table';

interface EditProductModalProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
}

export function EditProductModal({ open, onClose, product }: EditProductModalProps): React.JSX.Element {
  const { categories } = useCategories();
  const { suppliers } = useSuppliers(); // Access existing suppliers
  const { updateProduct } = useInventory();

  const [formData, setFormData] = React.useState({
    product_name: '',
    sku: '',
    category_id: '',
    unit_price: '',
    reorder_level: '',
  });

  const [selectedSuppliers, setSelectedSuppliers] = React.useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Sync basic data and suppliers
  React.useEffect(() => {
    if (product && categories.length > 0) {
      setFormData({
        product_name: product.product_name || '',
        sku: product.sku || '',
        category_id: product.category_id ? String(product.category_id) : '', 
        unit_price: String(product.unit_price || 0),
        reorder_level: String(product.reorder_level || 0),
      });

      // If product has supplier_names string, map it back to supplier objects
      if (product.supplier_names) {
        const names = product.supplier_names.split(', ');
        const matched = suppliers.filter(s => names.includes(s.name));
        setSelectedSuppliers(matched);
      } else {
        setSelectedSuppliers([]);
      }
    }
  }, [product, categories, suppliers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    
    setIsSubmitting(true);
    try {
      await updateProduct(product.product_id, {
        ...formData,
        category_id: Number(formData.category_id),
        unit_price: Number(formData.unit_price),
        reorder_level: Number(formData.reorder_level),
        // Send the updated supplier array to your PATCH route
        suppliers: selectedSuppliers.map(s => ({
          supplier_id: s.id,
          supply_price: Number(formData.unit_price) // Or specific supply price
        }))
      });
      onClose();
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit Product: {product?.product_name}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField required fullWidth label="Product Name" 
              value={formData.product_name} onChange={(e) => setFormData({...formData, product_name: e.target.value})} />
            
            <Stack direction="row" spacing={2}>
              <TextField required fullWidth label="SKU" 
                value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} />
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select label="Category" value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value as string })}>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={String(cat.id)}>{cat.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            {/* NEW: Multi-Select Suppliers Section */}
            <Autocomplete
              multiple
              options={suppliers}
              getOptionLabel={(option) => option.name}
              value={selectedSuppliers}
              onChange={(_, newValue) => setSelectedSuppliers(newValue)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index });
                  return (
                    <Chip key={key} label={option.name} {...tagProps} size="small" color="primary" variant="outlined" onClick={(e) => {e.preventDefault}}/>
                  );
                })
              }
              renderInput={(params) => (
                <TextField {...params} label="Manage Suppliers" placeholder="Select vendors" />
              )}
            />

            <Stack direction="row" spacing={2}>
              <TextField required fullWidth label="Unit Price" type="number" 
                value={formData.unit_price} onChange={(e) => setFormData({...formData, unit_price: e.target.value})} />
              <TextField required fullWidth label="Reorder Level" type="number" 
                value={formData.reorder_level} onChange={(e) => setFormData({...formData, reorder_level: e.target.value})} />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Update Product'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}