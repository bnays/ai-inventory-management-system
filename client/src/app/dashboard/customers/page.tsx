"use client";

import React, { useEffect, useState } from 'react';
import { Stack, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, CircularProgress } from '@mui/material';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { Pencil as EditIcon } from '@phosphor-icons/react/dist/ssr/Pencil';
import { Trash as TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';
import { useCustomers } from '@/contexts/customer-context';
import { useNotification } from '@/lib/notification';
import { CustomerDialog } from '@/components/dashboard/customers/customer-dialog';
import { GlobalSnackbar } from '@/components/core/global-snackbar';
import { DeleteConfirmationDialog } from '@/components/dashboard/layout/delete-confimation-dialog';

export default function CustomersPage() {
  const { customers, loading, fetchCustomers, deleteCustomer } = useCustomers();
  const { notification, showNotification, hideNotification } = useNotification();
  
  const [dialogState, setDialogState] = useState<{ open: boolean; data?: any }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: 0, name: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleDeleteClick = (id: number, name: string) => {
    setDeleteDialog({ open: true, id, name });
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCustomer(deleteDialog.id);
      showNotification(`Customer "${deleteDialog.name}" removed successfully.`, "info");
    } catch (error: any) {
      showNotification("Error: Could not delete customer. Check for active sale orders.", "error");
    } finally {
      setIsDeleting(false);
      setDeleteDialog({ ...deleteDialog, open: false });
    }
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" fontWeight="bold">Customer Management</Typography>
        <Button startIcon={<PlusIcon />} variant="contained" onClick={() => setDialogState({ open: true })}>
          Add Customer
        </Button>
      </Stack>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8f9fa' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Business Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Contact Info</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Address</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center"><CircularProgress sx={{ my: 2 }} /></TableCell></TableRow>
            ) : (
              customers.map((c) => (
                <TableRow key={c.customer_id} hover>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">#{c.customer_id}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">{c.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{c.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{c.phone || 'N/A'}</Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 250 }}>
                    <Typography variant="body2" noWrap title={c.address}>
                      {c.address || 'No address recorded'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton color="primary" onClick={() => setDialogState({ open: true, data: c })}>
                        <EditIcon size={20} />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDeleteClick(c.customer_id, c.name)}>
                        <TrashIcon size={20} />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <DeleteConfirmationDialog 
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ ...deleteDialog, open: false })}
        onConfirm={handleConfirmDelete}
        title="Confirm Customer Deletion"
        content={`Are you sure you want to delete ${deleteDialog.name}? This will permanently remove their records from your system.`}
        isLoading={isDeleting}
      />

      <CustomerDialog open={dialogState.open} onClose={() => setDialogState({ open: false })} editData={dialogState.data} />
      <GlobalSnackbar state={notification} onClose={hideNotification} />
    </Stack>
  );
}