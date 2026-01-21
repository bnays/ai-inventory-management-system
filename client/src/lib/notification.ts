import { useState, useCallback } from 'react';

export type NotificationSeverity = 'success' | 'error' | 'warning' | 'info';

export interface NotificationState {
  open: boolean;
  message: string;
  severity: NotificationSeverity;
}

export const useNotification = () => {
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Wrap in useCallback to stop the infinite loop
  const showNotification = useCallback((message: string, severity: NotificationSeverity = 'success') => {
    setNotification({ open: true, message, severity });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, open: false }));
  }, []);

  return { notification, showNotification, hideNotification };
};