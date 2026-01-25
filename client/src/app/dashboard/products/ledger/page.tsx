'use client';

import * as React from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Stack, 
  CircularProgress, TextField, MenuItem, Button, useTheme, Avatar,
  TablePagination, Divider
} from '@mui/material';
import { 
  ClockCounterClockwise, 
  Funnel, 
  ArrowClockwise, 
  FileText,
  TrendUp,
  TrendDown
} from '@phosphor-icons/react';
import { apiRequest } from '@/lib/api-client';
import { Export as ExportIcon } from '@phosphor-icons/react';

export default function StockLedgerPage() {
  const theme = useTheme();
  
  // Data States
  const [ledger, setLedger] = React.useState<any[]>([]);
  const [products, setProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // Pagination States
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [totalCount, setTotalCount] = React.useState(0);
  
  // Filter States
  const [selectedProduct, setSelectedProduct] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');

  const fetchLedger = React.useCallback(async () => {
    setLoading(true);
    try {
      // Logic: Backend handles slicing based on page and limit
      const query = `?product_id=${selectedProduct}&startDate=${startDate}&endDate=${endDate}&page=${page + 1}&limit=${rowsPerPage}`;
      const response = await apiRequest(`/inventory/ledger${query}`);
      
      // Assumes backend returns { data: [], total: number }
      setLedger(response.data || []);
      setTotalCount(response.total || 0);
    } catch (error) {
      console.error("Fetch failed", error);
    } finally {
      setLoading(false);
    }
  }, [selectedProduct, startDate, endDate, page, rowsPerPage]);

  // Initial Load
  React.useEffect(() => {
    const init = async () => {
      try {
        const prodRes = await apiRequest('/inventory');
        setProducts(prodRes.data || prodRes || []);
        fetchLedger();
      } catch (error) {
        setProducts([]); 
      }
    };
    init();
  }, [fetchLedger]);

  // Handle Pagination Changes
  const handleChangePage = (event: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExportCSV = async () => {
    try {
        // 1. Fetch ALL filtered data (ignoring current page limits for the export)
        const query = `?product_id=${selectedProduct}&startDate=${startDate}&endDate=${endDate}&page=1&limit=10000`;
        const response = await apiRequest(`/inventory/ledger${query}`);
        const dataToExport = response.data || [];

        if (dataToExport.length === 0) {
        alert("No data available to export for the selected filters.");
        return;
        }

        // 2. Define CSV Headers
        const headers = ["Date,Time,Product,SKU,Type,Quantity Change,Staff Member,Reason"];

        // 3. Map data to CSV rows
        const csvRows = dataToExport.map((row: any) => {
        const date = new Date(row.created_at).toLocaleDateString('en-AU');
        const time = new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        return [
            `"${date}"`,
            `"${time}"`,
            `"${row.product_name}"`,
            `"${row.sku}"`,
            `"${row.transaction_type}"`,
            row.quantity_changed,
            `"${row.staff_member}"`,
            `"${row.reason || 'N/A'}"`
        ].join(",");
        });

        // 4. Create and trigger download
        const csvString = [headers, ...csvRows].join("\n");
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        
        link.setAttribute("href", url);
        link.setAttribute("download", `LogixWarehouse_Ledger_Export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
    } catch (error) {
        console.error("Export failed", error);
    }
    };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh' }}>
      
      {/* --- PAGE HEADER --- */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ color: 'neutral.900', letterSpacing: '-0.02em' }}>
            Stock Ledger
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <ClockCounterClockwise size={18} weight="duotone" color={theme.palette.primary.main} />
            <Typography variant="body2" color="text.secondary" fontWeight="500">
              Transaction history and balance auditing
            </Typography>
          </Stack>
        </Box>

        <Button 
            startIcon={<ExportIcon size={18} weight="bold" />} 
            variant="outlined" 
            onClick={handleExportCSV}
            sx={{ 
            borderRadius: 2.5, 
            textTransform: 'none', 
            fontWeight: 600, 
            bgcolor: 'white',
            borderColor: '#eaecf0',
            color: 'text.primary'
            }}
        >
            Export CSV
        </Button>
        </Stack>

      {/* --- FILTER BAR --- */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 4, border: '1px solid #eaecf0', boxShadow: 'none', display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <TextField
          select label="Product" size="small" sx={{ width: 220 }}
          value={selectedProduct} onChange={(e) => { setSelectedProduct(e.target.value); setPage(0); }}
        >
          <MenuItem value="">All Products</MenuItem>
          {products.map((p) => <MenuItem key={p.product_id} value={p.product_id}>{p.product_name}</MenuItem>)}
        </TextField>

        <TextField type="date" label="From" size="small" InputLabelProps={{ shrink: true }} value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(0); }} />
        <TextField type="date" label="To" size="small" InputLabelProps={{ shrink: true }} value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(0); }} />
        
        <Button variant="contained" onClick={() => { setPage(0); fetchLedger(); }} sx={{ borderRadius: 2, px: 3 }}>
          Filter
        </Button>
      </Paper>

      {/* --- TABLE SECTION --- */}
      <Paper sx={{ borderRadius: 5, border: '1px solid #eaecf0', overflow: 'hidden', boxShadow: 'none' }}>
        <TableContainer>
          {loading ? (
            <Box sx={{ py: 10, textAlign: 'center' }}>
              <CircularProgress size={35} />
            </Box>
          ) : (
            <Table>
              <TableHead sx={{ bgcolor: '#fcfcfd' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Date & Time</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Product</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Change</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ledger.map((row) => {
                  const isInflow = row.transaction_type === 'Inflow' || row.quantity_changed > 0;
                  return (
                    <TableRow key={row.transaction_id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="500">{new Date(row.created_at).toLocaleDateString('en-AU')}</Typography>
                        <Typography variant="caption" color="text.secondary">{new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Typography variant="body2" fontWeight="600">{row.product_name}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={row.transaction_type} 
                          size="small" 
                          sx={{ 
                            fontWeight: 700, 
                            bgcolor: isInflow ? 'success.50' : 'error.50',
                            color: isInflow ? 'success.main' : 'error.main'
                          }} 
                          onClick={() => {}}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          {isInflow ? <TrendUp size={16} color={theme.palette.success.main} /> : <TrendDown size={16} color={theme.palette.error.main} />}
                          <Typography sx={{ fontWeight: '800', color: isInflow ? 'success.main' : 'error.main' }}>
                            {isInflow ? `+${row.quantity_changed}` : row.quantity_changed}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{row.reason}</Typography></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TableContainer>
        <Divider />
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
          sx={{ bgcolor: '#fcfcfd' }}
        />
      </Paper>
    </Box>
  );
}