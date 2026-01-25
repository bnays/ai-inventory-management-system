"use client";

import * as React from 'react';
import { useEffect, useState } from 'react';
import { Grid, Box, CircularProgress, Typography, Stack, useTheme } from '@mui/material';
import { ChartPie, ShoppingCart, Users, TrendUp } from '@phosphor-icons/react';

import { Budget } from '@/components/dashboard/overview/budget';
import { LatestOrders } from '@/components/dashboard/overview/latest-orders';
import { LatestProducts } from '@/components/dashboard/overview/latest-products';
import { Sales } from '@/components/dashboard/overview/sales';
import { TasksProgress } from '@/components/dashboard/overview/tasks-progress';
import { TotalCustomers } from '@/components/dashboard/overview/total-customers';
import { TotalProfit } from '@/components/dashboard/overview/total-profit';
import { Traffic } from '@/components/dashboard/overview/traffic';
import { apiRequest } from '@/lib/api-client';

export default function Page(): React.JSX.Element {
  const theme = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await apiRequest('/dashboard/summary');
        setData(res.data || res);
      } catch (error) {
        console.error("Dashboard fetch failed", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading || !data) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 15, bgcolor: '#f9fafb', minHeight: '100vh' }}>
        <CircularProgress size={45} thickness={4} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Synchronizing Command Center data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f9fafb', minHeight: '100vh' }}>
      <Stack spacing={4}>

        {/* --- TOP ROW: KPI CARDS --- */}
        <Grid container spacing={3}>
          <Grid size={{ lg: 3, sm: 6, xs: 12 }}>
            <Budget diff={data.invDiff} trend="up" sx={{ height: '100%' }} value={`$${data.totalInventoryValue}k`} />
          </Grid>
          <Grid size={{ lg: 3, sm: 6, xs: 12 }}>
            <TotalCustomers diff={data.custDiff} trend="down" sx={{ height: '100%' }} value={data.retailPartnerCount} />
          </Grid>
          <Grid size={{ lg: 3, sm: 6, xs: 12 }}>
            <TasksProgress sx={{ height: '100%' }} value={data.stockHealthScore} />
          </Grid>
          <Grid size={{ lg: 3, sm: 6, xs: 12 }}>
            <TotalProfit sx={{ height: '100%' }} value={`$${data.totalSalesRevenue}k`} />
          </Grid>
        </Grid>

        {/* --- MIDDLE ROW: ANALYTICS --- */}
        <Grid container spacing={3}>
          <Grid size={{ lg: 8, xs: 12 }}>
            <Sales chartSeries={data.salesChartSeries} sx={{ height: '100%' }} />
          </Grid>
          <Grid size={{ lg: 4, xs: 12 }}>
            <Traffic 
              chartSeries={data.categoryData} 
              labels={data.categoryLabels} 
              sx={{ height: '100%' }} 
            />
          </Grid>
        </Grid>

        {/* --- BOTTOM ROW: LOGISTICS LOGS --- */}
        <Grid container spacing={3}>
          <Grid size={{ lg: 4, md: 6, xs: 12 }}>
            <LatestProducts 
                products={data.recentProducts || []} // Use the correct key from your controller
                sx={{ height: '100%' }} 
            />
          </Grid>
          <Grid size={{ lg: 8, md: 6, xs: 12 }}>
            <LatestOrders 
              orders={data.recentTransactions || []} 
              sx={{ height: '100%' }} 
            />
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}