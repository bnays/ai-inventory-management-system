import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const navItems = [
  { key: 'dashboard', title: 'Dashboard', href: paths.dashboard.overview, icon: 'chart-pie-slice' },
  { key: 'users', title: 'Users', href: paths.dashboard.users, icon: 'users-three' },
  { key: 'customers', title: 'Customers', href: paths.dashboard.customers, icon: 'address-book' },
  { key: 'products', title: 'Products', href: paths.dashboard.products, icon: 'package' },
  { key: 'restock', title: 'Restock Suggestions', href: paths.dashboard.restock, icon: 'lightbulb' },
  { key: 'ledger', title: 'Stock Ledger', href: paths.dashboard.ledger, icon: 'book-open' },
  { key: 'categories', title: 'Categories', href: paths.dashboard.categories, icon: 'squares-four' },
  { key: 'suppliers', title: 'Suppliers', href: paths.dashboard.suppliers, icon: 'truck' },
  { key: 'purchases', title: 'Purchases', href: paths.dashboard.purchases, icon: 'shopping-cart' },
  { key: 'sales', title: 'Sales', href: paths.dashboard.sales, icon: 'receipt' },
  { key: 'forecast', title: 'Forecast Data', href: paths.dashboard.forecast, icon: 'trend-up' },
  { key: 'settings', title: 'Settings', href: paths.dashboard.settings, icon: 'gear' },
  { key: 'account', title: 'Account', href: paths.dashboard.account, icon: 'user-circle' }
] satisfies NavItemConfig[];