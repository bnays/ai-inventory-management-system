import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import { NotificationState } from '@/lib/notification';

interface GlobalSnackbarProps {
  state: NotificationState;
  onClose: () => void;
}

export function GlobalSnackbar({ state, onClose }: GlobalSnackbarProps) {
  return (
    <Snackbar
      open={state.open}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert onClose={onClose} severity={state.severity} variant="filled" sx={{ width: '100%' }}>
        {state.message}
      </Alert>
    </Snackbar>
  );
}