'use client';

import * as React from 'react';
import { 
  Card, CardContent, CardHeader, Stack, Typography, Box, useTheme 
} from '@mui/material';
import type { SxProps } from '@mui/material/styles';
import type { ApexOptions } from 'apexcharts';
import { Chart } from '@/components/core/chart';

export interface TrafficProps {
  chartSeries: number[]; // Should be pre-calculated percentages
  labels: string[];
  sx?: SxProps;
}

export function Traffic({ chartSeries, labels, sx }: TrafficProps): React.JSX.Element {
  const chartOptions = useChartOptions(labels);

  // Normalize data for display if backend sends raw numbers
  const total = chartSeries.reduce((a, b) => a + b, 0);
  const normalizedSeries = chartSeries.map(val => total > 0 ? Number(((val / total) * 100).toFixed(1)) : 0);

  return (
    <Card sx={{ ...sx, display: 'flex', flexDirection: 'column' }}>
      <CardHeader title="Top 5 Selling Categories" />
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Stack spacing={3}>
          {/* Increased chart height to accommodate labels below */}
          <Chart height={280} options={chartOptions} series={normalizedSeries} type="donut" width="100%" />
          
          {/* Use Grid-like wrap to prevent the "Messed Up" horizontal overflow */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', 
            gap: 2, 
            textAlign: 'center' 
          }}>
            {normalizedSeries.map((item, index) => (
              <Stack key={labels[index]} spacing={0.5}>
                <Typography 
                  variant="caption" 
                  fontWeight="bold" 
                  sx={{ 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    display: 'block' 
                  }}
                  title={labels[index]}
                >
                  {labels[index]}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {item}%
                </Typography>
              </Stack>
            ))}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function useChartOptions(labels: string[]): ApexOptions {
  const theme = useTheme();

  return {
    chart: { background: 'transparent' },
    // Expanded color palette for 5 categories
    colors: [
      theme.palette.primary.main, 
      theme.palette.success.main, 
      theme.palette.warning.main, 
      theme.palette.error.main, 
      theme.palette.info.main
    ],
    dataLabels: { enabled: false },
    labels,
    legend: { show: false },
    plotOptions: { pie: { donut: { size: '75%' } } },
    stroke: { width: 0 },
    theme: { mode: theme.palette.mode },
    tooltip: { 
      y: { formatter: (value: number) => `${value}%` } 
    },
  };
}