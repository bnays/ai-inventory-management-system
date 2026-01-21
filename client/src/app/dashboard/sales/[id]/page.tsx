"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Box, Typography, Paper, Grid, Table, TableBody, TableCell, 
  TableHead, TableRow, Button, Chip, Stack, Divider, TableContainer, CircularProgress 
} from '@mui/material';
import { Printer as PrinterIcon } from '@phosphor-icons/react/dist/ssr/Printer';
import { CaretLeft as CaretLeftIcon } from '@phosphor-icons/react/dist/ssr/CaretLeft';
import { apiRequest } from '@/lib/api-client';

export default function SaleDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await apiRequest(`/sales/${id}`);
                console.log(data, "SALE DETAILS");
                setOrder(data);
            } catch (error) {
                console.error("Failed to fetch sale details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
            <CircularProgress size={40} />
        </Box>
    );

    if (!order) return <Typography sx={{ p: 3 }}>Sale record not found.</Typography>;

    return (
        <Box sx={{ p: 3 }}>
            {/* Custom Print Styles */}
            <style>
                {`
                @media print {
                    body * { visibility: hidden; }
                    #printable-area, #printable-area * { visibility: visible; }
                    #printable-area { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print { display: none !important; }
                }
                `}
            </style>

            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }} className="no-print">
                <Button startIcon={<CaretLeftIcon />} onClick={() => router.push('/dashboard/sales')}>
                    Back to Sales
                </Button>
                <Button 
                    startIcon={<PrinterIcon size={20} />} 
                    variant="contained" 
                    onClick={() => window.print()}
                >
                    Print Dispatch Note
                </Button>
            </Stack>

            <Paper sx={{ p: 5, borderRadius: 2 }} id="printable-area">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 5 }}>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" color="primary">LOGIX</Typography>
                        <Typography variant="subtitle1" sx={{ letterSpacing: 1 }}>WAREHOUSE MANAGEMENT</Typography>
                        <Typography variant="body2" color="text.secondary">Sydney Hub - NSW, Australia</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h5" fontWeight="bold">INVOICE #S-{order.id}</Typography>
                        <Typography color="text.secondary">{new Date(order.created_at).toLocaleDateString()}</Typography>
                        <Chip label={order.status} color="success" size="small" sx={{ mt: 1 }} />
                    </Box>
                </Box>

                <Grid container spacing={4} sx={{ mb: 6 }}>
                    <Grid size={{xs: 6}}>
                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold' }}>Ship To:</Typography>
                        <Typography variant="h6" sx={{ mt: 0.5 }}>{order.customer_name}</Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: 'text.secondary' }}>
                            {order.customer_address}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>Phone: {order.customer_phone}</Typography>
                    </Grid>
                    <Grid size={{xs: 6}} sx={{ textAlign: 'right' }}>
                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold' }}>Authorized By:</Typography>
                        <Typography variant="h6" sx={{ mt: 0.5 }}>{order.processed_by}</Typography>
                        <Typography variant="body2" color="text.secondary">Role: {order.processed_by_role}</Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>Payment: {order.payment_method}</Typography>
                    </Grid>
                </Grid>

                <TableContainer sx={{ mb: 4 }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>SKU</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Qty</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Price</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {order.items?.map((item: any) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.sku}</TableCell>
                                    <TableCell>{item.product_name}</TableCell>
                                    <TableCell align="right">{item.quantity}</TableCell>
                                    <TableCell align="right">${Number(item.unit_price).toFixed(2)}</TableCell>
                                    <TableCell align="right">${(item.quantity * item.unit_price).toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ ml: 'auto', width: { xs: '100%', md: '30%' } }}>
                    <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography color="text.secondary">Subtotal:</Typography>
                            <Typography>${(Number(order.total_amount) - Number(order.tax)).toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography color="text.secondary">Tax (GST):</Typography>
                            <Typography>${Number(order.tax).toFixed(2)}</Typography>
                        </Box>
                        <Divider />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="h6" fontWeight="bold">Total:</Typography>
                            <Typography variant="h6" fontWeight="bold" color="primary">
                                ${Number(order.total_amount).toFixed(2)}
                            </Typography>
                        </Box>
                    </Stack>
                </Box>
            </Paper>
        </Box>
    );
}