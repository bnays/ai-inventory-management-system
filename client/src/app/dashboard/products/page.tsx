// src/app/dashboard/products/page.tsx
'use client';

import * as React from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { ProductsTable, type Product } from '@/components/dashboard/products/products-table';
import { useInventory } from '@/hooks/use-inventory';
import { AddProductModal } from '@/components/dashboard/products/add-product-modal';
import { DeleteConfirmationDialog } from '@/components/dashboard/layout/delete-confimation-dialog';
import { EditProductModal } from '@/components/dashboard/products/edit-product-modal';
import { useCategories } from '@/contexts/category-context';
import { useSuppliers } from '@/contexts/supplier-context';

export default function Page(): React.JSX.Element {
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

  // Inside Page component state
const [isEditOpen, setIsEditOpen] = React.useState(false);

  React.useEffect(() => {
    refreshInventory().catch(console.error);
    refreshCategories().catch(console.error);
    const loadData = async () => {
      try {
        await Promise.all([
          refreshInventory(),
          refreshSuppliers(),
          refreshCategories(),
        ]);
      } catch (err) {
        console.error("Failed to load catalog data", err);
      }
    };
    
    loadData();
  }, [refreshInventory, refreshCategories, refreshSuppliers]);

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;
    setIsDeleting(true);
    try {
      // Uses your backend transaction-safe logic
      await deleteProduct(selectedProduct.product_id); 
      setIsDeleteOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to delete product. Transaction rolled back.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3} sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h4">Product Catalog</Typography>
        <Button startIcon={<PlusIcon />} variant="contained" onClick={() => setIsAddOpen(true)}>
          Add Product
        </Button>
      </Stack>

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
        content={`Danger: This permanently deletes "${selectedProduct?.product_name}" and its inventory records.`}
        isLoading={isDeleting}
      />
    </Stack>
  );
}