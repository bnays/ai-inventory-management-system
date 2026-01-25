'use client';

import * as React from 'react';
import { 
  Button, Stack, Typography, Box, useTheme, 
  CircularProgress, Paper 
} from '@mui/material';
import { 
  Plus as PlusIcon, 
  Truck, 
  ArrowClockwise 
} from '@phosphor-icons/react';
import { SuppliersTable } from '@/components/dashboard/suppliers/supplier-table';
import { AddSupplierModal } from '@/components/dashboard/suppliers/add-supplier-modal';
import { EditSupplierModal } from '@/components/dashboard/suppliers/edit-supplier-modal';
import { DeleteConfirmationDialog } from '@/components/dashboard/layout/delete-confimation-dialog';
import { useSuppliers, type Supplier } from '@/contexts/supplier-context';

export default function Page(): React.JSX.Element {
  const theme = useTheme();
  const { suppliers, isLoading, refreshSuppliers, deleteSupplier } = useSuppliers();

  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  const [selectedSupplier, setSelectedSupplier] = React.useState<Supplier | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    refreshSuppliers().catch(console.error);
  }, [refreshSuppliers]);

  const handleEditClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsEditOpen(true);
  };

  const handleDeleteClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsDeleteOpen(true);
  };

  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;
    setIsDeleting(true);
    try {
      await deleteSupplier(selectedSupplier.id);
      setIsDeleteOpen(false);
      setSelectedSupplier(null);
    } catch (err: any) {
      alert(err.message || "Cannot delete supplier. They may be linked to active orders.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f9fafb', minHeight: '100vh' }}>
      
      {/* --- PAGE HEADER --- */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ color: 'neutral.900', letterSpacing: '-0.02em' }}>
            Supplier Network
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Truck size={18} weight="duotone" color={theme.palette.primary.main} />
            <Typography variant="body2" color="text.secondary" fontWeight="500">
              Manage global and local distribution partners
            </Typography>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button 
            startIcon={<ArrowClockwise size={18} weight="bold" />} 
            variant="outlined" 
            onClick={() => refreshSuppliers()}
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
            Add Supplier
          </Button>
        </Stack>
      </Stack>

      {/* --- TABLE CONTAINER --- */}
      <Paper sx={{ borderRadius: 5, border: '1px solid #eaecf0', overflow: 'hidden', boxShadow: 'none' }}>
        <SuppliersTable 
          rows={suppliers} 
          isLoading={isLoading} 
          onEdit={handleEditClick} 
          onDelete={handleDeleteClick} 
        />
      </Paper>

      <AddSupplierModal open={isAddOpen} onClose={() => setIsAddOpen(false)} />
      
      <EditSupplierModal
        open={isEditOpen} 
        supplier={selectedSupplier} 
        onClose={() => {
          setIsEditOpen(false);
          setSelectedSupplier(null);
        }} 
      />

      <DeleteConfirmationDialog
        open={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          if (!isDeleting) setSelectedSupplier(null);
        }}
        onConfirm={handleDeleteSupplier}
        title="Remove Supplier?"
        content={`Warning: Removing "${selectedSupplier?.name}" will affect purchase history traceability.`}
        isLoading={isDeleting}
      />
    </Box>
  );
}