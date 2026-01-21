import * as React from 'react';
import type { Viewport } from 'next';

import '@/styles/global.css';

import { UserProvider } from '@/contexts/user-context';
import { InventoryProvider } from '@/contexts/inventory-context';
import { LocalizationProvider } from '@/components/core/localization-provider';
import { ThemeProvider } from '@/components/core/theme-provider/theme-provider';
import { CategoryProvider } from '@/contexts/category-context';
import { SupplierProvider } from '@/contexts/supplier-context';
import { PurchaseProvider } from '@/contexts/purchase-context';
import { SaleProvider } from '@/contexts/sale-context';
// 1. Import your new Customer Context
import { CustomerProvider } from '@/contexts/customer-context'; 

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
                <CustomerProvider>
                  <PurchaseProvider>
                    <SaleProvider>
                      <InventoryProvider>
                        <ThemeProvider>
                          {children}
                        </ThemeProvider>
                      </InventoryProvider>
                    </SaleProvider>
                  </PurchaseProvider>
                </CustomerProvider>
              </SupplierProvider>
            </CategoryProvider>
          </UserProvider>
        </LocalizationProvider>
      </body>
    </html>
  );
}