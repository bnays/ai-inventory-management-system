// src/components/dashboard/products/products-table.tsx
'use client';

import * as React from 'react';
import {
  Box,
  Card,
  Checkbox,
  Chip,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Pencil as PencilIcon } from '@phosphor-icons/react/dist/ssr/Pencil';
import { Trash as TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';

export interface Product {
  product_id: string; // Matches your MySQL primary key
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

interface ProductsTableProps {
  count?: number;
  page?: number;
  rows?: Product[];
  rowsPerPage?: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onEdit: (product: Product) => void; // Trigger for edit modal
  onDelete: (product: Product) => void; // Trigger for delete dialog
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
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: '1000px' }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox />
              </TableCell>
              <TableCell>Product Name</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Stock Level</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              // Inventory logic for low stock warnings
              const isLowStock = Number(row.quantity_on_hand) <= Number(row.reorder_level);
              
              return (
                <TableRow hover key={row.product_id}>
                  <TableCell padding="checkbox">
                    <Checkbox />
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">{row.product_name}</Typography>
                  </TableCell>
                  <TableCell>{row.sku}</TableCell>
                  <TableCell>{row.category || 'Uncategorized'}</TableCell>
                  <TableCell>
                    {/* Currency formatting for Sydney market */}
                    {new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(row.unit_price)}
                  </TableCell>
                  <TableCell>{row.quantity_on_hand}</TableCell>
                  <TableCell>
                    <Chip
                      label={isLowStock ? 'Low Stock' : 'In Stock'}
                      color={isLowStock ? 'error' : 'success'}
                      size="small"
                      onClick={(e) => {e.preventDefault}}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Edit Product">
                        <IconButton onClick={() => onEdit(row)} size="small">
                          <PencilIcon size={20} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Product">
                        <IconButton 
                          onClick={() => onDelete(row)} 
                          color="error" 
                          size="small"
                        >
                          <TrashIcon size={20} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
            
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  No products found in the warehouse.
                </TableCell>
              </TableRow>
            )}
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
      />
    </Card>
  );
}