"use client";

import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Stack } from '@mui/material';
import { useCustomers } from '@/contexts/customer-context';
import { useNotification } from '@/lib/notification';
import { GlobalSnackbar } from '@/components/core/global-snackbar'; // Import this!

interface CustomerDialogProps {
  open: boolean;
  onClose: () => void;
  editData?: any;
}

export function CustomerDialog({ open, onClose, editData }: CustomerDialogProps) {
  const { addCustomer, updateCustomer } = useCustomers();
  // Destructure notification and hideNotification as well
  const { notification, showNotification, hideNotification } = useNotification(); 
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });

  useEffect(() => {
    if (editData) setFormData(editData);
    else setFormData({ name: '', email: '', phone: '', address: '' });
  }, [editData, open]);

  const handleSubmit = async () => {
    try {
      if (editData) {
        await updateCustomer(editData.customer_id, formData);
        showNotification(`${formData.name} updated!`, "success");
      } else {
        await addCustomer(formData);
        showNotification("New partner added successfully.", "success");
      }
      
      // Delay closing slightly so the user sees the success snackbar
      setTimeout(() => {
        onClose();
      }, 500); 
    } catch (error: any) {
      showNotification("Error saving changes.", "error");
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>{editData ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Business Name" fullWidth value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            <TextField label="Email" fullWidth value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            <TextField label="Phone" fullWidth value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            <TextField label="Address" multiline rows={2} fullWidth value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Save</Button>
        </DialogActions>
      </Dialog>

      <GlobalSnackbar state={notification} onClose={hideNotification} />
    </>
  );
}