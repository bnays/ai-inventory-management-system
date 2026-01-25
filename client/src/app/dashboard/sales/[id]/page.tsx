"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Box, Typography, Paper, Grid, Table, TableBody, TableCell, 
  TableHead, TableRow, Button, Chip, Stack, TableContainer, 
  CircularProgress, IconButton, Avatar, useTheme, Divider 
} from '@mui/material';
import { 
    Printer as PrinterIcon, 
    CaretLeft as CaretLeftIcon, 
    Buildings,
    Receipt
} from '@phosphor-icons/react';
import { apiRequest } from '@/lib/api-client';

export default function SaleDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const theme = useTheme();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await apiRequest(`/sales/${id}`);
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
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10, bgcolor: '#f9fafb', minHeight: '100vh' }}>
            <CircularProgress size={40} thickness={4} />
        </Box>
    );

    if (!order) return <Typography sx={{ p: 4 }}>Outbound record not found.</Typography>;

    const netAmount = Number(order.total_amount) - Number(order.tax);

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f9fafb', minHeight: '100vh' }}>
            <style>
                {`
                @media print {
                    /* --- Standard Page Resets --- */
                    body * { visibility: hidden; }
                    #printable-area, #printable-area * { visibility: visible; }
                    #printable-area { 
                        position: absolute; left: 0; top: 0; width: 100%; 
                        box-shadow: none !important; border: none !important; 
                        padding: 0 !important; margin: 0 !important;
                    }
                    .no-print { display: none !important; }
                    @page { size: A4; margin: 1.5cm; }

                    /* --- Standard Table Styling (Matches Purchase Order) --- */
                    #printable-area table { border-collapse: collapse !important; width: 100% !important; }
                    
                    #printable-area .MuiTableCell-root {
                        padding: 8px 12px !important;
                        border-bottom: 1px solid #eee !important; /* Standard row line */
                        color: #000 !important;
                    }

                    th { 
                        background-color: #f5f5f5 !important; 
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        font-weight: bold !important;
                    }

                    /* --- Financial Summary Section (No Borders) --- */
                    #printable-area .summary-row .MuiTableCell-root {
                        border-bottom: none !important;
                        padding-top: 4px !important;
                        padding-bottom: 4px !important;
                    }

                    /* --- Logo Visibility Fix --- */
                    #printable-area .brand-icon {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        background-color: ${theme.palette.primary.main} !important;
                        color: white !important;
                    }
                }
                `}
            </style>

            {/* --- WEB ACTION BAR --- */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }} className="no-print">
                <Stack direction="row" spacing={2} alignItems="center">
                    <IconButton onClick={() => router.push('/dashboard/sales')} sx={{ bgcolor: 'white', border: '1px solid #eaecf0', borderRadius: 2 }}>
                        <CaretLeftIcon size={20} weight="bold" />
                    </IconButton>
                    <Box>
                        <Typography variant="h4" fontWeight="800">Dispatch Details</Typography>
                        <Typography variant="body2" color="text.secondary">Outbound logistics record</Typography>
                    </Box>
                </Stack>
                <Button 
                    startIcon={<PrinterIcon size={18} weight="bold" />} 
                    variant="outlined" 
                    onClick={() => window.print()}
                    sx={{ borderRadius: 2.5, bgcolor: 'white', px: 3, border: '1px solid #eaecf0' }}
                >
                    Print Dispatch Note
                </Button>
            </Stack>

            {/* --- PRINTABLE DOCUMENT --- */}
            <Paper id="printable-area" sx={{ borderRadius: 5, border: '1px solid #eaecf0', boxShadow: 'none', overflow: 'hidden' }}>
                <Box sx={{ p: 4 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 6 }}>
                        <Box>
                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                                <Avatar className="brand-icon" sx={{ bgcolor: 'primary.main', width: 40, height: 40, borderRadius: 2 }}>
                                    <Buildings weight="bold" color="white" />
                                </Avatar>
                                <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: '-0.03em' }}>LOGIX WAREHOUSE</Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary">Sydney, New South Wales, Australia</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="h6" fontWeight="800" sx={{ mb: 0.5 }}>TAX INVOICE</Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>#SAL-{order.id}</Typography>
                            <Chip label={order.status} color="success" sx={{ fontWeight: 700, px: 1 }} />
                        </Box>
                    </Box>

                    {/* Meta Data */}
                    <Grid container spacing={3} sx={{ mb: 6 }}>
                        <Grid size={{ xs: 6 }}>
                            <Typography variant="subtitle2" color="text.secondary" fontWeight="700" sx={{ textTransform: 'uppercase', mb: 1 }}>Bill & Ship To:</Typography>
                            {/* Removed Box/Border styling for print via CSS reset, kept for web */}
                            <Box sx={{ p: 2, bgcolor: '#fcfcfd', borderRadius: 3, border: '1px solid #f2f4f7', '@media print': { border: 'none', p: 0 } }}>
                                <Typography variant="body1" fontWeight="800">{order.customer_name}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>{order.customer_address}</Typography>
                                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>Contact: {order.customer_phone}</Typography>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 6 }} sx={{ textAlign: 'right' }}>
                            <Typography variant="subtitle2" color="text.secondary" fontWeight="700" sx={{ textTransform: 'uppercase', mb: 1 }}>Authentication:</Typography>
                            <Typography variant="body2"><strong>Date:</strong> {new Date(order.created_at).toLocaleDateString('en-AU')}</Typography>
                            <Typography variant="body2"><strong>Staff:</strong> {order.processed_by}</Typography>
                            <Typography variant="body2"><strong>Payment:</strong> {order.payment_method}</Typography>
                        </Grid>
                    </Grid>

                    <Divider sx={{ mb: 4 }} />

                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: '#fcfcfd' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>SKU</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Product Name</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Price</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {order.items?.map((item: any) => (
                                    <TableRow key={item.id}>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>{item.sku}</TableCell>
                                        <TableCell sx={{ fontWeight: 500 }}>{item.product_name}</TableCell>
                                        <TableCell align="right">{item.quantity}</TableCell>
                                        <TableCell align="right">${Number(item.unit_price).toFixed(2)}</TableCell>
                                        <TableCell align="right">${(item.quantity * item.unit_price).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                                
                                {/* Financial Area - Matches Purchase Order Borderless Style */}
                                <TableRow className="summary-row">
                                    <TableCell colSpan={3} />
                                    <TableCell align="right" sx={{ color: 'text.secondary' }}>Subtotal:</TableCell>
                                    <TableCell align="right">${netAmount.toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow className="summary-row">
                                    <TableCell colSpan={3} />
                                    <TableCell align="right" sx={{ color: 'text.secondary' }}>GST (10%):</TableCell>
                                    <TableCell align="right">${Number(order.tax).toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow className="summary-row">
                                    <TableCell colSpan={3} />
                                    <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Total AUD:</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1rem', color: 'primary.main' }}>
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