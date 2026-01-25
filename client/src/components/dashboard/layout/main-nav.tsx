'use client';

import * as React from 'react';
import { 
  Avatar, Badge, Box, IconButton, Stack, Tooltip, Menu, 
  MenuItem, ListItemText, Typography, Divider, CircularProgress 
} from '@mui/material';
import { BellIcon } from '@phosphor-icons/react/dist/ssr/Bell';
import { ListIcon } from '@phosphor-icons/react/dist/ssr/List';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { UsersIcon } from '@phosphor-icons/react/dist/ssr/Users';

import { usePopover } from '@/hooks/use-popover';
import { MobileNav } from './mobile-nav';
import { UserPopover } from './user-popover';
import { useUser } from '@/hooks/use-user';
import { userInitials } from '@/lib/utils';
import { apiRequest } from '@/lib/api-client';

export function MainNav(): React.JSX.Element {
  const [openNav, setOpenNav] = React.useState<boolean>(false);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [clearedIds, setClearedIds] = React.useState<Set<number>>(new Set());

  const userPopover = usePopover<HTMLDivElement>();
  const notificationPopover = usePopover<HTMLButtonElement>();

  const { user } = useUser();

  const unreadCount = notifications.filter((n) => !n.is_read && !clearedIds.has(n.id)).length;

  const fetchNotifications = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/notifications');
      // Filter out notifications that were just cleared locally
      const activeNotifications = (data || []).filter((n: any) => !clearedIds.has(n.id));
      setNotifications(activeNotifications);
    } catch (error) {
      console.error("Fetch failed", error);
    } finally {
      setLoading(false);
    }
  }, [clearedIds]);

  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); 
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: number) => {
    try {
        // 1. Update the local state object instead of removing it
        setNotifications((prev) => 
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );

        // 2. Sync with the backend
        await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
    } catch (error) {
        console.error("Failed to mark as read", error);
        fetchNotifications(); // Rollback on error
    }
    };

  const getUserAvatar = (user: any) => {
    if (user?.img) {
      return (
        <Avatar
          onClick={userPopover.handleOpen}
          ref={userPopover.anchorRef}
          src="/assets/avatar.png"
          sx={{ cursor: 'pointer' }}
        />
      );
    }
    return (
      <Avatar 
        src={user?.avatar} 
        onClick={userPopover.handleOpen}
        ref={userPopover.anchorRef}
        sx={{ cursor: 'pointer' }}
      >
        {userInitials(user)}
      </Avatar>
    );
  };

  return (
    <React.Fragment>
      <Box
        component="header"
        sx={{
          borderBottom: '1px solid var(--mui-palette-divider)',
          backgroundColor: 'var(--mui-palette-background-paper)',
          position: 'sticky',
          top: 0,
          zIndex: 'var(--mui-zIndex-appBar)',
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: 'center', justifyContent: 'space-between', minHeight: '64px', px: 2 }}
        >
          <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
            <IconButton
              onClick={() => setOpenNav(true)}
              sx={{ display: { lg: 'none' } }}
            >
              <ListIcon />
            </IconButton>
          </Stack>

          <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
            <Tooltip title="Notifications">
                <Badge 
                    badgeContent={unreadCount} // This will now decrease as items are clicked
                    color="error" 
                    invisible={unreadCount === 0}
                >
                    <IconButton 
                    onClick={notificationPopover.handleOpen}
                    ref={notificationPopover.anchorRef}
                    >
                    <BellIcon />
                    </IconButton>
                </Badge>
            </Tooltip>

            {getUserAvatar(user)}
          </Stack>
        </Stack>
      </Box>

      <Menu
        anchorEl={notificationPopover.anchorRef.current}
        open={notificationPopover.open}
        onClose={notificationPopover.handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{ paper: { sx: { width: '320px', mt: 1.5, maxHeight: '400px' } } }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight="bold">Alerts</Typography>
          {loading && <CircularProgress size={16} />}
        </Box>
        <Divider />
        
        {notifications.length === 0 ? (
          <MenuItem disabled sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No low stock alerts.
            </Typography>
          </MenuItem>
        ) : (
          notifications.map((n) => (
            <MenuItem 
                key={n.id} 
                onClick={() => handleMarkAsRead(n.id)}
                sx={{ 
                whiteSpace: 'normal', 
                py: 1.5,
                backgroundColor: n.is_read ? 'transparent' : 'rgba(0, 0, 0, 0.04)', // Light gray for unread
                opacity: n.is_read ? 0.6 : 1 // Dimmed if read
                }}
            >
                <ListItemText 
                primary={n.message} 
                secondary={new Date(n.created_at).toLocaleString()} 
                />
            </MenuItem>
            ))
        )}
      </Menu>

      <UserPopover 
        anchorEl={userPopover.anchorRef.current} 
        onClose={userPopover.handleClose} 
        open={userPopover.open} 
      />
      
      <MobileNav
        onClose={() => setOpenNav(false)}
        open={openNav}
      />
    </React.Fragment>
  );
}