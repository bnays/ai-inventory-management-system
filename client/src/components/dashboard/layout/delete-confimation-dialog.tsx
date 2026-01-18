// src/components/dashboard/layout/delete-confirmation-dialog.tsx
'use client';

import * as React from 'react';
import { 
  Button, Dialog, DialogActions, DialogContent, 
  DialogContentText, DialogTitle 
} from '@mui/material';

interface DeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;           // Dynamic title (e.g., "Delete Supplier")
  content: string;         // Dynamic warning message
  isLoading?: boolean;
}

export function DeleteConfirmationDialog({ 
  open, onClose, onConfirm, title, content, isLoading 
}: DeleteDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <DialogContentText sx={{ marginBottom: "30px" }}>{content}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>Cancel</Button>
        <Button 
          onClick={onConfirm} 
          color="error" 
          variant="contained" 
          autoFocus
          disabled={isLoading}
        >
          {isLoading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}