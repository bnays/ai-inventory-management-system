'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Box, Typography, Grid, Card, CardContent, CircularProgress, 
  Stack, Divider, Chip, Paper, useTheme, Button, IconButton
} from '@mui/material';
import { 
  ChartLineUp, 
  Calendar, 
  Files, 
  DownloadSimple, 
  WarningCircle, 
  CheckCircle,
  CaretLeft,
  Brain
} from '@phosphor-icons/react';
import dynamic from 'next/dynamic';
import { apiRequest } from '@/lib/api-client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function ProductForecastDetail() {
  const { sku } = useParams();
  const theme = useTheme();
  const router = useRouter();
  const reportRef = React.useRef<HTMLDivElement>(null);
  
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchForecast = async () => {
        setLoading(true); 
        setData(null);
        setError(null);
      try {
        const result = await apiRequest(`/inventory/forecast/${sku}`);
        setData(result);
      } catch (err: any) {
        setError(err.message || "Failed to communicate with AI engine");
      } finally {
        setLoading(false);
      }
    };
    if (sku) fetchForecast();
  }, [sku]);

  // --- PDF EXPORT (PROFESSIONAL PADDING LOGIC) ---
  const downloadPDF = async () => {
    const element = reportRef.current;
    if (!element) return;

    // 1. Create a clone to manipulate styles for the export
    const clone = element.cloneNode(true) as HTMLElement;
    
    // 2. Apply "Document-Style" padding (e.g., 40px) to the clone
    clone.style.padding = "40px"; 
    clone.style.width = "1100px"; // Set a stable width for high-res capture
    clone.style.backgroundColor = "#ffffff";
    
    // 3. Temporarily attach to the DOM (off-screen) for html2canvas
    clone.style.position = "absolute";
    clone.style.top = "-9999px";
    document.body.appendChild(clone);

    try {
      const canvas = await html2canvas(clone, { 
        scale: 2, // High DPI for crisp text and charts
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // 4. Place image into the PDF
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`LogixWarehouse_Forecast_${sku}.pdf`);
    } finally {
      document.body.removeChild(clone); // Cleanup
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 15, minHeight: '100vh' }}>
      <CircularProgress size={45} thickness={4} />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Synchronizing with Forecasting engine...</Typography>
    </Box>
  );
  
  if (error) return (
    <Box sx={{ p: 5, textAlign: 'center', minHeight: '100vh', }}>
      <WarningCircle size={48} color={theme.palette.error.main} weight="duotone" />
      <Typography variant="h5" fontWeight="800" sx={{ mt: 2, mb: 1 }}>Forecasting Unavailable</Typography>
      <Typography color="text.secondary">{error}</Typography>
      <Button onClick={() => router.back()} sx={{ mt: 3 }}>Return to Overview</Button>
    </Box>
  );

  const commonOptions: any = {
    chart: { toolbar: { show: false }, fontFamily: theme.typography.fontFamily },
    stroke: { curve: 'smooth', width: 3 },
    markers: { size: 4, strokeWidth: 0, hover: { size: 6 } },
    grid: { borderColor: '#f2f4f7', strokeDashArray: 4 },
    dataLabels: { enabled: false }
  };

  return (
    <Box sx={{ p: 4, minHeight: '100vh' }}>
      <Box ref={reportRef}>
        
        {/* --- HEADER --- */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
          <IconButton 
            onClick={() => router.back()} 
            sx={{ bgcolor: 'white', border: '1px solid #eaecf0', borderRadius: 2 }}
          >
            <CaretLeft size={20} weight="bold" />
          </IconButton>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" sx={{ width: '100%' }} spacing={2} alignItems={{ sm: 'center' }}>
            <Box>
                <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: '-0.02em', color: 'neutral.900' }}>
                    {data.productName}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Brain size={18} weight="duotone" color={theme.palette.primary.main} />
                  <Typography variant="body2" color="text.secondary" fontWeight="600">
                    SKU: {sku} • AI Predictive Analytics
                  </Typography>
                </Stack>
            </Box>
            
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Chip 
                icon={data.accuracy > 75 ? <CheckCircle size={16} weight="bold" /> : <WarningCircle size={16} weight="bold" />}
                label={`${data.accuracy}% Confidence`} 
                sx={{ 
                  fontWeight: 800, 
                  bgcolor: data.accuracy > 75 ? 'success.50' : 'warning.50',
                  color: data.accuracy > 75 ? 'success.main' : 'warning.main',
                  border: '1px solid',
                  borderColor: data.accuracy > 75 ? 'success.200' : 'warning.200'
                }}
              />
              <Button 
                variant="contained" 
                startIcon={<DownloadSimple size={18} weight="bold" />} 
                onClick={downloadPDF}
                sx={{ borderRadius: 2.5, fontWeight: 700, px: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              >
                Export PDF
              </Button>
            </Stack>
          </Stack>
        </Stack>

        {/* --- KPI SECTION --- */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { label: 'Weekly Velocity', value: data.daily.reduce((a:any, b:any) => a + b.predicted_sales, 0), icon: <ChartLineUp size={28} weight="duotone" />, color: theme.palette.primary.main },
            { label: 'Monthly Forecast', value: Math.round(data.monthly[0]?.predicted_sales || 0), icon: <Calendar size={28} weight="duotone" />, color: theme.palette.success.main },
            { label: 'Annual Target', value: data.yearly[0]?.predicted_sales, icon: <Files size={28} weight="duotone" />, color: theme.palette.warning.main },
          ].map((kpi, i) => (
            <Grid size={{ lg: 4, md: 4, xs: 12 }} key={i}>
              <Card sx={{ borderRadius: 5, border: '1px solid #eaecf0', boxShadow: 'none' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                  <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: `${kpi.color}10`, color: kpi.color, mr: 2.5, display: 'flex' }}>
                    {kpi.icon}
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</Typography>
                    <Typography variant="h4" fontWeight="900" sx={{ color: 'neutral.900' }}>
                        {kpi.value.toLocaleString()} <Typography variant="caption" component="span" sx={{ fontWeight: 600, color: 'text.secondary' }}>UNITS</Typography>
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ lg: 6, sm: 6, xs: 12 }}>
            <Card sx={{ borderRadius: 4, p: 2 }}>
              <Typography variant="subtitle1" fontWeight="800" sx={{ p: 2 }}>Daily Forecast</Typography>
              <Divider sx={{ mb: 2 }} />
              <Chart 
                options={{ ...commonOptions, xaxis: { categories: data.daily.map((d: any) => d.date) }, colors: [theme.palette.primary.main] }} 
                series={[{ name: 'Predicted Sales', data: data.daily.map((d: any) => d.predicted_sales) }]} 
                type="line" height={350} 
              />
            </Card>
          </Grid>
          <Grid size={{ lg: 6, sm: 6, xs: 12 }}>
            <Card sx={{ borderRadius: 4, p: 2 }}>
              <Typography variant="subtitle1" fontWeight="800" sx={{ p: 2 }}>Monthly Forecast</Typography>
              <Divider sx={{ mb: 2 }} />
              <Chart 
                options={{ ...commonOptions, chart: { ...commonOptions.chart, type: 'bar' }, xaxis: { categories: data.monthly.map((m: any) => m.label) }, colors: [theme.palette.success.main] }} 
                series={[{ name: 'Predicted Sales', data: data.monthly.map((m: any) => m.predicted_sales) }]} 
                type="bar" height={350} 
              />
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}