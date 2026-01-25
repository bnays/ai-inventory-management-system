'use client';

import * as React from 'react';
import { 
  Box, Card, Table, TableBody, TableCell, TableHead, 
  TableRow, Typography, CircularProgress, 
  Tooltip, IconButton, Avatar, Stack
} from '@mui/material';
import { PencilSimple as PencilIcon, Trash as TrashIcon, Tag } from '@phosphor-icons/react';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  product_count?: number;
  created_at?: string;
}

interface CategoriesTableProps {
  rows?: Category[];
  isLoading?: boolean;
  onEdit: (category: Category) => void;
  onDelete?: (category: Category) => void;
}

export function CategoriesTable({ rows = [], isLoading, onEdit, onDelete }: CategoriesTableProps): React.JSX.Element {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 2 }}>
        <CircularProgress size={35} thickness={4} />
        <Typography variant="body2" color="text.secondary">Loading taxonomy...</Typography>
      </Box>
    );
  }

  const safeRows = Array.isArray(rows) ? rows : [];

  return (
    <Card sx={{ border: 'none', boxShadow: 'none' }}>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: '800px' }}>
          <TableHead sx={{ bgcolor: '#fcfcfd' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Categories</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>System Slug</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>SKU Association</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Date Created</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {safeRows.map((category) => (
              <TableRow hover key={category.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: 'primary.50', color: 'primary.main', fontWeight: 'bold', fontSize: '0.875rem' }}>
                      {category.name.charAt(0)}
                    </Avatar>
                    <Typography variant="body2" fontWeight="600">{category.name}</Typography>
                  </Stack>
                </TableCell>
                <TableCell sx={{ maxWidth: 250 }}>
                  <Typography variant="body2" color="text.secondary" noWrap title={category.description || ''}>
                    {category.description || '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'neutral.500' }}>
                    {category.slug}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Tag size={16} weight="duotone" />
                    <Typography variant="body2" fontWeight="600">
                      {category.product_count || 0} Products
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {category.created_at ? new Date(category.created_at).toLocaleDateString('en-AU') : 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Modify Category">
                      <IconButton 
                        onClick={() => onEdit(category)}
                        size="small"
                        sx={{ color: 'primary.main', bgcolor: 'primary.50', '&:hover': { bgcolor: 'primary.100' } }}
                      >
                        <PencilIcon size={18} weight="bold" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove Category">
                      <IconButton 
                        onClick={() => onDelete?.(category)}
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
                  <Typography variant="body2" color="text.secondary">
                    No warehouse categories established yet.
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