import * as React from 'react';
import type { Viewport } from 'next';

import '@/styles/global.css';

import { UserProvider } from '@/contexts/user-context';
import { InventoryProvider } from '@/contexts/inventory-context';
import { LocalizationProvider } from '@/components/core/localization-provider';
import { ThemeProvider } from '@/components/core/theme-provider/theme-provider';
import { CategoryProvider } from '@/contexts/category-context';
import { SupplierProvider } from '@/contexts/supplier-context';

export const viewport = { width: 'device-width', initialScale: 1 } satisfies Viewport;

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps): React.JSX.Element {
  return (
    <html lang="en">
      <body>
        <LocalizationProvider>
          <UserProvider>
            <CategoryProvider>
                <SupplierProvider>
                    <InventoryProvider>
                        <ThemeProvider>
                        {children}
                        </ThemeProvider>
                    </InventoryProvider>
                </SupplierProvider>
            </CategoryProvider>
          </UserProvider>
        </LocalizationProvider>
      </body>
    </html>
  );
}