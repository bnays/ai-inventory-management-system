'use client';

import * as React from 'react';
import type { Product } from '@/components/dashboard/products/products-table';
import { logger } from '@/lib/default-logger';

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
}

export const InventoryContext = React.createContext<InventoryContextValue | undefined>(undefined);

export function InventoryProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // Pagination State
  const [totalCount, setTotalCount] = React.useState(0);
  const [page, setPage] = React.useState(0); // MUI uses 0-based indexing
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  
  // Guard to prevent double fetches in Strict Mode
  const isFetching = React.useRef(false);

  const refreshInventory = React.useCallback(async () => {
    if (isFetching.current) return;
    
    isFetching.current = true;
    setIsLoading(true);

    try {
      const token = localStorage.getItem('custom-auth-token');
      // Backend expects 1-based page indexing
      const url = `http://localhost:3001/api/inventory?page=${page + 1}&limit=${rowsPerPage}`;
      
      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch inventory');
      
      const result = await response.json();
      
      // Ensure data matches your backend response { data: [], meta: { totalItems: X } }
      setProducts(result.data || []);
      setTotalCount(result.meta?.totalItems || 0);
      setError(null);
    } catch (err) {
      logger.error(err);
      setError('Could not load inventory data');
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  }, [page, rowsPerPage]);

  // Re-fetch automatically when page or limit changes
  React.useEffect(() => {
    refreshInventory();
  }, [refreshInventory]);

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
        refreshInventory 
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}