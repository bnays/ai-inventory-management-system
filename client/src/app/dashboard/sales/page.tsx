"use client";

import React, { useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, Box, Chip, CircularProgress, Button 
} from '@mui/material';
import { useSales } from '@/contexts/sale-context'; //
import { useNotification } from '@/lib/notification'; //
import { GlobalSnackbar } from '@/components/core/global-snackbar';
import Link from 'next/link';

export default function SalesPage() {
    const { sales, loading, fetchSales } = useSales();
    const { notification, showNotification, hideNotification } = useNotification();

    useEffect(() => {
        fetchSales();
    }, [fetchSales]);

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Sales History</Typography>
                <Button variant="contained" component={Link} href="/dashboard/sales/new">
                    New Sale
                </Button>
            </Box>
            
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Sale ID</TableCell>
                            <TableCell>Customer</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Payment</TableCell>
                            <TableCell>Total</TableCell>
                            <TableCell>Date</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} align="center"><CircularProgress /></TableCell></TableRow>
                        ) : (
                            sales.map((sale) => (
                                <TableRow key={sale.id}>
                                    <TableCell>#{sale.id}</TableCell>
                                    <TableCell>{sale.username || 'Guest'}</TableCell>
                                    <TableCell>
                                        <Chip label={sale.status} color="success" size="small" onClick={(e) => {e.preventDefault}}/>
                                    </TableCell>
                                    <TableCell>{sale.payment_method}</TableCell>
                                    <TableCell>${sale.total_amount}</TableCell>
                                    <TableCell>{new Date(sale.created_at).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <GlobalSnackbar state={notification} onClose={hideNotification} />
        </Box>
    );
}