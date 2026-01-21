// ./src/app/dashboard/sales/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { Stack, Typography, Button, Box } from '@mui/material';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { Download as DownloadIcon } from '@phosphor-icons/react/dist/ssr/Download';
import { useRouter } from 'next/navigation';
import { SalesTable } from '@/components/dashboard/sales/sales-table';
import { apiRequest } from '@/lib/api-client';
import { useNotification } from '@/lib/notification';
import { GlobalSnackbar } from '@/components/core/global-snackbar';

export default function SalesPage() {
    const router = useRouter();
    const { notification, showNotification, hideNotification } = useNotification();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSales = async () => {
            try {
                const data = await apiRequest('/sales');
                setSales(data.data || data);
            } catch (error) {
                showNotification("Failed to load sales records.", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchSales();
    }, [showNotification]);

    const handleExportCSV = async () => {
    try {
        showNotification("Preparing export...", "info");

        // 1. Fetch the data using your existing apiRequest (which handles the token)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales/export`, {
            method: 'GET',
            headers: {
                // Manually pull the token if apiRequest doesn't support Blobs
                'Authorization': `Bearer ${localStorage.getItem('custom-auth-token')}` 
            }
        });

        if (!response.ok) throw new Error("Export failed");

        // 2. Convert response to a Blob (Binary Large Object)
        const blob = await response.blob();
        
        // 3. Create a temporary download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logix_sales_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        
        // 4. Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showNotification("Download started!", "success");
    } catch (error) {
        console.error(error);
        showNotification("Failed to export: Unauthorized or Server Error", "error");
    }
};

    return (
        <Box>
            <Stack spacing={3}>
                <Stack direction="row" spacing={3} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h4" fontWeight="bold">Sales Orders</Typography>
                    
                    <Stack direction="row" spacing={2}>
                        <Button 
                            startIcon={<DownloadIcon size={20} />} 
                            variant="outlined" 
                            onClick={handleExportCSV}
                        >
                            Export to CSV
                        </Button>
                        <Button 
                            startIcon={<PlusIcon size={20} />} 
                            variant="contained" 
                            onClick={() => router.push('/dashboard/sales/new')}
                        >
                            Create New Sale
                        </Button>
                    </Stack>
                </Stack>
                
                <SalesTable sales={sales} loading={loading} />
            </Stack>
            <GlobalSnackbar state={notification} onClose={hideNotification} />
        </Box>
    );
}