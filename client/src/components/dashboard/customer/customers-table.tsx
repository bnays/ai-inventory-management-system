'use client';

import * as React from 'react';
import { Box, Card, Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

export interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'user';
  active: boolean;
  created_at: string;
}

export function UsersTable({ rows = [] }: { rows: User[] }): React.JSX.Element {
  return (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: '800px' }}>
          <TableHead>
            <TableRow>
              <TableCell>Full Name</TableCell>
              <TableCell>Email Address</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Account Status</TableCell>
              <TableCell>Registration Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((user) => (
              <TableRow hover key={user.user_id}>
                <TableCell>
                  <Typography variant="subtitle2">
                    {user.first_name} {user.last_name}
                  </Typography>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip 
                    label={user.role.toUpperCase()} 
                    size="small" 
                    color={user.role === 'admin' ? 'primary' : 'default'} 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={user.active ? 'Active' : 'Disabled'} 
                    color={user.active ? 'success' : 'error'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString('en-AU')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Card>
  );
}