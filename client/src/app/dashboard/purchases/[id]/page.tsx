"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Typography, Paper, Grid, Table, TableBody, TableCell, TableHead, TableRow, Button, Chip, Stack, Divider, TableContainer } from '@mui/material';
import { Printer as PrinterIcon } from '@phosphor-icons/react/dist/ssr/Printer';
import { CaretLeft as CaretLeftIcon } from '@phosphor-icons/react/dist/ssr/CaretLeft';
import { apiRequest } from '@/lib/api-client';

export default function PurchaseDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await apiRequest(`/purchases/${id}`);
                setOrder(data);
            } catch (error) {
                console.error("Failed to fetch order details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    if (loading) return <Typography>Loading...</Typography>;
    if (!order) return <Typography>Order not found.</Typography>;

    return (
        <Box>
            {/* 1. Global Print Styles */}
            <style style={{ display: 'none' }}>
                {`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-area, #printable-area * {
                        visibility: visible;
                    }
                    #printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }

                    /* Reduce Table Cell Height */
                    #printable-area .MuiTableCell-root {
                        padding: 4px 8px !important; /* Tightens vertical space */
                        height: auto !important;
                        border-bottom: 1px solid #eee !important;
                    }

                    /* Adjust Font Sizes for Print */
                    #printable-area .MuiTypography-root {
                        margin-bottom: 4px !important;
                    }
                    
                    #printable-area th {
                        background-color: #f5f5f5 !important;
                        -webkit-print-color-adjust: exact; /* Ensures background prints */
                    }

                    @page {
                        margin: 1cm;
                    }
                }
                `}
            </style>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Button startIcon={<CaretLeftIcon />} onClick={() => router.back()}>Back to List</Button>
                <Button startIcon={<PrinterIcon />} variant="outlined" onClick={() => window.print()}>
                    Print Receipt
                </Button>
            </Stack>

            <Paper id="printable-area">
                <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                    <Box>
                        <Typography variant="h5" fontWeight="bold">LOGIX WAREHOUSE</Typography>
                        <Typography variant="body2">Sydney, NSW, Australia</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h6">PURCHASE ORDER</Typography>
                        <Typography color="text.secondary">#{order.id}</Typography>
                        <Chip label={order.status} color={order.status === 'Received' ? 'success' : 'warning'} sx={{ mt: 1 }} onClick={(e) => {e.preventDefault}} />
                    </Box>
                </Box>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid size={{xs: 6}}>
                        <Typography variant="subtitle2" color="text.secondary">Supplier:</Typography>
                        <Typography variant="body1" fontWeight="bold">{order.supplier_name}</Typography>
                        <Typography variant="body2">{order.supplier_email}</Typography>
                    </Grid>
                    <Grid size={{xs: 6}} sx={{ textAlign: 'right' }}>
                        <Typography variant="subtitle2" color="text.secondary">Order Date:</Typography>
                        <Typography variant="body1">{new Date(order.order_date).toLocaleDateString()}</Typography>
                        {order.received_date && (
                            <>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Received Date:</Typography>
                                <Typography variant="body1">{new Date(order.received_date).toLocaleDateString()}</Typography>
                            </>
                        )}
                    </Grid>
                </Grid>

                <Divider sx={{ mb: 4 }} />

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Product SKU</TableCell>
                                <TableCell>Product Name</TableCell>
                                <TableCell align="right">Quantity</TableCell>
                                <TableCell align="right">Unit Cost</TableCell>
                                <TableCell align="right">Total</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {order.items?.map((item: any) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.sku}</TableCell>
                                    <TableCell>{item.product_name}</TableCell>
                                    <TableCell align="right">{item.quantity}</TableCell>
                                    <TableCell align="right">${Number(item.cost_price).toFixed(2)}</TableCell>
                                    <TableCell align="right">${(item.quantity * item.cost_price).toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                            <TableRow>
                                <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>Grand Total</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>${Number(order.total_amount).toFixed(2)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
                </Paper>
            </Paper>
        </Box>
    );
}