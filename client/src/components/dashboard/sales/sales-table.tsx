"use client";

import React from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, IconButton, Chip, CircularProgress, Typography 
} from '@mui/material';
import { Eye as EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'Pending': return 'warning';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
      <Table>
        <TableHead sx={{ bgcolor: '#f8f9fa' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>Order ID</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Customer & Destination</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Processed By</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Date & Time</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Total Amount</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                <CircularProgress size={24} />
              </TableCell>
            </TableRow>
          ) : sales.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                <Typography color="text.secondary">No sales records found.</Typography>
              </TableCell>
            </TableRow>
          ) : (
            // No whitespace between mapping and TableRow
            sales.map((sale) => (
              <TableRow key={sale.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{sale.id}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{sale.customer_name || 'Walk-in Customer'}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{sale.customer_address || 'No Address Provided'}</Typography>
                </TableCell>
                <TableCell>{sale.processed_by || 'Unknown Staff'}</TableCell>
                <TableCell>
                  {new Date(sale.created_at).toLocaleDateString()}
                  <Typography variant="caption" display="block" color="text.secondary">
                    {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={sale.status} size="small" color={getStatusColor(sale.status)} variant="outlined" />
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  ${Number(sale.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => router.push(`/dashboard/sales/${sale.id}`)} title="View Details">
                    <EyeIcon size={20} weight="bold" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}