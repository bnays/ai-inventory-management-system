'use client';

import * as React from 'react';
import { Box, Grid, Stack, Typography, useTheme } from '@mui/material';
import { UserCircle } from '@phosphor-icons/react';
import { AccountDetailsForm } from '@/components/dashboard/account/account-details-form';
import { AccountInfo } from '@/components/dashboard/account/account-info';

export default function Page(): React.JSX.Element {
  const theme = useTheme();

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh' }}>
      <Stack spacing={4}>
        {/* --- PAGE HEADER --- */}
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ color: 'neutral.900', letterSpacing: '-0.02em' }}>
            Account Profile
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <UserCircle size={18} weight="duotone" color={theme.palette.primary.main} />
            <Typography variant="body2" color="text.secondary" fontWeight="500">
              Manage your personal identification and profile settings
            </Typography>
          </Stack>
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ lg: 4, md: 6, xs: 12 }}>
            <AccountInfo />
          </Grid>
          <Grid size={{ lg: 8, md: 6, xs: 12 }}>
            <AccountDetailsForm />
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}