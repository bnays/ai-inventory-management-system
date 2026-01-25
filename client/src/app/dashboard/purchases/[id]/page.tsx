"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Box, Typography, Paper, Grid, Table, TableBody, TableCell, 
  TableHead, TableRow, Button, Chip, Stack, Divider, 
  TableContainer, IconButton, useTheme, Avatar, CircularProgress 
} from '@mui/material';
import { 
  Printer as PrinterIcon, 
  CaretLeft as CaretLeftIcon,
  Receipt,
  Buildings
} from '@phosphor-icons/react';
import { apiRequest } from '@/lib/api-client';

export default function PurchaseDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const theme = useTheme();
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

    if (loading) return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, bgcolor: '#f9fafb', minHeight: '100vh' }}>
        <CircularProgress size={40} thickness={4} />
      </Box>
    );

    if (!order) return <Typography sx={{ p: 4 }}>Order not found.</Typography>;

    const subtotal = Number(order.total_amount) - (Number(order.tax) || 0);

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh' }}>
            <style>
                {`
                @media print {
                    body * { visibility: hidden; }
                    #printable-area, #printable-area * { visibility: visible; }
                    #printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    .no-print { display: none !important; }
                    
                    /* Table Styles */
                    #printable-area .MuiTableCell-root {
                        padding: 8px 12px !important;
                        border-bottom: 1px solid #eee !important;
                        color: #000 !important;
                    }

                    /* Remove Borders for Summary Rows */
                    #printable-area .summary-row .MuiTableCell-root {
                        border-bottom: none !important;
                        padding-top: 4px !important;
                        padding-bottom: 4px !important;
                    }

                    /* Icon and Branding Visibility */
                    #printable-area .brand-icon {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        background-color: ${theme.palette.primary.main} !important;
                        color: white !important;
                    }

                    th { 
                        background-color: #f5f5f5 !important; 
                        -webkit-print-color-adjust: exact !important;
                        font-weight: bold !important;
                    }
                }
                `}
            </style>

            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }} className="no-print">
                <Stack direction="row" spacing={2} alignItems="center">
                    <IconButton onClick={() => router.push('/dashboard/purchases')} sx={{ bgcolor: 'white', border: '1px solid #eaecf0', borderRadius: 2 }}>
                        <CaretLeftIcon size={20} weight="bold" />
                    </IconButton>
                    <Box>
                        <Typography variant="h4" fontWeight="800">Order Details</Typography>
                        <Typography variant="body2" color="text.secondary">Official procurement record</Typography>
                    </Box>
                </Stack>
                <Button startIcon={<PrinterIcon weight="bold" />} variant="outlined" onClick={() => window.print()} sx={{ borderRadius: 2.5, bgcolor: 'white' }}>
                    Print Receipt
                </Button>
            </Stack>

            <Paper id="printable-area" sx={{ borderRadius: 5, border: '1px solid #eaecf0', boxShadow: 'none' }}>
                <Box sx={{ p: 4 }}>
                    {/* Header with Icon Fix */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 6 }}>
                        <Box>
                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                                <Avatar className="brand-icon" sx={{ bgcolor: 'primary.main', width: 40, height: 40, borderRadius: 2 }}>
                                    <Buildings weight="bold" color="white" />
                                </Avatar>
                                <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: '-0.03em' }}>
                                    LOGIX WAREHOUSE
                                </Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary">Sydney, New South Wales, Australia</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="h6" fontWeight="800">PURCHASE ORDER</Typography>
                            <Typography color="text.secondary" sx={{ mb: 1 }}>#{order.id}</Typography>
                            <Chip 
                                label={order.status} 
                                color={order.status === 'Received' ? 'success' : 'warning'} 
                                sx={{ fontWeight: 700, px: 1 }} 
                                onClick={(e) => e.preventDefault()}
                            />
                        </Box>
                    </Box>

                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid size={{xs: 6}}>
                            <Typography variant="subtitle2" color="text.secondary">Supplier:</Typography>
                            <Typography variant="body1" fontWeight="bold">{order.supplier_name}</Typography>
                            <Typography variant="body2">{order.supplier_email}</Typography>
                        </Grid>
                        <Grid size={{xs: 6}} sx={{ textAlign: 'right' }}>
                            <Typography variant="subtitle2" color="text.secondary">Date:</Typography>
                            <Typography variant="body1">{new Date(order.order_date).toLocaleDateString('en-AU')}</Typography>
                        </Grid>
                    </Grid>

                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: '#fcfcfd' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>SKU</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Qty</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Unit</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {order.items?.map((item: any) => (
                                    <TableRow key={item.id}>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>{item.sku}</TableCell>
                                        <TableCell>{item.product_name}</TableCell>
                                        <TableCell align="right">{item.quantity}</TableCell>
                                        <TableCell align="right">${Number(item.cost_price).toFixed(2)}</TableCell>
                                        <TableCell align="right">${(item.quantity * item.cost_price).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                                
                                {/* Financial Area - Borderless for Print */}
                                <TableRow className="summary-row" sx={{ border: 'none' }}>
                                    <TableCell colSpan={3} />
                                    <TableCell align="right" color="text.secondary">Subtotal:</TableCell>
                                    <TableCell align="right">${subtotal.toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow className="summary-row">
                                    <TableCell colSpan={3} />
                                    <TableCell align="right" color="text.secondary">GST (10%):</TableCell>
                                    <TableCell align="right">${(Number(order.tax) || 0).toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow className="summary-row">
                                    <TableCell colSpan={3} />
                                    <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Grand Total:</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                                        ${Number(order.total_amount).toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Paper>
        </Box>
    );
}