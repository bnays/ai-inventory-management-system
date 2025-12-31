export const paths = {
  home: '/',
  auth: { signIn: '/auth/sign-in', signUp: '/auth/sign-up', resetPassword: '/auth/reset-password' },
  dashboard: {
    overview: '/dashboard',
    account: '/dashboard/account',
    customers: '/dashboard/customers',
    products: '/dashboard/products',
    categories: '/dashboard/categories',
    suppliers: '/dashboard/suppliers',
    purchases: '/dashboard/purchases',
    sales: '/dashboard/sales',
    forecast: '/dashboard/forecast',
    integrations: '/dashboard/integrations',
    settings: '/dashboard/settings',
  },
  errors: { notFound: '/errors/not-found' },
} as const;
