'use client';

import * as React from 'react';
import { 
  Box, Card, Chip, Table, TableBody, TableCell, TableHead, 
  TableRow, Typography, IconButton, Stack, Tooltip 
} from '@mui/material';
import { PencilSimple, Trash, Crown, User as UserIcon } from '@phosphor-icons/react';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  active: boolean;
  created_at: string;
}

interface UsersTableProps {
  rows: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export function UsersTable({ rows = [], onEdit, onDelete }: UsersTableProps): React.JSX.Element {
  const safeRows = Array.isArray(rows) ? rows : [];

  return (
    <Card sx={{ border: 'none', boxShadow: 'none' }}>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: '800px' }}>
          <TableHead sx={{ bgcolor: '#fcfcfd' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                Full Name
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                Email Address
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                System Role
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                Account Status
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {safeRows.map((user: User) => (
              <TableRow hover key={user.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell>
                  <Typography variant="body2" fontWeight="600">
                    {user.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Joined {new Date(user.created_at).toLocaleDateString('en-AU')}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Chip 
                    icon={user.role === 'admin' ? <Crown size={14} weight="fill" /> : <UserIcon size={14} weight="fill" />}
                    label={user.role === 'admin' ? 'Admin' : 'User'} 
                    size="small" 
                    sx={{ 
                      fontWeight: 700, 
                      bgcolor: user.role === 'admin' ? 'primary.50' : 'neutral.50',
                      color: user.role === 'admin' ? 'primary.main' : 'text.secondary',
                      border: '1px solid',
                      borderColor: user.role === 'admin' ? 'primary.200' : 'neutral.200'
                    }} 
                  />
                </TableCell>
                
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: user.active ? 'success.main' : 'error.main' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {user.active ? 'Active' : 'Disabled'}
                    </Typography>
                  </Stack>
                </TableCell>
                
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Edit Permissions">
                        <IconButton 
                          size="small" 
                          onClick={() => onEdit(user)}
                          sx={{ color: 'warning.main', bgcolor: 'warning.50', '&:hover': { bgcolor: 'warning.100' } }}
                        >
                          <PencilSimple size={18} weight="bold" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove User">
                        <IconButton 
                          size="small" 
                          onClick={() => onDelete(user)}
                          sx={{ color: 'error.main', bgcolor: 'error.50', '&:hover': { bgcolor: 'error.100' } }}
                        >
                          <Trash size={18} weight="bold" />
                        </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Card>
  );
}