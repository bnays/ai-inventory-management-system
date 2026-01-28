"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Button, TextField, MenuItem, Paper, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Stack,
  useTheme, Divider
} from '@mui/material';
import { 
  Plus as PlusIcon,
  Trash as TrashIcon,
  CaretLeft as CaretLeftIcon,
  CurrencyDollar
} from '@phosphor-icons/react';

import { useRouter } from 'next/navigation';
import { usePurchases } from '@/contexts/purchase-context';
import { useNotification } from '@/lib/notification';
import { apiRequest } from '@/lib/api-client';
import { GlobalSnackbar } from '@/components/core/global-snackbar';

interface OrderItem {
  product_id: number;
  quantity: number;
  cost_price: number;
}

export default function CreatePurchaseOrder() {
  const theme = useTheme();
  const router = useRouter();
  const { createPurchase } = usePurchases();
  const { notification, showNotification, hideNotification } = useNotification();
  
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [supplierId, setSupplierId] = useState<string>('');
  const [items, setItems] = useState<OrderItem[]>([{ product_id: 0, quantity: 1, cost_price: 0 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [suppRes, prodRes] = await Promise.all([
          apiRequest('/suppliers'),
          apiRequest('/inventory?limit=1000')
        ]);
        
        // FIX: Handle both direct arrays and wrapped { data: [...] } objects
        const supplierList = suppRes.data || (Array.isArray(suppRes) ? suppRes : []);
        const productList = prodRes.data || (Array.isArray(prodRes) ? prodRes : []);
        
        setSuppliers(supplierList);
        setProducts(productList);
        
        console.log("Purchase Setup Data:", { suppliers: supplierList.length, products: productList.length });
      } catch (error) {
        showNotification("Critical: System failed to load catalog data.", "error");
      }
    };
    loadData();
  }, [showNotification]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.cost_price), 0);
    const gst = subtotal * 0.10; 
    return { subtotal, gst, grandTotal: subtotal + gst };
  }, [items]);

  const updateItem = (index: number, field: keyof OrderItem, value: number) => {
    const newItems = [...items];
    if (field === 'product_id') {
      const selectedProd = products.find(p => p.product_id === value);
      
      // LOGIC FIX: Pulling COST (Retail / 1.4) to ensure purchase is below sale price
      const costPrice = selectedProd ? (Number(selectedProd.unit_price) / 1.4) : 0;
      
      newItems[index] = { 
        ...newItems[index], 
        product_id: value,
        cost_price: Number(costPrice.toFixed(2)) 
      };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setItems(newItems);
  };

  const handleAddItem = () => setItems([...items, { product_id: 0, quantity: 1, cost_price: 0 }]);
  
  const handleRemoveItem = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!supplierId) {
      showNotification("Validation Error: Please select a Supplier.", "error");
      return false;
    }
    if (items.some(item => item.product_id === 0)) {
      showNotification("Validation Error: One or more items have no product selected.", "error");
      return false;
    }
    if (items.some(item => item.quantity <= 0)) {
      showNotification("Validation Error: Quantity must be at least 1.", "error");
      return false;
    }
    if (totals.grandTotal <= 0) {
      showNotification("Validation Error: Order total must be greater than $0.", "error");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await createPurchase({ 
        supplier_id: Number(supplierId), 
        items,
        tax: totals.gst,
        total_amount: totals.grandTotal 
      });
      showNotification("Success: Purchase order created at cost basis.", "success");
      setTimeout(() => router.push('/dashboard/purchases'), 1500);
    } catch (error: any) {
      showNotification(error.message || "Database Error: Could not save order.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh' }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <IconButton onClick={() => router.push('/dashboard/purchases')} sx={{ bgcolor: 'white', border: '1px solid #eaecf0', borderRadius: 2 }}>
          <CaretLeftIcon size={20} weight="bold" />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ letterSpacing: '-0.02em' }}>Create New Purchase Order</Typography>
          <Typography variant="body2" color="text.secondary">Procure inventory at cost from partners</Typography>
        </Box>
      </Stack>

      <Paper sx={{ p: 4, borderRadius: 5, border: '1px solid #eaecf0', boxShadow: 'none' }}>
        <Typography variant="subtitle1" fontWeight="700" sx={{ mb: 3 }}>1. Vendor Assignment</Typography>
        <TextField
          select fullWidth label="Select Supplier" value={supplierId}
          error={!supplierId && isSubmitting}
          onChange={(e) => setSupplierId(e.target.value)}
          sx={{ mb: 4, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
        >
          {suppliers.map((s) => (
            <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
          ))}
        </TextField>

        <Divider sx={{ mb: 4 }} />

        <Typography variant="subtitle1" fontWeight="700" sx={{ mb: 2 }}>2. Line Items (Cost Basis)</Typography>
        <TableContainer sx={{ border: '1px solid #eaecf0', borderRadius: 4, mb: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#fcfcfd' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Product</TableCell>
                <TableCell width={140} sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Qty</TableCell>
                <TableCell width={160} sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Unit (Cost)</TableCell>
                <TableCell width={140} sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Subtotal</TableCell>
                <TableCell width={60}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <TextField
                      select fullWidth size="small" value={item.product_id}
                      onChange={(e) => updateItem(index, 'product_id', Number(e.target.value))}
                      SelectProps={{
                        MenuProps: {
                        PaperProps: {
                            style: {
                                maxHeight: 300, // Limits height to 300px
                            },
                        }},
                    }}
                    >
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
                    <TextField
                      type="number" size="small" value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number" size="small" value={item.cost_price}
                      onChange={(e) => updateItem(index, 'cost_price', Number(e.target.value))}
                      InputProps={{ startAdornment: <CurrencyDollar size={14} /> }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="700">${(item.quantity * item.cost_price).toFixed(2)}</Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleRemoveItem(index)} disabled={items.length === 1} color="error">
                      <TrashIcon size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Button startIcon={<PlusIcon />} onClick={handleAddItem} sx={{ fontWeight: 600 }}>Add Item</Button>

        <Box sx={{ mt: 4, p: 3, bgcolor: '#fcfcfd', borderRadius: 4, border: '1px solid #eaecf0', ml: 'auto', width: { xs: '100%', md: 350 } }}>
           <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Subtotal (Cost):</Typography>
                <Typography variant="body2" fontWeight="600">${totals.subtotal.toFixed(2)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">GST (10%):</Typography>
                <Typography variant="body2" fontWeight="600">${totals.gst.toFixed(2)}</Typography>
              </Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight="800">Total Capital Outlay:</Typography>
                <Typography variant="h5" fontWeight="900" color="primary.main">${totals.grandTotal.toFixed(2)}</Typography>
              </Stack>
           </Stack>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3, pb: 4 }}>
        <Button variant="outlined" onClick={() => router.push('/dashboard/purchases')} sx={{ borderRadius: 2.5 }}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting} size="large" sx={{ borderRadius: 2.5, px: 4, fontWeight: 700 }}>
          {isSubmitting ? 'Processing...' : 'Create Purchase Order'}
        </Button>
      </Box>

      <GlobalSnackbar state={notification} onClose={hideNotification} />
    </Box>
  );
}