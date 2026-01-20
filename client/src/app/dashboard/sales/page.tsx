// src/app/dashboard/sales/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { Stack, Typography, Button, Box } from '@mui/material';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { useRouter } from 'next/navigation';
import { SalesTable } from '@/components/dashboard/sales/sales-table';
import { apiRequest } from '@/lib/api-client';
import { GlobalSnackbar } from '@/components/core/global-snackbar';

export default function SalesPage() {
    const router = useRouter();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSales = async () => {
            try {
                const data = await apiRequest('/sales');
                setSales(data.data || data);
            } catch (error) {
                console.error("Failed to fetch sales", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSales();
    }, []);

    return (
        <>
            <Stack spacing={3}>
                <Stack direction="row" spacing={3} sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="h4">Sales Orders</Typography>
                    <Button 
                        startIcon={<PlusIcon size={20} />} 
                        variant="contained" 
                        onClick={() => router.push('/dashboard/sales/new')}
                    >
                        Create New Sale
                    </Button>
                </Stack>
                
                <SalesTable sales={sales} loading={loading} />
            </Stack>
        </>
    );
}