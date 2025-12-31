import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const navItems = [
  { key: 'dashboard', title: 'Dashboard', href: paths.dashboard.overview, icon: 'chart-pie' },
  { key: 'users', title: 'Users', href: paths.dashboard.customers, icon: 'users' },
  { key: 'products', title: 'Products', href: paths.dashboard.products, icon: 'users' },
  { key: 'categories', title: 'Categories', href: paths.dashboard.categories, icon: 'users' },
  { key: 'suppliers', title: 'Suppliers', href: paths.dashboard.suppliers, icon: 'users' },
  { key: 'purchases', title: 'Purchases', href: paths.dashboard.purchases, icon: 'users' },
  { key: 'sales', title: 'Sales', href: paths.dashboard.sales, icon: 'users' },
  { key: 'forecast', title: 'Forecast Data', href: paths.dashboard.forecast, icon: 'users' },
//   { key: 'integrations', title: 'Integrations', href: paths.dashboard.integrations, icon: 'plugs-connected' },
  { key: 'settings', title: 'Settings', href: paths.dashboard.settings, icon: 'gear-six' },
  { key: 'account', title: 'Account', href: paths.dashboard.account, icon: 'user' },
  { key: 'error', title: 'Error', href: paths.errors.notFound, icon: 'x-square' },
] satisfies NavItemConfig[];
