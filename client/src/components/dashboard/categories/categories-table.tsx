// src/components/dashboard/categories/categories-table.tsx

'use client';

import * as React from 'react';
import { 
  Box, Card, Table, TableBody, TableCell, TableHead, 
  TableRow, Typography, CircularProgress, 
  Tooltip,
  IconButton
} from '@mui/material';
import { PencilIcon } from '@phosphor-icons/react/dist/ssr/Pencil';
import { Trash as TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash'; // Add this import

// Updated interface to include the new description column
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  product_count?: number; // Add this line
  created_at?: string;
}

interface CategoriesTableProps {
  rows?: Category[]; // Made optional to prevent crashes if undefined
  isLoading?: boolean;
  onEdit: (category: Category) => void;
  onDelete?: (category: Category) => void;
}

export function CategoriesTable({ rows = [], isLoading, onEdit, onDelete }: CategoriesTableProps): React.JSX.Element {
  // 1. Loading State Guard
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // 2. Data Type Guard: Ensures rows is always an array before mapping
  const safeRows = Array.isArray(rows) ? rows : [];

  return (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: '800px' }}>
          <TableHead>
            <TableRow>
              <TableCell>Category Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell>Total Products</TableCell>
              <TableCell>Created Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {safeRows.map((category) => (
              <TableRow hover key={category.id}>
                <TableCell>
                  <Typography variant="subtitle2">{category.name}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {/* Safe access to description */}
                    {category.description || 'No description provided'}
                  </Typography>
                </TableCell>
                <TableCell>{category.slug}</TableCell>
                <TableCell>
                    <Typography variant="body2">
                        {category.product_count || 0} items
                    </Typography>
                </TableCell>
                <TableCell>
                  {/* AU Date format for your Sydney location */}
                  {category.created_at ? new Date(category.created_at).toLocaleDateString('en-AU') : 'N/A'}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit Category">
                    <IconButton onClick={() => onEdit(category)}>
                      <PencilIcon />
                    </IconButton>
                  </Tooltip>
                    <Tooltip title="Delete Category">
                        <IconButton 
                            onClick={() => onDelete?.(category)} // Optional chaining for safety
                            size="small" 
                            color="error" // Standard red color for danger
                        >
                            <TrashIcon size={20} />
                        </IconButton>
                    </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            
            {/* 3. Empty State Guard */}
            {safeRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" sx={{ py: 3 }}>
                    No categories found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    </Card>
  );
}