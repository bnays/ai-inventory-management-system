import * as React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { apiRequest } from '@/lib/api-client';
import Page from './page';

// The AI-generated dashboard page only needs to fetch and forward summary data
// to these already-existing widgets; the widgets themselves are given/fixed.
jest.mock('@/lib/api-client', () => ({
  apiRequest: jest.fn(),
}));

// react-apexcharts requires browser APIs (canvas/SVG measurement, ResizeObserver)
// that jsdom doesn't implement. Stub the app's Chart wrapper so we can inspect
// exactly what data the page forwards to it, without depending on the charting
// library's internals.
jest.mock('@/components/core/chart', () => ({
  Chart: (props: { series: unknown; options?: { labels?: string[] }; type: string }) => (
    <div
      data-testid={`chart-${props.type}`}
      data-series={JSON.stringify(props.series)}
      data-option-labels={JSON.stringify(props.options?.labels ?? [])}
    />
  ),
}));

// LatestOrders calls useRouter(), which requires a mounted Next.js app router
// that doesn't exist in a plain RTL render.
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

function renderPage() {
  const theme = createTheme();
  return render(
    <ThemeProvider theme={theme}>
      <Page />
    </ThemeProvider>
  );
}

const fullSummary = {
  totalInventoryValue: '153.3',
  retailPartnerCount: 6,
  stockHealthScore: 56,
  totalSalesRevenue: '6801.4',
  invDiff: 12,
  invTrend: 'up',
  custDiff: 8,
  custTrend: 'up',
  categoryData: [2956800, 173005.8, 104849.14, 13340, 11426.8],
  categoryLabels: ['Networking', 'Furniture', 'Electronics', 'Tobacoo', 'Office Supplies'],
  salesChartSeries: [
    { name: 'This year', data: [636.8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { name: 'Last year', data: [0, 0, 0, 0, 0, 0, 0, 0, 400.9, 512.6, 519.3, 535.3] },
  ],
  recentTransactions: [
    {
      id: '534',
      customer: { name: 'Sydney Retail Collective' },
      amount: 170910,
      status: 'Completed',
      createdAt: '2026-01-28T03:21:19.000Z',
    },
  ],
  recentProducts: [
    {
      id: 20,
      name: 'Sit-Stand Dual Motor Frame',
      sku: 'DSK-020',
      quantity_on_hand: 1,
      reorder_level: 5,
    },
  ],
};

describe('Dashboard Page (FE1)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('shows a loading state, then requests /dashboard/summary and renders the fetched KPIs, charts, and tables', async () => {
    let resolveFetch: (value: unknown) => void;
    mockApiRequest.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    renderPage();

    // Loading state is shown while the request is in flight.
    expect(screen.getByText(/synchronizing/i)).toBeInTheDocument();
    expect(mockApiRequest).toHaveBeenCalledWith('/dashboard/summary');
    expect(mockApiRequest).toHaveBeenCalledTimes(1);

    // Resolve with the real backend response shape: { success, data: {...} }.
    resolveFetch!({ success: true, data: fullSummary });

    await waitFor(() => {
      expect(screen.queryByText(/synchronizing/i)).not.toBeInTheDocument();
    });

    // KPI cards render the values from the response, correctly formatted.
    expect(screen.getByText('$153.3k')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('56%')).toBeInTheDocument();
    expect(screen.getByText('$6801.4k')).toBeInTheDocument();

    // Sales (bar) and Traffic (donut) charts receive the correct series/labels.
    const barChart = screen.getByTestId('chart-bar');
    expect(JSON.parse(barChart.dataset.series!)).toEqual(fullSummary.salesChartSeries);

    const donutChart = screen.getByTestId('chart-donut');
    expect(JSON.parse(donutChart.dataset.optionLabels!)).toEqual(fullSummary.categoryLabels);

    // Latest products / recent transactions widgets render the fetched rows.
    expect(screen.getByText('Sit-Stand Dual Motor Frame')).toBeInTheDocument();
    expect(screen.getByText('Sydney Retail Collective')).toBeInTheDocument();
  });

  test('renders empty states instead of crashing when recentProducts/recentTransactions are missing from the response', async () => {
    const { recentProducts, recentTransactions, ...summaryWithoutLists } = fullSummary;
    mockApiRequest.mockResolvedValue({ success: true, data: summaryWithoutLists });

    renderPage();

    await waitFor(() => {
      expect(screen.queryByText(/synchronizing/i)).not.toBeInTheDocument();
    });

    // LatestProducts falls back to its own empty-state copy.
    expect(screen.getByText('No recent stock additions found.')).toBeInTheDocument();

    // LatestOrders renders its table with a header row only, no data rows, no crash.
    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(1);
  });
});
