"use client";

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, TextField, Paper, Stack, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, MenuItem,
  CircularProgress, Dialog, DialogTitle, DialogContent, 
  DialogContentText, DialogActions, Divider 
} from '@mui/material';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { Trash as TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';
import { CaretLeft as CaretLeftIcon } from '@phosphor-icons/react/dist/ssr/CaretLeft';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api-client';
import { useNotification } from '@/lib/notification';
import { GlobalSnackbar } from '@/components/core/global-snackbar';

interface SaleItem {
  product_id: number;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  stock_available: number;
}

export default function CreateSalePage() {
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();
  
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState<number | ''>(''); 
  const [items, setItems] = useState<SaleItem[]>([
    { product_id: 0, quantity: 1, unit_price: 0, discount_percent: 0, stock_available: 0 }
  ]);
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, custRes] = await Promise.all([
          apiRequest('/inventory'),
          apiRequest('/customers')
        ]);
        setProducts(prodRes.data || prodRes || []);
        setCustomers(custRes.data || custRes || []);
      } catch (error) {
        showNotification("Failed to load setup data", "error");
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, [showNotification]);

  const updateItem = (index: number, field: keyof SaleItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };

    if (field === 'product_id') {
      const selectedProd = products.find(p => p.product_id === Number(value));
      if (selectedProd) {
        item.unit_price = selectedProd.unit_price || 0; // Auto-fill price
        item.stock_available = selectedProd.quantity_on_hand || 0;
      }
    }
    newItems[index] = item;
    setItems(newItems);
  };

  // Financial Calculations
  const calculateSubtotal = () => items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const calculateTotalDiscount = () => items.reduce((sum, item) => {
    const lineTotal = item.quantity * item.unit_price;
    return sum + (lineTotal * (item.discount_percent / 100));
  }, 0);

  const subtotal = calculateSubtotal();
  const discountTotal = calculateTotalDiscount();
  const taxableAmount = subtotal - discountTotal;
  const taxAmount = taxableAmount * 0.10; // 10% GST
  const grandTotal = taxableAmount + taxAmount;

  const handleOpenDialog = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    const hasInsufficientStock = items.some(item => item.product_id !== 0 && item.quantity > item.stock_available);
    const hasInvalidEntries = !customerId || items.some(item => item.product_id === 0 || item.quantity <= 0);

    if (hasInsufficientStock) return showNotification("Requested quantity exceeds Sydney warehouse stock.", "error");
    if (hasInvalidEntries) return showNotification("Please select a customer and products.", "warning");

    setOpenConfirm(true);
  };

  const handleFinalSubmit = async () => {
    setOpenConfirm(false);
    setIsSubmitting(true);
    try {
      await apiRequest('/sales', {
        method: 'POST',
        body: JSON.stringify({ 
          user_id: 1, 
          customer_id: Number(customerId),
          tax: taxAmount,
          discount: discountTotal,
          total_amount: grandTotal,
          items 
        })
      });
      showNotification("Sale completed successfully!", "success");
      router.push('/dashboard/sales');
    } catch (error: any) {
      showNotification(error.message || "Failed to finalize sale", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <IconButton onClick={() => router.push('/dashboard/sales')}><CaretLeftIcon size={24} /></IconButton>
        <Typography variant="h4" fontWeight="bold">New Sale Order</Typography>
      </Stack>

      <Paper sx={{ p: 4, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Customer Information</Typography>
        <TextField
          select fullWidth label="Select Customer"
          value={customerId || ''} 
          onChange={(e) => setCustomerId(Number(e.target.value))}
          sx={{ mb: 4 }}
          error={touched && !customerId}
        >
          {customers.map((c) => (
            <MenuItem key={c.customer_id} value={Number(c.customer_id)}>{c.name}</MenuItem>
          ))}
        </TextField>

        <TableContainer sx={{ border: '1px solid #eee', borderRadius: 1 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
                <TableCell width={100} sx={{ fontWeight: 'bold' }}>Stock</TableCell>
                <TableCell width={100} sx={{ fontWeight: 'bold' }}>Qty</TableCell>
                <TableCell width={140} sx={{ fontWeight: 'bold' }}>Price ($)</TableCell>
                <TableCell width={110} sx={{ fontWeight: 'bold' }}>Disc %</TableCell>
                <TableCell width={140} sx={{ fontWeight: 'bold' }}>Total ($)</TableCell>
                <TableCell width={50}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => {
                const isOverStock = item.product_id !== 0 && item.quantity > item.stock_available;
                const rowTotal = (item.quantity * item.unit_price) * (1 - item.discount_percent / 100);
                return (
                  <TableRow key={index}>
                    <TableCell>
                      <TextField select fullWidth size="small" value={item.product_id || ''} onChange={(e) => updateItem(index, 'product_id', Number(e.target.value))}>
                        {products.map((p) => <MenuItem key={p.product_id} value={p.product_id}>{p.product_name}</MenuItem>)}
                      </TextField>
                    </TableCell>
                    <TableCell><Typography variant="body2" color={isOverStock ? 'error.main' : 'text.secondary'}>{item.product_id !== 0 ? item.stock_available : '-'}</Typography></TableCell>
                    <TableCell><TextField type="number" size="small" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))} error={isOverStock}/></TableCell>
                    <TableCell><TextField type="number" size="small" value={item.unit_price} slotProps={{ input: { readOnly: true } }}/></TableCell>
                    <TableCell><TextField type="number" size="small" value={item.discount_percent} onChange={(e) => updateItem(index, 'discount_percent', Number(e.target.value))}/></TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>${rowTotal.toFixed(2)}</TableCell>
                    <TableCell><IconButton color="error" onClick={() => setItems(items.filter((_, i) => i !== index))} disabled={items.length === 1}><TrashIcon size={20} /></IconButton></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <Button startIcon={<PlusIcon />} onClick={() => setItems([...items, { product_id: 0, quantity: 1, unit_price: 0, discount_percent: 0, stock_available: 0 }])} sx={{ mt: 2 }} variant="outlined">Add Item</Button>
      </Paper>

      {/* Financial Summary Section */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: '#fcfcfc', border: '1px solid #eee' }}>
        <Stack spacing={1} alignItems="flex-end">
          <Stack direction="row" spacing={10} justifyContent="space-between" sx={{ width: '300px' }}>
            <Typography color="text.secondary">Subtotal:</Typography>
            <Typography>${subtotal.toFixed(2)}</Typography>
          </Stack>
          <Stack direction="row" spacing={10} justifyContent="space-between" sx={{ width: '300px' }}>
            <Typography color="text.secondary">Discount:</Typography>
            <Typography color="error.main">-${discountTotal.toFixed(2)}</Typography>
          </Stack>
          <Stack direction="row" spacing={10} justifyContent="space-between" sx={{ width: '300px' }}>
            <Typography color="text.secondary">Tax (GST 10%):</Typography>
            <Typography>${taxAmount.toFixed(2)}</Typography>
          </Stack>
          <Divider sx={{ width: '300px', my: 1 }} />
          <Stack direction="row" spacing={10} justifyContent="space-between" sx={{ width: '300px' }}>
            <Typography variant="h6" fontWeight="bold">Grand Total:</Typography>
            <Typography variant="h6" fontWeight="bold" color="primary.main">${grandTotal.toFixed(2)}</Typography>
          </Stack>
        </Stack>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined" onClick={() => router.push('/dashboard/sales')}>Cancel</Button>
        <Button variant="contained" onClick={handleOpenDialog} size="large" disabled={isSubmitting}>
          {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Complete Sale"}
        </Button>
      </Box>

      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Verify Sale Order</DialogTitle>
        <DialogContent><DialogContentText>Finalizing order for <strong>{customers.find(c => c.customer_id === customerId)?.name}</strong>. Total: <strong>${grandTotal.toFixed(2)}</strong>.</DialogContentText></DialogContent>
        <DialogActions sx={{ p: 2 }}><Button onClick={() => setOpenConfirm(false)}>Edit Order</Button><Button onClick={handleFinalSubmit} variant="contained" color="primary">Confirm & Process</Button></DialogActions>
      </Dialog>
      <GlobalSnackbar state={notification} onClose={hideNotification} />
    </Box>
  );
}