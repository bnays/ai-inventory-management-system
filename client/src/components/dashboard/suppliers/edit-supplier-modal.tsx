// src/components/dashboard/suppliers/edit-supplier-modal.tsx
'use client';

import * as React from 'react';
import { 
  Button, Dialog, DialogActions, DialogContent, 
  DialogTitle, FormControl, InputLabel, OutlinedInput, Stack 
} from '@mui/material';
import { useSuppliers, type Supplier } from '@/contexts/supplier-context';

export function EditSupplierModal({ open, onClose, supplier }: { open: boolean; onClose: () => void; supplier: Supplier | null }) {
  const { updateSupplier } = useSuppliers();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supplier) return;
    
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      await updateSupplier(supplier.id, payload);
      onClose();
    } catch (err) {
      alert("Failed to update supplier.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit Supplier: {supplier?.name}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <FormControl fullWidth required>
              <InputLabel>Supplier Name</InputLabel>
              <OutlinedInput label="Supplier Name" name="name" defaultValue={supplier?.name} required />
            </FormControl>
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth required>
                <InputLabel>Phone Number</InputLabel>
                <OutlinedInput label="Phone Number" name="phone_number" defaultValue={supplier?.phone_number} required />
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel>Email</InputLabel>
                <OutlinedInput label="Email" name="email" defaultValue={supplier?.email} required />
              </FormControl>
            </Stack>
            <FormControl fullWidth>
              <InputLabel>Address</InputLabel>
              <OutlinedInput 
                label="Address" 
                name="address" 
                multiline 
                rows={2} 
                defaultValue={supplier?.address} 
                placeholder="e.g. 123 Logistics Way, Sydney NSW 2000"
              />
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Payment Details</InputLabel>
              <OutlinedInput 
                label="Payment Details" 
                name="payment_details" 
                multiline 
                rows={3} 
                defaultValue={supplier?.payment_details} 
              />
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}