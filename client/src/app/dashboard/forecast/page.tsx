'use client';

import * as React from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Button, 
  CircularProgress, LinearProgress, TablePagination,
  Stack, useTheme, IconButton, Tooltip, Divider
} from '@mui/material';
import { 
  ChartLineUp, 
  ArrowClockwise, 
  Package, 
  Brain,
  CaretRight
} from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api-client';

export default function ForecastOverviewPage() {
  const theme = useTheme();
  const router = useRouter();
  
  // Data & Loading States
  const [products, setProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // Pagination States
  const [page, setPage] = React.useState(0); 
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [totalItems, setTotalItems] = React.useState(0);

  const fetchInventory = React.useCallback(async () => {
    setLoading(true);
    try {
      // MUI 0-index to Backend 1-index conversion
      const response = await apiRequest(`/inventory?page=${page + 1}&limit=${rowsPerPage}`);
      setProducts(response.data || []);
      setTotalItems(response.meta?.totalItems || 0);
    } catch (error) {
      console.error("Failed to fetch inventory for forecasting", error);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  React.useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleChangePage = (event: unknown, newPage: number) => setPage(newPage);

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStockStatus = (onHand: number, reorderLevel: number) => {
    if (onHand <= 0) return { label: 'Out of Stock', color: 'error' };
    if (onHand <= reorderLevel) return { label: 'Low Stock', color: 'warning' };
    return { label: 'Optimal', color: 'success' };
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh' }}>
      
      {/* --- PAGE HEADER --- */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ color: 'neutral.900', letterSpacing: '-0.02em' }}>
            Inventory Forecasting
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Brain size={18} weight="duotone" color={theme.palette.primary.main} />
            <Typography variant="body2" color="text.secondary" fontWeight="500">
              Predictive demand analysis and stock optimization
            </Typography>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button 
            startIcon={<ArrowClockwise size={18} weight="bold" />} 
            variant="outlined" 
            onClick={() => { setPage(0); fetchInventory(); }}
            sx={{ borderRadius: 2.5, fontWeight: 600, bgcolor: 'white', border: '1px solid #eaecf0' }}
          >
            Update Analysis
          </Button>
        </Stack>
      </Stack>

      {/* --- TABLE CONTAINER --- */}
      <Paper sx={{ borderRadius: 5, border: '1px solid #eaecf0', overflow: 'hidden', boxShadow: 'none' }}>
        <TableContainer>
          <Table sx={{ minWidth: 900 }}>
            <TableHead sx={{ bgcolor: '#fcfcfd' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Product Identification</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Warehouse Level</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Safety Threshold</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Analytics</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                 <TableRow>
                   <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                     <CircularProgress size={35} thickness={4} />
                     <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Running predictive models...</Typography>
                   </TableCell>
                 </TableRow>
              ) : (
                products.map((product) => {
                  const status = getStockStatus(product.quantity_on_hand, product.reorder_level);
                  const stockPercentage = Math.min((product.quantity_on_hand / (product.reorder_level * 2)) * 100, 100);

                  return (
                    <TableRow key={product.product_id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Box sx={{ p: 1, bgcolor: 'neutral.100', borderRadius: 2 }}>
                            <Package size={20} weight="duotone" color="#475467" />
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight="700" sx={{ color: 'neutral.900' }}>
                              {product.product_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                              {product.sku}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      
                      <TableCell sx={{ width: 250 }}>
                        <Stack spacing={0.5}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" fontWeight="700">{product.quantity_on_hand} Units</Typography>
                            <Typography variant="caption" color="text.secondary">{Math.round(stockPercentage)}% Capacity</Typography>
                          </Stack>
                          <LinearProgress 
                            variant="determinate" 
                            value={stockPercentage} 
                            color={status.color as any} 
                            sx={{ height: 6, borderRadius: 3, bgcolor: 'neutral.100' }} 
                          />
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Chip 
                          label={status.label} 
                          color={status.color as any} 
                          size="small" 
                          sx={{ fontWeight: 800, fontSize: '0.65rem', borderRadius: 1.5, textTransform: 'uppercase' }} 
                        />
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" fontWeight="600">{product.reorder_level}</Typography>
                        <Typography variant="caption" color="text.secondary">Min. Safety Units</Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Button 
                          variant="contained" 
                          size="small" 
                          endIcon={<CaretRight weight="bold" />}
                          onClick={() => router.push(`/dashboard/forecast/${product.sku}`)}
                          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 2 }}
                        >
                          View AI Model
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <Divider />
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalItems}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ bgcolor: '#fcfcfd' }}
          />
        </TableContainer>
      </Paper>
    </Box>
  );
}