'use client';

import * as React from 'react';
import { 
  Stack, Typography, CircularProgress, Box, Button, 
  Paper, useTheme, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, MenuItem, InputAdornment, IconButton, 
  Avatar
} from '@mui/material';
import { 
  UserPlus, 
  UsersThree, 
  ArrowClockwise,
  UserCirclePlus,
  PencilSimple,
  Warning,
  Eye,
  EyeSlash,
  LockKey
} from '@phosphor-icons/react';
import { UsersTable, type User } from '@/components/dashboard/user/users-table';
import { apiRequest } from '@/lib/api-client';
import { useNotification } from '@/lib/notification';
import { GlobalSnackbar } from '@/components/core/global-snackbar';

export default function Page(): React.JSX.Element {
  const theme = useTheme();
  const { notification, showNotification, hideNotification } = useNotification();
  
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showPassword, setShowPassword] = React.useState(false);
  
  // Modal Control States
  const [open, setOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<any>(null);

  // Form State
  const [formData, setFormData] = React.useState({ 
    name: '', 
    email: '', 
    role: 'user', 
    password: '' 
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/users');
      setUsers(response || []);
    } catch (err) {
      showNotification("Failed to synchronize staff directory", "error");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { fetchUsers(); }, []);

  const handleCreateUser = async () => {
    if (!formData.password || formData.password.length < 6) {
      showNotification("Password must be at least 6 characters", "warning");
      return;
    }
    try {
      await apiRequest('/users', { method: 'POST', body: JSON.stringify(formData) });
      showNotification("Staff member successfully registered", "success");
      setOpen(false);
      fetchUsers();
    } catch (err) {
      showNotification("Registration failed", "error");
    }
  };

  const handleUpdateUser = async () => {
    try {
      await apiRequest(`/users/${selectedUser.id}`, { method: 'PATCH', body: JSON.stringify(selectedUser) });
      showNotification("Account updated successfully", "success");
      setEditOpen(false);
      fetchUsers();
    } catch (err) {
      showNotification("Update failed", "error");
    }
  };

  const handleDeleteUser = async () => {
    try {
      await apiRequest(`/users/${selectedUser.id}`, { method: 'DELETE' });
      showNotification("User removed from system", "success");
      setDeleteOpen(false);
      fetchUsers();
    } catch (err) {
      showNotification("Failed to remove user", "error");
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh' }}>
      
      {/* --- EXECUTIVE HEADER --- */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ color: 'neutral.900', letterSpacing: '-0.02em' }}>
            User Management
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <UsersThree size={18} weight="duotone" color={theme.palette.primary.main} />
            <Typography variant="body2" color="text.secondary" fontWeight="500">
              Staff directory and access control
            </Typography>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button 
            startIcon={<UserPlus size={18} weight="bold" />} 
            variant="contained" 
            onClick={() => setOpen(true)}
            sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, px: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          >
            Add User
          </Button>
        </Stack>
      </Stack>

      {/* --- MAIN TABLE Paper --- */}
      <Paper sx={{ borderRadius: 5, border: '1px solid #eaecf0', overflow: 'hidden', boxShadow: 'none' }}>
        {loading ? (
          <Box sx={{ py: 10, textAlign: 'center' }}>
            <CircularProgress size={35} thickness={4} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Retrieving directory...</Typography>
          </Box>
        ) : (
          <UsersTable 
            rows={users} 
            onEdit={(user) => { setSelectedUser(user); setEditOpen(true); }}
            onDelete={(user) => { setSelectedUser(user); setDeleteOpen(true); }}
          />
        )}
      </Paper>

      {/* --- CREATE MODAL --- */}
      <Dialog open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { borderRadius: 4, width: '100%', maxWidth: 450 } }}>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <UserCirclePlus size={32} weight="duotone" color={theme.palette.primary.main} />
          Register New Staff
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField fullWidth label="Full Name" onChange={(e) => setFormData({...formData, name: e.target.value})} />
            <TextField fullWidth label="Email" type="email" onChange={(e) => setFormData({...formData, email: e.target.value})} />
            
            <TextField 
              fullWidth 
              label="Initial Password" 
              type={showPassword ? 'text' : 'password'}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <LockKey size={20} weight="duotone" color={theme.palette.text.secondary} />
                    </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <TextField select fullWidth label="System Role" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateUser} sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}>Create Account</Button>
        </DialogActions>
      </Dialog>

      {/* --- EDIT MODAL --- */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} PaperProps={{ sx: { borderRadius: 4, width: '100%', maxWidth: 450 } }}>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PencilSimple size={32} weight="duotone" color={theme.palette.warning.main} />
          Edit Staff Profile
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField fullWidth label="Name" value={selectedUser?.name || ''} onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})} />
            
            <TextField 
                fullWidth 
                label="New Password (Leave blank to keep current)" 
                type="password"
                onChange={(e) => setSelectedUser({...selectedUser, password: e.target.value})} 
            />

            <TextField select fullWidth label="Access Role" value={selectedUser?.role || 'user'} onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value})}>
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleUpdateUser} sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}>Update Profile</Button>
        </DialogActions>
      </Dialog>

      {/* --- DELETE CONFIRMATION --- */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} PaperProps={{ sx: { borderRadius: 4, width: '100%', maxWidth: 400 } }}>
        <DialogContent sx={{ pt: 4, textAlign: 'center' }}>
          <Avatar sx={{ bgcolor: 'error.light', color: 'error.main', width: 60, height: 60, mx: 'auto', mb: 2 }}>
            <Warning size={32} weight="fill" />
          </Avatar>
          <Typography variant="h6" fontWeight="bold">Confirm Deletion</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Are you sure you want to remove <b>{selectedUser?.name}</b>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
          <Button onClick={() => setDeleteOpen(false)} variant="outlined" color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleDeleteUser} variant="contained" color="error" sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}>Delete User</Button>
        </DialogActions>
      </Dialog>

      <GlobalSnackbar state={notification} onClose={hideNotification} />
    </Box>
  );
}