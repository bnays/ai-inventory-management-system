'use client';

import * as React from 'react';
import { 
  Box, Card, CardHeader, Divider, Table, TableBody, TableCell, 
  TableHead, TableRow, Typography, Chip, IconButton, Tooltip, Stack 
} from '@mui/material';
import { Eye as EyeIcon } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

const statusMap = {
  Completed: { label: 'Completed', color: 'success' },
  Pending: { label: 'Pending', color: 'warning' },
  Cancelled: { label: 'Cancelled', color: 'error' },
} as const;

export function LatestOrders({ orders = [], sx }: { orders: any[], sx?: any }) {
  const router = useRouter();

  // Calculate average for trend indicators
  const averageValue = React.useMemo(() => {
    if (orders.length === 0) return 0;
    const total = orders.reduce((sum, order) => sum + (Number(order.amount) || 0), 0);
    return total / orders.length;
  }, [orders]);

  return (
    <Card sx={{ ...sx, borderRadius: 5, border: '1px solid #eaecf0', boxShadow: 'none' }}>
      <CardHeader 
        title={<Typography variant="h6" fontWeight="800">Recent Transactions</Typography>}
        subheader="Real-time fulfillment metrics vs. Warehouse average" 
      />
      <Divider />
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 600 }}>
          <TableHead sx={{ bgcolor: '#fcfcfd' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Order ID</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Amount (AUD)</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => {
              const status = statusMap[order.status as keyof typeof statusMap] ?? { label: 'COMPLETED', color: 'success' };
              
              // Validate and parse the amount to prevent $NaN
              const orderAmount = Number(order.amount) || 0;

              return (
                <TableRow key={order.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="700">#{order.id}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(order.createdAt).format('DD MMM')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="600">{order.customer?.name || 'Walk-in'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" fontWeight="800">
                        ${orderAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={status.label.toUpperCase()} 
                      color={status.color as any} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontWeight: 800, fontSize: '0.65rem', borderRadius: 1.5 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small" 
                      onClick={() => router.push(`/dashboard/sales/${order.id}`)}
                      sx={{ color: 'primary.main', bgcolor: 'primary.50' }}
                    >
                      <EyeIcon size={18} weight="bold" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </Card>
  );
}