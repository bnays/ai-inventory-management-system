'use client';

import * as React from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { DownloadIcon } from '@phosphor-icons/react/dist/ssr/Download';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { UploadIcon } from '@phosphor-icons/react/dist/ssr/Upload';

import { useInventory } from '@/hooks/use-inventory';
import { ProductsTable } from '@/components/dashboard/products/products-table';

export default function Page(): React.JSX.Element {
  // Pull everything from your new Inventory Context
  const { 
    products, 
    isLoading, 
    totalCount, 
    page, 
    rowsPerPage, 
    setPage, 
    setRowsPerPage 
  } = useInventory();

  return (
    <Stack spacing={3}>
      {/* Header Section */}
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Inventory Management</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Button color="inherit" startIcon={<UploadIcon fontSize="var(--icon-fontSize-md)" />}>
              Import
            </Button>
            <Button color="inherit" startIcon={<DownloadIcon fontSize="var(--icon-fontSize-md)" />}>
              Export
            </Button>
          </Stack>
        </Stack>
        <div>
          <Button 
            startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />} 
            variant="contained"
          >
            Add Product
          </Button>
        </div>
      </Stack>

      {/* Main Table Section */}
      {isLoading ? (
        <Typography variant="body1" sx={{ textAlign: 'center', py: 5 }}>
          Loading your warehouse data...
        </Typography>
      ) : (
        <ProductsTable
          count={totalCount}
          page={page}
          rows={products}
          rowsPerPage={rowsPerPage}
          // Connect the table actions to context state setters
          onPageChange={(event: unknown, newPage: number) => {
            setPage(newPage);
          }}
          onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setRowsPerPage(parseInt(event.target.value, 10));
          }}
        />
      )}
    </Stack>
  );
}