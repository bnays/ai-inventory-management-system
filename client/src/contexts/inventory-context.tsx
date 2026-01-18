// src/contexts/inventory-context.tsx
'use client';

import * as React from 'react';
import type { Product } from '@/components/dashboard/products/products-table';
import { logger } from '@/lib/default-logger';
import { useUser } from '@/hooks/use-user';
import { apiRequest } from '@/lib/api-client';

export interface InventoryContextValue {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  page: number;
  rowsPerPage: number;
  setPage: (page: number) => void;
  setRowsPerPage: (rows: number) => void;
  refreshInventory: () => Promise<void>;
  addProduct: (data: any) => Promise<void>;
  updateProduct: (productId: string, data: Partial<Product>) => Promise<void>;
  updateStock: (productId: string, quantityChange: number) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
}

export const InventoryContext = React.createContext<InventoryContextValue | undefined>(undefined);

export function InventoryProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [totalCount, setTotalCount] = React.useState(0);
  const [page, setPage] = React.useState(0); 
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  
  const { user } = useUser();
  const isFetching = React.useRef(false);

  // Fetch Inventory Data
  const refreshInventory = React.useCallback(async () => {
    if (isFetching.current) return;
    
    isFetching.current = true;
    setIsLoading(true);

    try {
      const endpoint = `/inventory?page=${page + 1}&limit=${rowsPerPage}`;
      const result = await apiRequest(endpoint);
      
      if (result) {
        console.log(result, "Inventory data fetched");
        setProducts(result.data || []);
        setTotalCount(result.meta?.totalItems || 0);
        setError(null);
      }
    } catch (err: any) {
      logger.error(err);
      setError('Could not load inventory data');
      setProducts([]); 
      throw err; 
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  }, [page, rowsPerPage]);

  const addProduct = async (data: any) => {
    try {
        await apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify(data),
        });
        await refreshInventory(); // Refresh the list to show the new product
    } catch (err: any) {
        logger.error('Add product failed:', err);
        throw err;
    }
};

const updateProduct = async (productId: string, data: Partial<Product>) => {
  try {
    // Matches your backend route: PATCH /api/products/:id
    await apiRequest(`/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    await refreshInventory(); // Refresh the table to show updated name/price
  } catch (err: any) {
    logger.error('Product update failed:', err);
    throw err;
  }
};

  // NEW: Logic for Atomic Stock Updates
  const updateStock = async (productId: string, quantityChange: number) => {
    try {
      await apiRequest(`/inventory/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity_change: quantityChange }),
      });
      await refreshInventory(); // Sync UI with database
    } catch (err: any) {
      logger.error('Stock update failed:', err);
      throw err;
    }
  };

  // NEW: Logic for Transaction-Safe Deletions
  const deleteProduct = async (productId: string) => {
    try {
      // Calls backend logic that removes inventory before product
      await apiRequest(`/products/${productId}`, {
        method: 'DELETE',
      });
      await refreshInventory(); // Sync UI with database
    } catch (err: any) {
      logger.error('Product delete failed:', err);
      throw err;
    }
  };

  React.useEffect(() => {
    if (user) {
      refreshInventory().catch(() => {});
    }
  }, [refreshInventory, user]);

  return (
    <InventoryContext.Provider 
      value={{ 
        products, 
        isLoading, 
        error, 
        totalCount, 
        page, 
        rowsPerPage, 
        setPage, 
        setRowsPerPage, 
        refreshInventory,
        addProduct,
        updateProduct,
        updateStock,
        deleteProduct
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}