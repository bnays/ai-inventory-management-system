'use client';

import { apiRequest } from '@/lib/api-client';
import * as React from 'react';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  product_count?: number; // Add this line
  created_at?: string;
}

export interface CategoryContextValue {
  categories: Category[];
  isLoading: boolean;
  refreshCategories: () => Promise<void>;
  updateCategory: (id: number, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
}

export const CategoryContext = React.createContext<CategoryContextValue | undefined>(undefined);

export function CategoryProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const refreshCategories = React.useCallback(async () => {
    const token = localStorage.getItem('custom-auth-token');
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await apiRequest('/categories');
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

    const updateCategory = async (id: number, data: Partial<Category>) => {
        try {
            await apiRequest(`/categories/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
            });
            await refreshCategories(); // Refresh the list to show updated name/slug
        } catch (err) {
            console.error('Update failed:', err);
            throw err;
        }
    };

    const deleteCategory = async (id: number) => {
        try {
            await apiRequest(`/categories/${id}`, {
            method: 'DELETE',
            });
            // Refresh the list so the deleted category disappears from the table
            await refreshCategories(); 
        } catch (err: any) {
            console.error('Delete failed:', err);
            throw err; // Re-throw so the UI can show the error message
        }
    };

  React.useEffect(() => {
    refreshCategories();
  }, [refreshCategories]);

  return (
    <CategoryContext.Provider value={{ categories, isLoading, refreshCategories, updateCategory, deleteCategory }}>
      {children}
    </CategoryContext.Provider>
  );
}

export const useCategories = () => {
  const context = React.useContext(CategoryContext);
  if (!context) throw new Error('useCategories must be used within a CategoryProvider');
  return context;
};