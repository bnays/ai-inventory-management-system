import * as React from 'react';
import { InventoryContext, type InventoryContextValue } from '@/contexts/inventory-context';

export function useInventory(): InventoryContextValue {
  const context = React.useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}