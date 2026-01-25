"use client";

import React, { useEffect, useState } from 'react';
import { Button, Stack, Typography, Box, useTheme, Paper, CircularProgress } from '@mui/material';
import { usePurchases } from '@/contexts/purchase-context';
import { useNotification } from '@/lib/notification';
import { GlobalSnackbar } from '@/components/core/global-snackbar';
import { PurchasesTable } from '@/components/dashboard/purchases/purchases-table';
import { 
  Plus as PlusIcon, 
  ShoppingCart, 
  ArrowClockwise 
} from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';

export default function PurchasesPage() {
    const theme = useTheme();
    const router = useRouter();
    const { purchases, loading, fetchPurchases, receiveOrder } = usePurchases();
    const { notification, showNotification, hideNotification } = useNotification();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchPurchases();
    }, [fetchPurchases]);

    if (!mounted) return null;

    const handleReceive = async (id: number) => {
        try {
            await receiveOrder(id);
            showNotification("Order received and inventory updated!", "success");
        } catch (error: any) {
            showNotification(error.message || "Failed to receive order", "error");
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh' }}>
            
            {/* --- PAGE HEADER --- */}
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight="800" sx={{ color: 'neutral.900', letterSpacing: '-0.02em' }}>
                        Purchase Orders
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <ShoppingCart size={18} weight="duotone" color={theme.palette.primary.main} />
                        <Typography variant="body2" color="text.secondary" fontWeight="500">
                            Monitor incoming stock and verify supplier deliveries
                        </Typography>
                    </Stack>
                </Box>

                <Stack direction="row" spacing={1.5}>
                    <Button 
                        startIcon={<ArrowClockwise size={18} weight="bold" />} 
                        variant="outlined" 
                        onClick={() => fetchPurchases()}
                        sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, bgcolor: 'white' }}
                    >
                        Refresh
                    </Button>
                    <Button 
                        startIcon={<PlusIcon size={18} weight="bold" />} 
                        variant="contained" 
                        onClick={() => router.push('/dashboard/purchases/new')}
                        sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, px: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    >
                        Create Purchase Order
                    </Button>
                </Stack>
            </Stack>
            
            <Paper sx={{ borderRadius: 5, border: '1px solid #eaecf0', overflow: 'hidden', boxShadow: 'none' }}>
                <PurchasesTable 
                    purchases={purchases} 
                    loading={loading} 
                    onReceive={handleReceive} 
                />
            </Paper>

            <GlobalSnackbar state={notification} onClose={hideNotification} />
        </Box>
    );
}