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
} from '@mui/material';

export interface Product {
  product_id: string;
  product_name: string;
  sku: string;
  category: string;
  unit_price: number;
  quantity_on_hand: number;
  reorder_level: number;
}

interface ProductsTableProps {
  count?: number;
  page?: number;
  rows?: Product[];
  rowsPerPage?: number;
  // ADD THESE TWO PROPS TO FIX THE ERROR
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProductsTable({
  count = 0,
  rows = [],
  page = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
}: ProductsTableProps): React.JSX.Element {
  return (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: '800px' }}>
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
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const isLowStock = row.quantity_on_hand <= row.reorder_level;
              
              return (
                <TableRow hover key={row.product_id}>
                  <TableCell padding="checkbox">
                    <Checkbox />
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">{row.product_name}</Typography>
                  </TableCell>
                  <TableCell>{row.sku}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell>${Number(row.unit_price).toFixed(2)}</TableCell>
                  <TableCell>{row.quantity_on_hand}</TableCell>
                  <TableCell>
                    <Chip
                      label={isLowStock ? 'Low Stock' : 'In Stock'}
                      color={isLowStock ? 'error' : 'success'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  No products found in the warehouse.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
      <Divider />
      {/* CONNECT TO THE PROPS FROM CONTEXT */}
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