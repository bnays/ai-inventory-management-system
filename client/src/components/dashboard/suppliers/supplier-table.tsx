// src/components/dashboard/suppliers/suppliers-table.tsx
'use client';

import * as React from 'react';
import { 
  Box, Card, Table, TableBody, TableCell, TableHead, 
  TableRow, Typography, CircularProgress, Link, 
  Tooltip,
  IconButton
} from '@mui/material';
import type { Supplier } from '@/contexts/supplier-context';
import { Pencil as PencilIcon } from '@phosphor-icons/react/dist/ssr/Pencil';
import { TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';

interface SuppliersTableProps {
  rows?: Supplier[];
  isLoading?: boolean;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
}

export function SuppliersTable({ rows = [], isLoading, onEdit, onDelete }: SuppliersTableProps): React.JSX.Element {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const safeRows = Array.isArray(rows) ? rows : [];

  return (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: '1000px' }}>
          <TableHead>
            <TableRow>
              <TableCell>Supplier Name</TableCell>
              <TableCell>Contact Info</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Payment Method</TableCell>
              <TableCell>Created Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {safeRows.map((supplier) => (
              <TableRow hover key={supplier.id}>
                <TableCell>
                  <Typography variant="subtitle2">{supplier.name}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{supplier.email}</Typography>
                  <Link href={`tel:${supplier.phone_number}`} variant="body2" underline="hover">
                    {supplier.phone_number}
                  </Link>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: '250px' }} noWrap>
                    {supplier.address}
                  </Typography>
                </TableCell>
                <TableCell>
                    <Typography>{supplier.payment_method}</Typography>
                    <Typography>{supplier.payment_details}</Typography>
                    </TableCell>
                <TableCell>
                  {supplier.created_at ? new Date(supplier.created_at).toLocaleDateString('en-AU') : 'N/A'}
                </TableCell>
                <TableCell align="right">
                    <Tooltip title="Edit Supplier">
                        <IconButton 
                        onClick={() => onEdit(supplier)} // Function passed from the Page
                        size="small"
                        >
                        <PencilIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Supplier">
                        <IconButton 
                        onClick={() => onDelete?.(supplier)} 
                        color="error"
                        >
                        <TrashIcon size={20} />
                        </IconButton>
                    </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {safeRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" sx={{ py: 3 }}>No suppliers found.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    </Card>
  );
}