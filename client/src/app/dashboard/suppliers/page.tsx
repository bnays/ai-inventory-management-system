// src/app/dashboard/suppliers/page.tsx
'use client';

import * as React from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { SuppliersTable } from '@/components/dashboard/suppliers/supplier-table';
import { AddSupplierModal } from '@/components/dashboard/suppliers/add-supplier-modal';
import { EditSupplierModal } from '@/components/dashboard/suppliers/edit-supplier-modal';
import { DeleteConfirmationDialog } from '@/components/dashboard/layout/delete-confimation-dialog';
import { useSuppliers, type Supplier } from '@/contexts/supplier-context';

export default function Page(): React.JSX.Element {
  // Context functions and data
  const { suppliers, isLoading, refreshSuppliers, deleteSupplier } = useSuppliers();

  // Modal visibility states
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  // Data and Action states
  const [selectedSupplier, setSelectedSupplier] = React.useState<Supplier | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Fetch data on component mount
  React.useEffect(() => {
    refreshSuppliers().catch(console.error);
  }, [refreshSuppliers]);

  // Handler for Edit button in Table
  const handleEditClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsEditOpen(true);
  };

  // Handler to trigger the Delete Dialog
  const handleDeleteClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsDeleteOpen(true);
  };

  // Logic to execute the actual API call
  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;
    
    setIsDeleting(true);
    try {
      await deleteSupplier(selectedSupplier.id);
      setIsDeleteOpen(false);
      setSelectedSupplier(null);
    } catch (err: any) {
      // Handles MySQL relational errors if active orders exist
      alert(err.message || "Cannot delete supplier. They may be linked to active orders.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4">Suppliers</Typography>
        <Button 
          onClick={() => setIsAddOpen(true)}
          startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />} 
          variant="contained"
        >
          Add Supplier
        </Button>
      </Stack>

      {/* Main Table */}
      <SuppliersTable 
        rows={suppliers} 
        isLoading={isLoading} 
        onEdit={handleEditClick} 
        onDelete={handleDeleteClick} 
      />

      {/* Add Modal */}
      <AddSupplierModal 
        open={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
      />
      
      {/* Edit Modal */}
      <EditSupplierModal
        open={isEditOpen} 
        supplier={selectedSupplier} 
        onClose={() => {
          setIsEditOpen(false);
          setSelectedSupplier(null);
        }} 
      />

      {/* Reusable Delete Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          if (!isDeleting) setSelectedSupplier(null);
        }}
        onConfirm={handleDeleteSupplier}
        title="Remove Supplier?"
        content={`Are you sure you want to remove "${selectedSupplier?.name}"?`}
        isLoading={isDeleting}
      />
    </Stack>
  );
}