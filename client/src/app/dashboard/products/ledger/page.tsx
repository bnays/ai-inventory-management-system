'use client';

import * as React from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Stack, 
  CircularProgress, TextField, MenuItem, Button 
} from '@mui/material';
import { apiRequest } from '@/lib/api-client';

export default function StockLedgerPage() {
  const [ledger, setLedger] = React.useState<any[]>([]);
  const [products, setProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // Filter States
  const [selectedProduct, setSelectedProduct] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');

  const fetchLedger = React.useCallback(async () => {
    setLoading(true);
    try {
      const query = `?product_id=${selectedProduct}&startDate=${startDate}&endDate=${endDate}`;
      const data = await apiRequest(`/inventory/ledger${query}`);
      setLedger(data || []);
    } catch (error) {
      console.error("Fetch failed", error);
    } finally {
      setLoading(false);
    }
  }, [selectedProduct, startDate, endDate]);

  React.useEffect(() => {
  const init = async () => {
    try {
      const prodRes = await apiRequest('/inventory');
      
      // Fix: API responses often wrap the array in a 'data' property
      // Use short-circuiting to ensure it's always an array
      const productArray = prodRes.data || prodRes || []; 
      setProducts(productArray);
      
      fetchLedger();
    } catch (error) {
      console.error("Initialization failed:", error);
      setProducts([]); // Fallback to empty array to prevent .map crash
    }
  };
  init();
}, [fetchLedger]);

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>Stock Ledger</Typography>
      
      {/* Filter Bar */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          select label="Product" size="small" sx={{ width: 250 }}
          value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}
        >
          <MenuItem value="">All Products</MenuItem>
          {products.map((p) => <MenuItem key={p.product_id} value={p.product_id}>{p.product_name}</MenuItem>)}
        </TextField>
        <TextField type="date" label="Start Date" size="small" InputLabelProps={{ shrink: true }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <TextField type="date" label="End Date" size="small" InputLabelProps={{ shrink: true }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <Button variant="contained" onClick={fetchLedger}>Filter</Button>
        <Button variant="outlined" onClick={() => { setSelectedProduct(''); setStartDate(''); setEndDate(''); }}>Reset</Button>
      </Paper>

      {/* Table Section */}
      <TableContainer component={Paper}>
        {loading ? <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box> : (
          <Table>
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Change</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Reason</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ledger.map((row) => (
                <TableRow key={row.transaction_id}>
                  <TableCell>{new Date(row.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{row.product_name}</TableCell>
                  <TableCell><Chip label={row.transaction_type} size="small" color={row.transaction_type === 'Inflow' ? 'success' : 'error'} /></TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: row.quantity_changed > 0 ? 'success.main' : 'error.main' }}>
                    {row.quantity_changed > 0 ? `+${row.quantity_changed}` : row.quantity_changed}
                  </TableCell>
                  <TableCell>{row.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Box>
  );
}