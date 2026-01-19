"use client";

import React, { useState } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Button, Chip, CircularProgress, 
  Stack,
  IconButton
} from '@mui/material';
import { 
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions 
} from '@mui/material';
import { Eye as EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
import { useRouter } from 'next/navigation';

interface PurchaseOrder {
  id: number;
  supplier_name: string;
  status: string;
  total_amount: number;
  order_date: string;
}

interface PurchasesTableProps {
  purchases: PurchaseOrder[];
  loading: boolean;
  onReceive: (id: number) => Promise<void>;
}

export function PurchasesTable({ purchases, loading, onReceive }: PurchasesTableProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const handleOpenDialog = (id: number) => {
        setSelectedId(id);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedId(null);
    };

    const handleConfirm = () => {
        if (selectedId) {
        onReceive(selectedId);
        }
        handleClose();
    };
  return (
    <>
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Order ID</TableCell>
            <TableCell>Supplier</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Total Amount</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : (
            purchases.map((po) => (
              <TableRow key={po.id}>
                <TableCell>#{po.id}</TableCell>
                <TableCell>{po.supplier_name}</TableCell>
                <TableCell>
                  <Chip 
                    label={po.status} 
                    color={po.status === 'Received' ? 'success' : 'warning'} 
                    size="small" 
                    onClick={(e) => {e.preventDefault}}
                  />
                </TableCell>
                <TableCell>${po.total_amount}</TableCell>
                <TableCell>{new Date(po.order_date).toLocaleDateString()}</TableCell>
                <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <IconButton size="small" onClick={() => router.push(`/dashboard/purchases/${po.id}`)}>
                        <EyeIcon size={20} />
                        </IconButton>
                        {po.status === 'Pending' && (
                        <Button variant="contained" size="small" onClick={() => handleOpenDialog(po.id)}>
                            Receive Stock
                        </Button>
                        )}
                    </Stack>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
    <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Confirm Stock Receipt</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to receive this order? This will update your 
            inventory levels and mark the order as complete.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleConfirm} variant="contained" color="primary" autoFocus>
            Confirm Receive
          </Button>
        </DialogActions>
      </Dialog>
    </>
    
  );
}