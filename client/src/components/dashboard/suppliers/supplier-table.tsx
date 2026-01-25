'use client';

import * as React from 'react';
import { 
  Box, Card, Table, TableBody, TableCell, TableHead, 
  TableRow, Typography, CircularProgress, Link, 
  Tooltip, IconButton, Avatar, Stack, Chip
} from '@mui/material';
import { 
  PencilSimple as PencilIcon, 
  Trash as TrashIcon, 
  CreditCard,
  EnvelopeSimple,
  Phone
} from '@phosphor-icons/react';
import type { Supplier } from '@/contexts/supplier-context';

interface SuppliersTableProps {
  rows?: Supplier[];
  isLoading?: boolean;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
}

export function SuppliersTable({ rows = [], isLoading, onEdit, onDelete }: SuppliersTableProps): React.JSX.Element {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 2 }}>
        <CircularProgress size={35} thickness={4} />
        <Typography variant="body2" color="text.secondary">Accessing provider records...</Typography>
      </Box>
    );
  }

  const safeRows = Array.isArray(rows) ? rows : [];

  return (
    <Card sx={{ border: 'none', boxShadow: 'none' }}>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: '1000px' }}>
          <TableHead sx={{ bgcolor: '#fcfcfd' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Supplier Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Contact Information</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Logistics Address</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Payment Terms</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Onboarded</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {safeRows.map((supplier) => (
              <TableRow hover key={supplier.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: 'primary.50', color: 'primary.main', fontWeight: 'bold', fontSize: '0.875rem' }}>
                      {supplier.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="600">{supplier.name}</Typography>
                      <Typography variant="caption" color="text.secondary">Code: SUP-{supplier.id}</Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <EnvelopeSimple size={14} />
                      <Typography variant="body2">{supplier.email}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Phone size={14} />
                      <Link href={`tel:${supplier.phone_number}`} variant="body2" underline="hover" color="inherit">
                        {supplier.phone_number}
                      </Link>
                    </Stack>
                  </Stack>
                </TableCell>
                <TableCell sx={{ maxWidth: 200 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    display: '-webkit-box', 
                    WebkitLineClamp: 2, 
                    WebkitBoxOrient: 'vertical', 
                    overflow: 'hidden' 
                  }}>
                    {supplier.address}
                  </Typography>
                </TableCell>
                <TableCell>
                    <Chip 
                      icon={<CreditCard size={14} weight="duotone" />}
                      label={supplier.payment_method}
                      size="small"
                      sx={{ fontWeight: 600, bgcolor: 'neutral.50', mb: 0.5 }}
                    />
                    <Typography variant="caption" display="block" color="text.secondary">
                      {supplier.payment_details || 'No details provided'}
                    </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {supplier.created_at ? new Date(supplier.created_at).toLocaleDateString('en-AU') : '—'}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Edit Supplier">
                      <IconButton 
                        onClick={() => onEdit(supplier)}
                        size="small"
                        sx={{ color: 'primary.main', bgcolor: 'primary.50', '&:hover': { bgcolor: 'primary.100' } }}
                      >
                        <PencilIcon size={18} weight="bold" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove Record">
                      <IconButton 
                        onClick={() => onDelete?.(supplier)} 
                        size="small"
                        sx={{ color: 'error.main', bgcolor: 'error.50', '&:hover': { bgcolor: 'error.100' } }}
                      >
                        <TrashIcon size={18} weight="bold" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {safeRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">No registered distribution partners found.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    </Card>
  );
}