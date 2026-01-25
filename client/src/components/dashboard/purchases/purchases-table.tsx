"use client";

import React, { useState } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Button, Chip, CircularProgress, Stack, IconButton, Typography, Box, Avatar, Tooltip
} from '@mui/material';
import { 
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions 
} from '@mui/material';
import { 
  Eye as EyeIcon, 
  Package, 
  CheckCircle, 
  Clock,
  ArrowRight
} from '@phosphor-icons/react';
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
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: '1000px' }}>
            <TableHead sx={{ bgcolor: '#fcfcfd' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Order Details</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Supplier Source</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Logistics Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Capital Value (AUD)</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Timestamp</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                    <CircularProgress size={35} thickness={4} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Accessing procurement ledger...</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                purchases.map((po) => {
                  const isReceived = po.status === 'Received' || po.status === 'Completed';
                  
                  return (
                    <TableRow key={po.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: 'neutral.100', width: 32, height: 32 }}>
                            <Package size={18} weight="duotone" color="#475467" />
                          </Avatar>
                          <Typography variant="body2" fontWeight="600">ORD-{po.id}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="500">{po.supplier_name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={po.status} 
                          sx={{ 
                            fontWeight: 700, 
                            bgcolor: isReceived ? 'success.50' : 'warning.50',
                            color: isReceived ? 'success.main' : 'warning.main',
                            border: '1px solid',
                            borderColor: isReceived ? 'success.200' : 'warning.200'
                          }}
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="600">
                           {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(po.total_amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(po.order_date).toLocaleDateString('en-AU')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Tooltip title="Inspect Details">
                                <IconButton 
                                    onClick={() => router.push(`/dashboard/purchases/${po.id}`)}
                                    sx={{ color: 'primary.main', bgcolor: 'primary.50', '&:hover': { bgcolor: 'primary.100' } }}
                                    size="small"
                                >
                                    <EyeIcon size={18} weight="bold" />
                                </IconButton>
                              </Tooltip>
                              {!isReceived && (
                              <Button 
                                variant="contained" 
                                size="small" 
                                endIcon={<ArrowRight size={14} weight="bold" />}
                                onClick={() => handleOpenDialog(po.id)}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 2 }}
                              >
                                  Receive
                              </Button>
                              )}
                          </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Box>
        
        <Dialog 
            open={open} 
            onClose={handleClose}
            PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
        >
            <DialogTitle sx={{ fontWeight: 800 }}>Confirm Inventory Inflow</DialogTitle>
            <DialogContent>
              <DialogContentText variant="body2">
                This will increment warehouse stock levels and create a permanent audit record in the Stock Ledger. Proceed with receipt for <strong>ORD-{selectedId}</strong>?
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ pb: 2, px: 3 }}>
              <Button onClick={handleClose} sx={{ color: 'text.secondary', fontWeight: 600 }}>Abort</Button>
              <Button onClick={handleConfirm} variant="contained" sx={{ borderRadius: 2, fontWeight: 700 }}>
                Commit to Inventory
              </Button>
            </DialogActions>
          </Dialog>
        </>
    );
}