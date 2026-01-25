'use client';

import * as React from 'react';
import {
  Box, Card, Chip, Divider, Stack, Table, TableBody, 
  TableCell, TableHead, TablePagination, TableRow, 
  Typography, IconButton, Tooltip, Avatar
} from '@mui/material';
import { 
  PencilSimple as PencilIcon, 
  Trash as TrashIcon, 
  WarningCircle, 
  CheckCircle 
} from '@phosphor-icons/react';

export interface Product {
  product_id: string;
  product_name: string;
  sku: string;
  category?: string;
  category_id: number;
  unit_price: number;
  quantity_on_hand: number;
  reorder_level: number;
  created_at?: string;
  supplier_names?: string | null;
  suppliers?: {
    supplier_id: number;
    supply_price: number;
    lead_time_days?: number;
  }[];
}

export interface ProductsTableProps {
  count?: number;
  page?: number;
  rows?: Product[];
  rowsPerPage?: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductsTable({
  count = 0,
  rows = [],
  page = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onDelete,
}: ProductsTableProps): React.JSX.Element {
  return (
    <Card sx={{ border: 'none', boxShadow: 'none' }}>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: '1000px' }}>
          <TableHead sx={{ bgcolor: '#fcfcfd' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Product Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>SKU</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Price (AUD)</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Inventory</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const isLowStock = Number(row.quantity_on_hand) <= Number(row.reorder_level);
              
              return (
                <TableRow hover key={row.product_id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="body2" fontWeight="600">{row.product_name}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      {row.sku}
                    </Typography>
                  </TableCell>
                  <TableCell>
                        <Chip 
                            /* Use row.category (the name) from your SQL JOIN */
                            label={row.category ? row.category : 'Uncategorized'} 
                            size="small" 
                            variant="outlined" 
                            sx={{ 
                            fontWeight: 600, 
                            borderRadius: 1.5,
                            bgcolor: row.category ? 'primary.50' : 'neutral.50',
                            color: row.category ? 'primary.main' : 'text.secondary',
                            borderColor: row.category ? 'primary.200' : 'neutral.200'
                            }} 
                        />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="600">
                      {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(row.unit_price)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color={isLowStock ? 'error.main' : 'text.primary'} fontWeight="700">
                      {row.quantity_on_hand}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={isLowStock ? 'Low Stock' : 'Optimal'}
                      size="small"
                      sx={{ 
                        fontWeight: 700, 
                        bgcolor: isLowStock ? 'error.50' : 'success.50',
                        color: isLowStock ? 'error.main' : 'success.main'
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Edit SKU">
                        <IconButton 
                          onClick={() => onEdit(row)} 
                          size="small"
                          sx={{ color: 'primary.main', bgcolor: 'primary.50', '&:hover': { bgcolor: 'primary.100' } }}
                        >
                          <PencilIcon size={18} weight="bold" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Product">
                        <IconButton 
                          onClick={() => onDelete(row)} 
                          size="small"
                          sx={{ color: 'error.main', bgcolor: 'error.50', '&:hover': { bgcolor: 'error.100' } }}
                        >
                          <TrashIcon size={18} weight="bold" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
      <Divider />
      <TablePagination
        component="div"
        count={count}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
        sx={{ border: 'none' }}
      />
    </Card>
  );
}