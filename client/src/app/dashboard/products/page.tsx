'use client';

import * as React from 'react';
import { 
  Button, Stack, Typography, Box, useTheme, 
  CircularProgress, Paper 
} from '@mui/material';
import { 
  Plus as PlusIcon, 
  Package, 
  ArrowClockwise 
} from '@phosphor-icons/react';
import { ProductsTable, type Product } from '@/components/dashboard/products/products-table';
import { useInventory } from '@/hooks/use-inventory';
import { AddProductModal } from '@/components/dashboard/products/add-product-modal';
import { DeleteConfirmationDialog } from '@/components/dashboard/layout/delete-confimation-dialog';
import { EditProductModal } from '@/components/dashboard/products/edit-product-modal';
import { useCategories } from '@/contexts/category-context';
import { useSuppliers } from '@/contexts/supplier-context';

export default function Page(): React.JSX.Element {
  const theme = useTheme();
  const { 
    products, isLoading, totalCount, page, rowsPerPage, 
    setPage, setRowsPerPage, refreshInventory, deleteProduct 
  } = useInventory();

  const { refreshCategories } = useCategories();
  const { refreshSuppliers } = useSuppliers();

  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      await Promise.all([
        refreshInventory(),
        refreshSuppliers(),
        refreshCategories(),
      ]);
    } catch (err) {
      console.error("Failed to load catalog data", err);
    }
  }, [refreshInventory, refreshSuppliers, refreshCategories]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;
    setIsDeleting(true);
    try {
      await deleteProduct(selectedProduct.product_id); 
      setIsDeleteOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to delete product.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh' }}>
      
      {/* --- PAGE HEADER --- */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ color: 'neutral.900', letterSpacing: '-0.02em' }}>
            Product Catalog
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Package size={18} weight="duotone" color={theme.palette.primary.main} />
            <Typography variant="body2" color="text.secondary" fontWeight="500">
              Manage inventory levels and SKU details
            </Typography>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button 
            startIcon={<ArrowClockwise size={18} weight="bold" />} 
            variant="outlined" 
            onClick={loadData}
            sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, bgcolor: 'white' }}
          >
            Refresh
          </Button>
          <Button 
            startIcon={<PlusIcon size={18} weight="bold" />} 
            variant="contained" 
            onClick={() => setIsAddOpen(true)}
            sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, px: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          >
            Add Product
          </Button>
        </Stack>
      </Stack>

      {/* --- TABLE CONTAINER --- */}
      <Paper sx={{ borderRadius: 5, border: '1px solid #eaecf0', overflow: 'hidden', boxShadow: 'none' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 2 }}>
            <CircularProgress size={35} thickness={4} />
            <Typography variant="body2" color="text.secondary">Retrieving stock data...</Typography>
          </Box>
        ) : (
          <ProductsTable
            count={totalCount}
            page={page}
            rows={products}
            rowsPerPage={rowsPerPage}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
            onEdit={(prod) => { setSelectedProduct(prod); setIsEditOpen(true); }}
            onDelete={(prod) => { setSelectedProduct(prod); setIsDeleteOpen(true); }}
          />
        )}
      </Paper>

      {/* Modals remain functionally identical but now benefit from global styles */}
      <AddProductModal open={isAddOpen} onClose={() => setIsAddOpen(false)} />
      <EditProductModal
        open={isEditOpen} 
        product={selectedProduct} 
        onClose={() => {
          setIsEditOpen(false);
          setSelectedProduct(null);
        }} 
      />
      <DeleteConfirmationDialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product?"
        content={`Danger: This permanently deletes "${selectedProduct?.product_name}" and its associated records.`}
        isLoading={isDeleting}
      />
    </Box>
  );
}