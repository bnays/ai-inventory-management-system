'use client';

import * as React from 'react';
import {
  Button, Card, CardActions, CardContent, CardHeader, Divider,
  FormControl, InputLabel, OutlinedInput, Stack, Typography, 
  Box, FormHelperText
} from '@mui/material';
import { ShieldCheck, Key } from '@phosphor-icons/react';
import { useNotification } from '@/lib/notification';
import { apiRequest } from '@/lib/api-client';

export function UpdatePasswordForm(): React.JSX.Element {
  const { showNotification } = useNotification();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // --- CLIENT-SIDE VALIDATION ---
    if (formData.password.length < 6) {
      return showNotification("Security Warning: Password must be at least 6 characters.", "warning");
    }
    if (formData.password !== formData.confirmPassword) {
      return showNotification("Mismatch: The confirmed password does not match.", "error");
    }

    setIsSubmitting(true);
    try {
      // Endpoint targeted for secure credential synchronization
      await apiRequest('/auth/update-password', {
        method: 'POST',
        body: JSON.stringify({ password: formData.password })
      });
      
      showNotification("Security Update: Your password has been successfully reset.", "success");
      setFormData({ password: '', confirmPassword: '' }); // Reset form after success
    } catch (err: any) {
      showNotification(err.message || "Credential Error: Failed to synchronize new password.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card sx={{ borderRadius: 5, border: '1px solid #eaecf0', boxShadow: 'none', overflow: 'hidden' }}>
        <CardHeader 
          avatar={
            <Box sx={{ p: 1, bgcolor: 'primary.50', borderRadius: 2, display: 'flex' }}>
              <ShieldCheck size={24} weight="duotone" color="primary" />
            </Box>
          }
          title={<Typography variant="h6" fontWeight="700">Change your password</Typography>}
          subheader="Update your password to keep your account secure" 
        />
        <Divider />
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={3} sx={{ maxWidth: 'sm' }}>
            <FormControl fullWidth>
              <InputLabel>New Password</InputLabel>
              <OutlinedInput 
                label="New Password" 
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                sx={{ borderRadius: 3 }}
                startAdornment={<Key size={20} style={{ marginRight: 8, opacity: 0.5 }} />}
              />
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Confirm New Password</InputLabel>
              <OutlinedInput 
                label="Confirm New Password" 
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                sx={{ borderRadius: 3 }}
                startAdornment={<Key size={20} style={{ marginRight: 8, opacity: 0.5 }} />}
              />
              {/* Contextual Validation Feedback */}
              {formData.password !== formData.confirmPassword && formData.confirmPassword !== '' && (
                <FormHelperText error sx={{ fontWeight: 600 }}>Passwords do not match</FormHelperText>
              )}
            </FormControl>
          </Stack>
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end', p: 3, bgcolor: '#fcfcfd' }}>
          <Button 
            type="submit"
            variant="contained" 
            disabled={isSubmitting}
            sx={{ borderRadius: 2.5, fontWeight: 700, px: 4, textTransform: 'none' }}
          >
            {isSubmitting ? 'Updating Credentials...' : 'Update Password'}
          </Button>
        </CardActions>
      </Card>
    </form>
  );
}