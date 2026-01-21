// src/components/dashboard/suppliers/add-supplier-modal.tsx
'use client';

import * as React from 'react';
import { 
  Button, Dialog, DialogActions, DialogContent, 
  DialogTitle, FormControl, InputLabel, OutlinedInput, Stack 
} from '@mui/material';
import { useSuppliers } from '@/contexts/supplier-context';
import { apiRequest } from '@/lib/api-client';

export function AddSupplierModal({ open, onClose }: { open: boolean; onClose: () => void }): React.JSX.Element {
  const { refreshSuppliers } = useSuppliers();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      await apiRequest('/suppliers', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await refreshSuppliers();
      onClose();
    } catch (err) {
      console.error('Failed to add supplier:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <DialogTitle>Add New Supplier</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <FormControl fullWidth required>
              <InputLabel>Supplier Name</InputLabel>
              <OutlinedInput label="Supplier Name" name="name" required />
            </FormControl>
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth required>
                <InputLabel>Phone Number</InputLabel>
                <OutlinedInput label="Phone Number" name="phone_number" required />
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel>Email</InputLabel>
                <OutlinedInput label="Email" name="email" type="email" required />
              </FormControl>
            </Stack>
            <FormControl fullWidth>
              <InputLabel>Address</InputLabel>
              <OutlinedInput label="Address" name="address" multiline rows={2} />
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <OutlinedInput label="Payment Method" name="payment_method" placeholder="e.g. Bank Transfer" />
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Payment Details</InputLabel>
              <OutlinedInput 
                label="Payment Details" 
                name="payment_details" 
                multiline 
                rows={3} 
                placeholder="e.g., BSB: 000-000, Account: 12345678" 
              />
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button disabled={isSubmitting} type="submit" variant="contained">
            {isSubmitting ? 'Saving...' : 'Add Supplier'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}