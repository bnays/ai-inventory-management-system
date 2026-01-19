"use client";

import React, { useEffect, useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { usePurchases } from '@/contexts/purchase-context';
import { useNotification } from '@/lib/notification';
import { GlobalSnackbar } from '@/components/core/global-snackbar';
import { PurchasesTable } from '@/components/dashboard/purchases/purchases-table';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { useRouter } from 'next/navigation';

export default function PurchasesPage() {
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
        <Stack spacing={3}>
            <Stack direction="row" spacing={3} sx={{ justifyContent: 'space-between' }}>
                <Typography variant="h4">Purchase Order</Typography>
                <Button startIcon={<PlusIcon />} variant="contained" onClick={() => router.push('/dashboard/purchases/new')}>
                Create New Purchase Order
                </Button>
            </Stack>
            
            <PurchasesTable 
                purchases={purchases} 
                loading={loading} 
                onReceive={handleReceive} 
            />

            <GlobalSnackbar state={notification} onClose={hideNotification} />
        </Stack>
    );
}