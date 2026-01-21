"use client";

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, TextField, MenuItem, Paper, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Stack 
} from '@mui/material';
// Using Phosphor Icons as requested
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { Trash as TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';
import { CaretLeft as CaretLeftIcon } from '@phosphor-icons/react/dist/ssr/CaretLeft';

import { useRouter } from 'next/navigation';
import { usePurchases } from '@/contexts/purchase-context';
import { useNotification } from '@/lib/notification';
import { apiRequest } from '@/lib/api-client';

interface OrderItem {
  product_id: number;
  quantity: number;
  cost_price: number;
}

export default function CreatePurchaseOrder() {
  const router = useRouter();
  const { createPurchase } = usePurchases();
  const { showNotification } = useNotification();
  
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [supplierId, setSupplierId] = useState<string>('');
  const [items, setItems] = useState<OrderItem[]>([{ product_id: 0, quantity: 1, cost_price: 0 }]);

  useEffect(() => {
    const loadData = async () => {
    try {
        const [suppRes, prodRes] = await Promise.all([
        apiRequest('/suppliers'),
        apiRequest('/inventory')
        ]);
        
        // Check if response is { data: [...] } or just [...]
        const suppliersList = suppRes.data || (Array.isArray(suppRes) ? suppRes : []);
        const productsList = prodRes.data || (Array.isArray(prodRes) ? prodRes : []);
        
        setSuppliers(suppliersList);
        setProducts(productsList);
        
        if (suppliersList.length === 0) showNotification("No suppliers found. Please add one first.", "warning");
        if (productsList.length === 0) showNotification("No products found. Please add one first.", "warning");
    } catch (error) {
        showNotification("Failed to load setup data from server", "error");
    }
    };
    loadData();
  }, [showNotification]);

  const handleAddItem = () => {
    setItems([...items, { product_id: 0, quantity: 1, cost_price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof OrderItem, value: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || items.some(item => item.product_id === 0)) {
      showNotification("Please select a supplier and products", "error");
      return;
    }

    try {
      await createPurchase({ supplier_id: Number(supplierId), items });
      showNotification("Purchase Order created successfully!", "success");
      router.push('/dashboard/purchases');
    } catch (error: any) {
      showNotification(error.message || "Failed to create order", "error");
    }
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <IconButton onClick={() => router.push('/dashboard/purchases')}>
          <CaretLeftIcon size={24} />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">New Purchase Order</Typography>
      </Stack>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <TextField
          select
          fullWidth
          label="Select Supplier"
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          sx={{ mb: 4 }}
        >
          {suppliers.map((s) => (
            <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
          ))}
        </TextField>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell width={150}>Quantity</TableCell>
                <TableCell width={150}>Unit Cost ($)</TableCell>
                <TableCell width={120}>Total</TableCell>
                <TableCell width={80} align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={item.product_id}
                      onChange={(e) => updateItem(index, 'product_id', Number(e.target.value))}
                    >
                      {products.map((p) => (
                        <MenuItem key={p.product_id} value={p.product_id}>{p.product_name}</MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      value={item.cost_price}
                      onChange={(e) => updateItem(index, 'cost_price', Number(e.target.value))}
                    />
                  </TableCell>
                  <TableCell variant="body">
                    <Typography variant="body2">
                      ${(item.quantity * item.cost_price).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      onClick={() => handleRemoveItem(index)} 
                      color="error"
                      disabled={items.length === 1}
                    >
                      <TrashIcon size={20} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Button 
          startIcon={<PlusIcon size={20} />} 
          onClick={handleAddItem} 
          sx={{ mt: 2 }}
          variant="text"
        >
          Add Another Product
        </Button>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button 
          variant="outlined" 
          onClick={() => router.push('/dashboard/purchases')}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          size="large"
        >
          Create Purchase Order
        </Button>
      </Box>
    </Stack>
  );
}