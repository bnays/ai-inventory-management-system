import * as React from 'react';
import type { Metadata, Viewport } from 'next'; // Added Metadata import

import '@/styles/global.css';

import { UserProvider } from '@/contexts/user-context';
import { InventoryProvider } from '@/contexts/inventory-context';
import { LocalizationProvider } from '@/components/core/localization-provider';
import { ThemeProvider } from '@/components/core/theme-provider/theme-provider';
import { CategoryProvider } from '@/contexts/category-context';
import { SupplierProvider } from '@/contexts/supplier-context';
import { PurchaseProvider } from '@/contexts/purchase-context';
import { SaleProvider } from '@/contexts/sale-context';
import { CustomerProvider } from '@/contexts/customer-context';

// 1. Define your Metadata
export const metadata: Metadata = {
  title: 'Logix Warehouse Management System',
  description: 'AI-driven inventory forecasting and warehouse management system.',
  icons: {
    icon: '/assets/favicon/favicon.ico', 
    shortcut: '/assets/favicon/favicon-16x16.png',
    apple: '/assets/favicon/apple-touch-icon.png',
  },
};

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