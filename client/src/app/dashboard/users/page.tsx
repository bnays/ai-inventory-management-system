'use client';

import * as React from 'react';
import { Stack, Typography, CircularProgress } from '@mui/material';
import { UsersTable, type User } from '@/components/dashboard/user/users-table';

export default function Page(): React.JSX.Element {
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('custom-auth-token');
        const response = await fetch('http://localhost:3001/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setUsers(data || []);
      } catch (err) {
        console.error("Failed to load users", err);
        setUsers([]); // Fallback to empty array on error
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <Stack spacing={3}>
      <Typography variant="h4" fontWeight="bold">User Management</Typography>
      {loading ? (
        <CircularProgress sx={{ alignSelf: 'center', mt: 4 }} />
      ) : (
        <UsersTable rows={users} />
      )}
    </Stack>
  );
}