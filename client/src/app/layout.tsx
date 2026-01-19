import * as React from 'react';
import type { Viewport } from 'next';

import '@/styles/global.css';

import { UserProvider } from '@/contexts/user-context';
import { InventoryProvider } from '@/contexts/inventory-context';
import { LocalizationProvider } from '@/components/core/localization-provider';
import { ThemeProvider } from '@/components/core/theme-provider/theme-provider';
import { CategoryProvider } from '@/contexts/category-context';
import { SupplierProvider } from '@/contexts/supplier-context';
// Import your new contexts
import { PurchaseProvider } from '@/contexts/purchase-context';
import { SaleProvider } from '@/contexts/sale-context';

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
                {/* Purchase and Sale providers sit here to manage stock flow */}
                <PurchaseProvider>
                  <SaleProvider>
                    <InventoryProvider>
                      <ThemeProvider>
                        {children}
                      </ThemeProvider>
                    </InventoryProvider>
                  </SaleProvider>
                </PurchaseProvider>
              </SupplierProvider>
            </CategoryProvider>
          </UserProvider>
        </LocalizationProvider>
      </body>
    </html>
  );
}