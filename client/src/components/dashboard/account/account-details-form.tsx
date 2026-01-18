'use client';

import * as React from 'react';
import { Button, Card, CardActions, CardContent, CardHeader, Divider, FormControl, Grid, InputLabel, OutlinedInput, Typography } from '@mui/material';
import { useUser } from '@/hooks/use-user';

export function AccountDetailsForm(): React.JSX.Element {
  const { user, checkSession } = useUser();
  const [isSaving, setIsSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    console.log(user, "User")

    try {
      const token = localStorage.getItem('custom-auth-token');
      const response = await fetch('http://localhost:3001/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setMessage('Profile updated successfully!');
        //refresh user data or update local state
        if (checkSession) {
          await checkSession(); 
        }
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (err) {
      setMessage('Error saving details. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader subheader="The information can be edited" title="Profile" />
        <Divider />
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{
                md: 6,
                xs: 12,
              }}>
              <FormControl fullWidth required>
                <InputLabel>First name</InputLabel>
                <OutlinedInput defaultValue={user?.firstName} label="First name" name="first_name" />
              </FormControl>
            </Grid>
            <Grid size={{
                md: 6,
                xs: 12,
              }}>
              <FormControl fullWidth required>
                <InputLabel>Last name</InputLabel>
                <OutlinedInput defaultValue={user?.lastName} label="Last name" name="last_name" />
              </FormControl>
            </Grid>
            <Grid size={{
                md: 6,
                xs: 12,
              }}>
              <FormControl fullWidth required>
                <InputLabel>Email address</InputLabel>
                <OutlinedInput defaultValue={user?.email} label="Email address" disabled name="email" readOnly />
              </FormControl>
            </Grid>
          </Grid>
          {message && (
            <Typography color={message.includes('Error') ? 'error' : 'success'} sx={{ mt: 2 }}>
              {message}
            </Typography>
          )}
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end' }}>
          <Button disabled={isSaving} type="submit" variant="contained">
            {isSaving ? 'Saving...' : 'Save details'}
          </Button>
        </CardActions>
      </Card>
    </form>
  );
}