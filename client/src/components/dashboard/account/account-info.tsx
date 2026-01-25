'use client';

import * as React from 'react';
import { Avatar, Button, Card, CardActions, CardContent, Divider, Stack, Typography, Box } from '@mui/material';
import { Camera } from '@phosphor-icons/react';
import { useUser } from '@/hooks/use-user';

export function AccountInfo(): React.JSX.Element {
  const { user } = useUser();

  const userInitials = React.useMemo(() => {
        if (!user?.firstName && !user?.lastName) return '??';
        
        const firstInitial = String(user?.firstName ?? 'User')?.[0] || '';
        const lastInitial = String(user?.lastName ?? 'User')?.[0] || '';
        
        return (firstInitial + lastInitial).toUpperCase();
    }, [user]);

  return (
    <Card sx={{ borderRadius: 5, border: '1px solid #eaecf0', boxShadow: 'none' }}>
      <CardContent sx={{ p: 4 }}>
        <Stack spacing={3} sx={{ alignItems: 'center' }}>
          <Avatar 
            src={user?.avatar} 
            sx={{ 
              height: 100, 
              width: 100, 
              fontSize: '2rem', 
              fontWeight: 700,
              bgcolor: 'primary.main',
              boxShadow: '0 0 0 4px #fff, 0 0 0 6px #eaecf0'
            }}
          >
            {userInitials}
          </Avatar>
          <Stack spacing={0.5} sx={{ textAlign: 'center' }}>
            <Typography variant="h5">{String(user?.firstName ?? 'User')} {String(user?.lastName ?? '')}</Typography>
            <Typography color="text.secondary" variant="body2">
              {String(user?.email ?? '')}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  bgcolor: 'primary.50', 
                  color: 'primary.main', 
                  px: 1.5, 
                  py: 0.5, 
                  borderRadius: 1.5, 
                  fontWeight: 800,
                  textTransform: 'uppercase'
                }}
              >
                {String(user?.role)}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}