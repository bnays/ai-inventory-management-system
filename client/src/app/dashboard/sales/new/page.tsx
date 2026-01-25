"use client";

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, TextField, Paper, Stack, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, MenuItem,
  CircularProgress, Dialog, DialogTitle, DialogContent, 
  DialogContentText, DialogActions, Divider, useTheme, Avatar
} from '@mui/material';
import { 
  Plus as PlusIcon, 
  Trash as TrashIcon, 
  CaretLeft as CaretLeftIcon,
  Tag,
  CurrencyCircleDollar,
  HandCoins
} from '@phosphor-icons/react';
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
  const theme = useTheme();
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
        showNotification("Failed to load outbound setup data", "error");
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
        item.unit_price = selectedProd.unit_price || 0;
        item.stock_available = selectedProd.quantity_on_hand || 0;
      }
    }
    newItems[index] = item;
    setItems(newItems);
  };

  const totals = React.useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const discount = items.reduce((sum, item) => (sum + (item.quantity * item.unit_price * (item.discount_percent / 100))), 0);
    const taxable = subtotal - discount;
    const tax = taxable * 0.10;
    return { subtotal, discount, tax, grandTotal: taxable + tax };
  }, [items]);

  const handleOpenDialog = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (items.some(item => item.product_id !== 0 && item.quantity > item.stock_available)) {
        return showNotification("Inventory Check Failed: Requested quantity exceeds warehouse stock.", "error");
    }
    if (!customerId || items.some(item => item.product_id === 0)) {
        return showNotification("Validation Error: Customer and Products are required.", "warning");
    }
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
          tax: totals.tax,
          discount: totals.discount,
          total_amount: totals.grandTotal,
          items 
        })
      });
      showNotification("Outbound sale finalized and stock adjusted.", "success");
      router.push('/dashboard/sales');
    } catch (error: any) {
      showNotification(error.message || "Fulfillment Error: Transaction failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10, bgcolor: '#f9fafb', minHeight: '100vh' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f9fafb', minHeight: '100vh' }}>
      
      {/* --- PAGE HEADER --- */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <IconButton onClick={() => router.push('/dashboard/sales')} sx={{ bgcolor: 'white', border: '1px solid #eaecf0', borderRadius: 2 }}>
            <CaretLeftIcon size={20} weight="bold" />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ letterSpacing: '-0.02em' }}>Create New Sales Order</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <HandCoins size={18} weight="duotone" color={theme.palette.primary.main} />
            <Typography variant="body2" color="text.secondary" fontWeight="500">Sales fulfillment and customer billing</Typography>
          </Stack>
        </Box>
      </Stack>

      <Paper sx={{ p: 4, borderRadius: 5, border: '1px solid #eaecf0', boxShadow: 'none' }}>
        <Typography variant="subtitle1" fontWeight="700" sx={{ mb: 3 }}>1. Select Customer</Typography>
        <TextField
          select fullWidth label="Logistics Partner / Customer"
          value={customerId || ''} 
          onChange={(e) => setCustomerId(Number(e.target.value))}
          error={touched && !customerId}
          sx={{ mb: 4, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
        >
          {customers.map((c) => (
            <MenuItem key={c.customer_id} value={Number(c.customer_id)}>{c.name}</MenuItem>
          ))}
        </TextField>

        <Divider sx={{ mb: 4 }} />

        <Typography variant="subtitle1" fontWeight="700" sx={{ mb: 2 }}>2. Line Items (Outbound)</Typography>
        <TableContainer sx={{ border: '1px solid #eaecf0', borderRadius: 4, mb: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#fcfcfd' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Product Specification</TableCell>
                <TableCell width={120} sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Available</TableCell>
                <TableCell width={120} sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Qty</TableCell>
                <TableCell width={140} sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Unit (AUD)</TableCell>
                <TableCell width={110} sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Disc %</TableCell>
                <TableCell width={140} align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Subtotal</TableCell>
                <TableCell width={60}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => {
                const isOverStock = item.product_id !== 0 && item.quantity > item.stock_available;
                return (
                  <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      <TextField select fullWidth size="small" value={item.product_id || ''} onChange={(e) => updateItem(index, 'product_id', Number(e.target.value))}>
                        {products.map((p) => (
                            <MenuItem key={p.product_id} value={p.product_id}>
                                <Stack direction="row" justifyContent="space-between" sx={{ width: '100%' }}>
                                    <Typography variant="body2" fontWeight="600">{p.product_name}</Typography>
                                    <Typography variant="caption" sx={{ bgcolor: 'neutral.50', px: 1, borderRadius: 1 }}>{p.sku}</Typography>
                                </Stack>
                            </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                        <Typography variant="body2" fontWeight="700" color={isOverStock ? 'error.main' : 'success.main'}>
                            {item.product_id !== 0 ? item.stock_available : '—'}
                        </Typography>
                    </TableCell>
                    <TableCell><TextField type="number" size="small" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))} error={isOverStock}/></TableCell>
                    <TableCell><TextField type="number" size="small" value={item.unit_price} slotProps={{ input: { readOnly: true } }} InputProps={{ startAdornment: <CurrencyCircleDollar size={16} /> }}/></TableCell>
                    <TableCell><TextField type="number" size="small" value={item.discount_percent} onChange={(e) => updateItem(index, 'discount_percent', Number(e.target.value))}/></TableCell>
                    <TableCell align="right"><Typography variant="body2" fontWeight="700">${((item.quantity * item.unit_price) * (1 - item.discount_percent / 100)).toFixed(2)}</Typography></TableCell>
                    <TableCell align="right"><IconButton color="error" onClick={() => setItems(items.filter((_, i) => i !== index))} disabled={items.length === 1}><TrashIcon size={18} weight="bold" /></IconButton></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <Button startIcon={<PlusIcon size={18} weight="bold" />} onClick={() => setItems([...items, { product_id: 0, quantity: 1, unit_price: 0, discount_percent: 0, stock_available: 0 }])} sx={{ mt: 2, fontWeight: 600, textTransform: 'none' }} variant="text">Add Order Item</Button>

        {/* Financial Summary */}
        <Box sx={{ mt: 4, p: 3, bgcolor: '#fcfcfd', borderRadius: 4, border: '1px solid #eaecf0', ml: 'auto', width: { xs: '100%', md: 350 } }}>
           <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Gross Subtotal:</Typography>
                <Typography variant="body2" fontWeight="600">${totals.subtotal.toFixed(2)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Order Discount:</Typography>
                <Typography variant="body2" fontWeight="600" color="error.main">-${totals.discount.toFixed(2)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">GST (10%):</Typography>
                <Typography variant="body2" fontWeight="600">${totals.tax.toFixed(2)}</Typography>
              </Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight="800">Final Total (AUD):</Typography>
                <Typography variant="h5" fontWeight="900" color="primary.main">${totals.grandTotal.toFixed(2)}</Typography>
              </Stack>
           </Stack>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3, pb: 4 }}>
        <Button variant="outlined" onClick={() => router.push('/dashboard/sales')} sx={{ borderRadius: 2.5, px: 4, bgcolor: 'white' }}>Discard Order</Button>
        <Button variant="contained" onClick={handleOpenDialog} size="large" sx={{ borderRadius: 2.5, px: 4, fontWeight: 700 }}>Create Sale Order</Button>
      </Box>

      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)} PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Verify Sale Completion</DialogTitle>
        <DialogContent><DialogContentText variant="body2">Commit outbound order for <strong>{customers.find(c => c.customer_id === customerId)?.name}</strong> for a total of <strong>${totals.grandTotal.toFixed(2)}</strong>? Stock levels will be deducted immediately.</DialogContentText></DialogContent>
        <DialogActions sx={{ pb: 2, px: 3 }}><Button onClick={() => setOpenConfirm(false)}>Review Order</Button><Button onClick={handleFinalSubmit} variant="contained" color="primary" sx={{ borderRadius: 2, fontWeight: 700 }}>Commit & Invoice</Button></DialogActions>
      </Dialog>
      <GlobalSnackbar state={notification} onClose={hideNotification} />
    </Box>
  );
}