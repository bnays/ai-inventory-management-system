'use client';

import * as React from 'react';
import { 
  Button, Card, CardActions, CardContent, CardHeader, Divider, 
  FormControl, Grid, InputLabel, OutlinedInput, Typography, Box 
} from '@mui/material';
import { IdentificationCard, FloppyDisk } from '@phosphor-icons/react';
import { useUser } from '@/hooks/use-user';
import { apiRequest } from '@/lib/api-client';
import { useNotification } from '@/lib/notification';

export function AccountDetailsForm(): React.JSX.Element {
  const { user, checkSession } = useUser();
  const { showNotification } = useNotification();
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name')
    };

    try {
      await apiRequest('/users/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      showNotification('Profile synchronization complete.', 'success');
      if (checkSession) await checkSession(); 
    } catch (err) {
      showNotification('Failed to update profile data.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card sx={{ borderRadius: 5, border: '1px solid #eaecf0', boxShadow: 'none' }}>
        <CardHeader 
          avatar={
            <Box sx={{ p: 1, bgcolor: 'primary.50', borderRadius: 2, display: 'flex' }}>
              <IdentificationCard size={24} weight="duotone" color="primary" />
            </Box>
          }
          title={<Typography variant="h6" fontWeight="700">Profile Details</Typography>} 
        />
        <Divider />
        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid size={{ md: 6, xs: 12 }}>
              <FormControl fullWidth required>
                <InputLabel>First Name</InputLabel>
                <OutlinedInput defaultValue={user?.firstName} label="First Name" name="first_name" sx={{ borderRadius: 3 }} />
              </FormControl>
            </Grid>
            <Grid size={{ md: 6, xs: 12 }}>
              <FormControl fullWidth required>
                <InputLabel>Last Name</InputLabel>
                <OutlinedInput defaultValue={user?.lastName} label="Last Name" name="last_name" sx={{ borderRadius: 3 }} />
              </FormControl>
            </Grid>
            <Grid size={{ md: 6, xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Email</InputLabel>
                <OutlinedInput 
                  defaultValue={user?.email} 
                  label="Email" 
                  disabled 
                  sx={{ borderRadius: 3, bgcolor: '#fcfcfd' }} 
                />
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end', p: 3, bgcolor: '#fcfcfd' }}>
          <Button 
            disabled={isSaving} 
            type="submit" 
            variant="contained" 
            startIcon={<FloppyDisk weight="bold" />}
            sx={{ borderRadius: 2.5, fontWeight: 700, px: 4 }}
          >
            {isSaving ? 'Synchronizing...' : 'Update Profile'}
          </Button>
        </CardActions>
      </Card>
    </form>
  );
}