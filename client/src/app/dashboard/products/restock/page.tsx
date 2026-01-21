"use client";

import * as React from 'react';
import { useEffect, useState } from 'react';
import { 
  Box, Card, Table, TableBody, TableCell, TableHead, TableRow, 
  Typography, Button, Chip, CircularProgress, Dialog, 
  DialogTitle, DialogContent, DialogActions, Divider
} from '@mui/material';
import { apiRequest } from '@/lib/api-client';
import { useNotification } from '@/lib/notification';
import { GlobalSnackbar } from '@/components/core/global-snackbar';

export default function RestockPage() {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const { notification, showNotification, hideNotification } = useNotification();

  const fetchSuggestions = async () => {
    try {
      const res = await apiRequest('/inventory/low-stock');
      setSuggestions(res.data);
    } catch (error) {
      showNotification("Failed to load restock suggestions", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuggestions(); }, []);

  const handleConfirmPurchase = async () => {
    if (!selectedItem) return;
    
    try {
      const payload = {
        supplier_id: selectedItem.supplier_id,
        items: [{
          product_id: selectedItem.product_id,
          quantity: selectedItem.suggested_restock_qty,
          cost_price: selectedItem.supply_price
        }]
      };

      await apiRequest('/purchases/quick-purchase', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      showNotification(`Purchase Order generated for ${selectedItem.product_name}`, "success");
      setSelectedItem(null);
      fetchSuggestions();
    } catch (error) {
      showNotification("Failed to generate order", "error");
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;

  return (
    <Box >
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Restock Suggestions
      </Typography>

      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>On Hand</TableCell>
              <TableCell>Reorder Level</TableCell>
              <TableCell>Suggested Qty</TableCell>
              <TableCell>Preferred Supplier</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {suggestions.map((item) => (
              <TableRow key={item.product_id}>
                <TableCell>
                  <Typography variant="subtitle2">{item.product_name}</Typography>
                  <Typography variant="caption" color="textSecondary">{item.sku}</Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={item.quantity_on_hand} 
                    color={item.quantity_on_hand === 0 ? "error" : "warning"} 
                    size="small" 
                  />
                </TableCell>
                <TableCell>{item.reorder_level}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {item.suggested_restock_qty}
                </TableCell>
                <TableCell>{item.preferred_supplier}</TableCell>
                <TableCell align="right">
                    {item.pending_order_count > 0 ? (
                        <Chip 
                        label={`${item.pending_order_count} Order(s) Pending`} 
                        color="info" 
                        variant="outlined" 
                        size="small" 
                        onClick={() => showNotification("There are pending orders for this item.", "info")}
                        />
                    ) : (
                        <Button 
                        variant="contained" 
                        size="small"
                        onClick={() => setSelectedItem(item)}
                        disabled={!item.preferred_supplier}
                        >
                        Quick Order
                        </Button>
                    )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={Boolean(selectedItem)} onClose={() => setSelectedItem(null)}>
        <DialogTitle>Confirm Purchase Order</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to generate a purchase order for the following?
          </Typography>
          <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
            <Typography variant="subtitle2">Product: {selectedItem?.product_name}</Typography>
            <Typography variant="body2">Supplier: {selectedItem?.preferred_supplier}</Typography>
            <Typography variant="body2">Quantity: {selectedItem?.suggested_restock_qty}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Est. Cost: ${(selectedItem?.suggested_restock_qty * selectedItem?.supply_price).toFixed(2)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelectedItem(null)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleConfirmPurchase}>
            Confirm Order
          </Button>
        </DialogActions>
      </Dialog>
      <GlobalSnackbar state={notification} onClose={hideNotification} />
    </Box>
  );
}