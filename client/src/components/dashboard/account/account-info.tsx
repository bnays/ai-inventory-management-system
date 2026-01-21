'use client';

import * as React from 'react';
import { Avatar, Button, Card, CardActions, CardContent, Divider, Stack, Typography } from '@mui/material';
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
    <Card>
      <CardContent>
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          <div>
            <Avatar 
              src={user?.avatar} 
              sx={{ height: '80px', width: '80px' }}
            >
              {userInitials}
            </Avatar>
          </div>
          <Stack spacing={1} sx={{ textAlign: 'center' }}>
            <Typography variant="h5">{String(user?.firstName ?? 'User')} {String(user?.lastName ?? '')}</Typography>
            <Typography color="text.secondary" variant="body2">
              {String(user?.email ?? '')}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
      <Divider />
      <CardActions>
        <Button fullWidth variant="text">
          Upload picture
        </Button>
      </CardActions>
    </Card>
  );
}