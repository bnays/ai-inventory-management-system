"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Stack, Typography, Button, Box, useTheme, Paper, CircularProgress, Divider, TablePagination } from '@mui/material';
import { 
  Plus as PlusIcon, 
  Download as DownloadIcon, 
  TrendUp, 
  ArrowClockwise 
} from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { SalesTable } from '@/components/dashboard/sales/sales-table';
import { apiRequest } from '@/lib/api-client';
import { useNotification } from '@/lib/notification';
import { GlobalSnackbar } from '@/components/core/global-snackbar';

export default function SalesPage() {
    const theme = useTheme();
    const router = useRouter();
    const { notification, showNotification, hideNotification } = useNotification();
    
    // Data & Loading States
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination States
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const fetchSales = useCallback(async () => {
        setLoading(true);
        try {
            // Note: Backend handles 'page' (1-based) and 'limit'
            const response = await apiRequest(`/sales?page=${page + 1}&limit=${rowsPerPage}`);
            
            // Supporting both wrapped { data, meta } and direct array responses
            setSales(response.data || response);
            setTotalItems(response.meta?.totalItems || response.total || (response.data?.length || 0));
        } catch (error) {
            showNotification("Failed to load outbound sales records.", "error");
        } finally {
            setLoading(false);
        }
    }, [showNotification, page, rowsPerPage]);

    useEffect(() => { fetchSales(); }, [fetchSales]);

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleExportCSV = async () => {
        try {
            showNotification("Generating logistics export...", "info");
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales/export`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('custom-auth-token')}` 
                }
            });

            if (!response.ok) throw new Error("Export failed");
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Logix_Sales_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showNotification("CSV Export successful.", "success");
        } catch (error) {
            showNotification("Failed to export: Unauthorized or Server Error", "error");
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f9fafb', minHeight: '100vh' }}>
            <Stack spacing={4}>
                {/* --- PAGE HEADER --- */}
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
                    <Box>
                        <Typography variant="h4" fontWeight="800" sx={{ color: 'neutral.900', letterSpacing: '-0.02em' }}>
                            Sales Order
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <TrendUp size={18} weight="duotone" color={theme.palette.primary.main} />
                            <Typography variant="body2" color="text.secondary" fontWeight="500">
                                Monitor revenue and Order fulfillment
                            </Typography>
                        </Stack>
                    </Box>
                    
                    <Stack direction="row" spacing={1.5}>
                        <Button 
                            startIcon={<ArrowClockwise size={18} weight="bold" />} 
                            variant="outlined" 
                            onClick={() => { setPage(0); fetchSales(); }}
                            sx={{ borderRadius: 2.5, fontWeight: 600, bgcolor: 'white', border: '1px solid #eaecf0' }}
                        >
                            Refresh
                        </Button>
                        <Button 
                            startIcon={<DownloadIcon size={18} weight="bold" />} 
                            variant="outlined" 
                            onClick={handleExportCSV}
                            sx={{ borderRadius: 2.5, fontWeight: 600, bgcolor: 'white', border: '1px solid #eaecf0' }}
                        >
                            Export
                        </Button>
                        <Button 
                            startIcon={<PlusIcon size={18} weight="bold" />} 
                            variant="contained" 
                            onClick={() => router.push('/dashboard/sales/new')}
                            sx={{ borderRadius: 2.5, fontWeight: 700, px: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        >
                            Create Sale
                        </Button>
                    </Stack>
                </Stack>
                
                <Paper sx={{ borderRadius: 5, border: '1px solid #eaecf0', overflow: 'hidden', boxShadow: 'none' }}>
                    <SalesTable sales={sales} loading={loading} />
                    <Divider />
                    <TablePagination
                        component="div"
                        count={totalItems}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        rowsPerPageOptions={[5, 10, 25]}
                        sx={{ bgcolor: '#fcfcfd' }}
                    />
                </Paper>
            </Stack>
            <GlobalSnackbar state={notification} onClose={hideNotification} />
        </Box>
    );
}