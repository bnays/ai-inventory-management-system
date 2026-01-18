// src/contexts/supplier-context.tsx
'use client';

import * as React from 'react';
import { apiRequest } from '@/lib/api-client';

export interface Supplier {
  id: number;
  name: string;
  phone_number: string;
  email: string;
  address: string;
  payment_method: string;
  payment_details: string;
  created_at: string;
}

export interface SupplierContextValue {
  suppliers: Supplier[];
  isLoading: boolean;
  refreshSuppliers: () => Promise<void>;
  updateSupplier: (id: number, data: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: number) => Promise<void>;
}

export const SupplierContext = React.createContext<SupplierContextValue | undefined>(undefined);

export function SupplierProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const refreshSuppliers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await apiRequest('/suppliers');
      if (result) setSuppliers(result || []);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
      // This will trigger the dashboard error boundary
      throw err; 
    } finally {
      setIsLoading(false);
    }
  }, []);


    const updateSupplier = async (id: number, data: Partial<Supplier>) => {
        try {
            await apiRequest(`/suppliers/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
            });
            await refreshSuppliers(); // Sync the table after update
        } catch (err) {
            console.error('Update failed:', err);
            throw err;
        }
    };

    const deleteSupplier = async (id: number) => {
        try {
            await apiRequest(`/suppliers/${id}`, { method: 'DELETE' });
            await refreshSuppliers(); // Updates the UI automatically
        } catch (err: any) {
            console.error('Supplier delete failed:', err);
            throw err;
        }
    };

  return (
    <SupplierContext.Provider value={{ suppliers, isLoading, refreshSuppliers, updateSupplier, deleteSupplier }}>
      {children}
    </SupplierContext.Provider>
  );
}

export const useSuppliers = () => {
  const context = React.useContext(SupplierContext);
  if (!context) throw new Error('useSuppliers must be used within SupplierProvider');
  return context;
};