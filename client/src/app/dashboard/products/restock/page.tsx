"use client";

import * as React from 'react';
import { useEffect, useState } from 'react';
import { 
  Box, Card, Table, TableBody, TableCell, TableHead, TableRow, 
  Typography, Button, Chip, CircularProgress, Dialog, 
  DialogTitle, DialogContent, DialogActions, Paper, Stack, Avatar, useTheme,
  Divider
} from '@mui/material';
import { 
  ShoppingBag, 
  WarningCircle, 
  Truck, 
  CheckCircle, 
  ArrowClockwise 
} from '@phosphor-icons/react';
import { apiRequest } from '@/lib/api-client';
import { useNotification } from '@/lib/notification';
import { GlobalSnackbar } from '@/components/core/global-snackbar';

export default function RestockPage() {
  const theme = useTheme();
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

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh' }}>
      {/* Header & Stats Summary */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="800" color="primary.dark">Restock Suggestions</Typography>
          <Typography variant="body2" color="text.secondary">
            AI-calculated replenishment needs
          </Typography>
        </Box>
        <Button 
          startIcon={<ArrowClockwise weight="bold" />} 
          variant="outlined" 
          onClick={fetchSuggestions}
          sx={{ borderRadius: 2 }}
        >
          Refresh Data
        </Button>
      </Stack>

      {/* Main Table Card */}
      <Card sx={{ borderRadius: 4, boxShadow: '0 10px 30px -12px rgba(0,0,0,0.1)', border: 'none' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Product & SKU</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Stock Level</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Reorder Threshold</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>AI-Suggested Qty</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Preferred Supplier</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {suggestions.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                        <CheckCircle size={48} weight="duotone" color={theme.palette.success.main} />
                        <Typography sx={{ mt: 2 }} color="text.secondary">All inventory levels are healthy.</Typography>
                    </TableCell>
                </TableRow>
            ) : (
              suggestions.map((item) => (
                <TableRow key={item.product_id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="600">{item.product_name}</Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ fontFamily: 'monospace' }}>{item.sku}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`${item.quantity_on_hand} units`} 
                      color={item.quantity_on_hand === 0 ? "error" : "warning"} 
                      size="small" 
                      sx={{ fontWeight: 'bold' }}
                    />
                  </TableCell>
                  <TableCell>{item.reorder_level}</TableCell>
                  <TableCell>
                    <Typography fontWeight="bold" color="primary.main">
                      +{item.suggested_restock_qty}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Truck size={16} weight="duotone" />
                        <Typography variant="body2">{item.preferred_supplier || "No Supplier Linked"}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                      {item.pending_order_count > 0 ? (
                          <Chip 
                            label={`${item.pending_order_count} Pending`} 
                            color="info" 
                            variant="outlined" 
                            size="small" 
                            sx={{ borderRadius: 1.5 }}
                          />
                      ) : (
                          <Button 
                            variant="contained" 
                            size="small"
                            startIcon={<ShoppingBag weight="bold" />}
                            onClick={() => setSelectedItem(item)}
                            disabled={!item.preferred_supplier}
                            sx={{ textTransform: 'none', borderRadius: 1.5 }}
                          >
                            Quick Order
                          </Button>
                      )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog 
        open={Boolean(selectedItem)} 
        onClose={() => setSelectedItem(null)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>Generate Purchase Order?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3 }} color="text.secondary">
            This will create a new Purchase Order in the system and update the stock ledger upon fulfillment.
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f8f9fa' }}>
            <Stack spacing={1}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary">PRODUCT</Typography>
                <Typography variant="subtitle1" fontWeight="bold">{selectedItem?.product_name}</Typography>
                <Divider sx={{ my: 1 }} />
                <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Supplier:</Typography>
                    <Typography variant="body2" fontWeight="bold">{selectedItem?.preferred_supplier}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Order Quantity:</Typography>
                    <Typography variant="body2" fontWeight="bold">{selectedItem?.suggested_restock_qty} Units</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Estimated Cost:</Typography>
                    <Typography variant="body2" color="primary.main" fontWeight="800">
                        ${(selectedItem?.suggested_restock_qty * selectedItem?.supply_price || 0).toFixed(2)}
                    </Typography>
                </Stack>
            </Stack>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSelectedItem(null)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleConfirmPurchase}
            sx={{ px: 3, borderRadius: 2 }}
          >
            Confirm Order
          </Button>
        </DialogActions>
      </Dialog>
      <GlobalSnackbar state={notification} onClose={hideNotification} />
    </Box>
  );
}