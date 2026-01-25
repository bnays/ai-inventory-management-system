'use client';

import * as React from 'react';
import { Stack, Typography, Box, useTheme } from '@mui/material';
import { Gear } from '@phosphor-icons/react';
import { UpdatePasswordForm } from '@/components/dashboard/settings/update-password-form';
import { useNotification } from '@/lib/notification';
import { GlobalSnackbar } from '@/components/core/global-snackbar';

export default function Page(): React.JSX.Element {
  const theme = useTheme();
  const { notification, hideNotification } = useNotification();

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f9fafb', minHeight: '100vh' }}>
      <Stack spacing={4}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ color: 'neutral.900', letterSpacing: '-0.02em' }}>
            Account Settings
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Gear size={18} weight="duotone" color={theme.palette.primary.main} />
            <Typography variant="body2" color="text.secondary" fontWeight="500">
              Manage your credentials and security preferences
            </Typography>
          </Stack>
        </Box>

        <Box sx={{ maxWidth: 'md' }}>
          <UpdatePasswordForm />
        </Box>
      </Stack>
      
      {/* Centralized Notification Portal */}
      <GlobalSnackbar state={notification} onClose={hideNotification} />
    </Box>
  );
}