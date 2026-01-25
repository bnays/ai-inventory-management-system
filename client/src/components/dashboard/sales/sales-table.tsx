"use client";

import React from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  IconButton, Chip, CircularProgress, Typography, Box, Stack, Avatar, Tooltip 
} from '@mui/material';
import { Eye as EyeIcon, Receipt, User, MapPin } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';

interface SaleOrder {
  id: number;
  customer_name: string;
  customer_address: string;
  processed_by: string;
  total_amount: number;
  created_at: string;
  status: 'Pending' | 'Completed' | 'Cancelled';
}

interface SalesTableProps {
  sales: SaleOrder[];
  loading: boolean;
}

export function SalesTable({ sales, loading }: SalesTableProps) {
  const router = useRouter();

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table sx={{ minWidth: '1000px' }}>
        <TableHead sx={{ bgcolor: '#fcfcfd' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Order ID</TableCell>
            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Customer & Destination</TableCell>
            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Operator</TableCell>
            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Timestamp</TableCell>
            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Total (AUD)</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                <CircularProgress size={35} thickness={4} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Retrieving sales ledger...</Typography>
              </TableCell>
            </TableRow>
          ) : sales.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                <Typography color="text.secondary">No outbound sales records archived.</Typography>
              </TableCell>
            </TableRow>
          ) : (
            sales.map((sale) => (
              <TableRow key={sale.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: 'neutral.100', width: 32, height: 32 }}>
                      <Receipt size={18} weight="duotone" color="#475467" />
                    </Avatar>
                    <Typography variant="body2" fontWeight="700">SAL-{sale.id}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Box>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <User size={14} color="text.secondary" />
                      <Typography variant="body2" fontWeight="600">{sale.customer_name || 'Walk-in Customer'}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <MapPin size={12} color="text.secondary" />
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                        {sale.customer_address || '-'}
                      </Typography>
                    </Stack>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary" fontWeight="500">
                    {sale.processed_by || 'System Admin'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="500">
                    {new Date(sale.created_at).toLocaleDateString('en-AU')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={sale.status.toUpperCase()} 
                    size="small" 
                    variant="outlined"
                    sx={{ 
                      fontWeight: 800, 
                      fontSize: '0.65rem',
                      borderRadius: 1.5,
                      color: sale.status === 'Completed' ? 'success.main' : sale.status === 'Pending' ? 'warning.main' : 'error.main',
                      borderColor: sale.status === 'Completed' ? 'success.200' : sale.status === 'Pending' ? 'warning.200' : 'error.200',
                      bgcolor: sale.status === 'Completed' ? 'success.50' : sale.status === 'Pending' ? 'warning.50' : 'error.50',
                    }} 
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="800" color="neutral.900">
                    ${Number(sale.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Inspect Sale">
                    <IconButton 
                      onClick={() => router.push(`/dashboard/sales/${sale.id}`)}
                      sx={{ color: 'primary.main', bgcolor: 'primary.50', '&:hover': { bgcolor: 'primary.100' } }}
                      size="small"
                    >
                      <EyeIcon size={18} weight="bold" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Box>
  );
}