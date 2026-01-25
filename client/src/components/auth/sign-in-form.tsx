'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Alert, Button, FormControl, FormHelperText, InputLabel, 
  Link, OutlinedInput, Stack, Typography, InputAdornment, 
  IconButton, Box, Avatar, Divider 
} from '@mui/material';
import { 
  LockKey, 
  EnvelopeSimple, 
  Eye, 
  EyeSlash, 
  Fingerprint, 
  ShieldCheck 
} from '@phosphor-icons/react';
import { Controller, useForm } from 'react-hook-form';
import { z as zod } from 'zod';

import { paths } from '@/paths';
import { authClient } from '@/lib/auth/client';
import { useUser } from '@/hooks/use-user';

const schema = zod.object({
  email: zod.string().min(1, { message: 'Email is required' }).email(),
  password: zod.string().min(1, { message: 'Password is required' }),
});

type Values = zod.infer<typeof schema>;

const defaultValues = { email: '', password: '' } satisfies Values;

export function SignInForm(): React.JSX.Element {
  const router = useRouter();
  const { checkSession } = useUser();
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [isPending, setIsPending] = React.useState<boolean>(false);

  const { control, handleSubmit, setError, formState: { errors } } = useForm<Values>({ 
    defaultValues, 
    resolver: zodResolver(schema) 
  });

  const onSubmit = React.useCallback(
    async (values: Values): Promise<void> => {
      setIsPending(true);
      const { error } = await authClient.signInWithPassword(values);

      if (error) {
        setError('root', { type: 'server', message: error });
        setIsPending(false);
        return;
      }

      await checkSession?.();
      router.push(paths.dashboard.overview);
      router.refresh();
    },
    [checkSession, router, setError]
  );

  return (
    <Stack spacing={4} sx={{ width: '100%', maxWidth: '400px' }}>
      {/* --- Auth Header --- */}
      <Stack spacing={1} textAlign="center">
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, boxShadow: 3 }}>
            <Fingerprint size={32} weight="duotone" />
          </Avatar>
        </Box>
        <Typography variant="h4" fontWeight="800" sx={{ letterSpacing: '-0.02em' }}>
          Sign In
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Logix Warehouse Staff Portal •{' '}
          <Link component={RouterLink} href={paths.auth.signUp} underline="hover" variant="subtitle2" fontWeight="700">
            Create account
          </Link>
        </Typography>
      </Stack>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2.5}>
          {/* Email Address */}
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <FormControl error={Boolean(errors.email)}>
                <InputLabel>Email address</InputLabel>
                <OutlinedInput 
                  {...field} 
                  label="Email address" 
                  type="email" 
                  sx={{ borderRadius: 2.5 }}
                  startAdornment={
                    <InputAdornment position="start">
                      <EnvelopeSimple size={20} color="var(--mui-palette-neutral-500)" />
                    </InputAdornment>
                  }
                />
                {errors.email && <FormHelperText>{errors.email.message}</FormHelperText>}
              </FormControl>
            )}
          />

          {/* Password */}
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <FormControl error={Boolean(errors.password)}>
                <InputLabel>Password</InputLabel>
                <OutlinedInput
                  {...field}
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  sx={{ borderRadius: 2.5 }}
                  startAdornment={
                    <InputAdornment position="start">
                      <LockKey size={20} color="var(--mui-palette-neutral-500)" />
                    </InputAdornment>
                  }
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <Eye size={20} /> : <EyeSlash size={20} />}
                      </IconButton>
                    </InputAdornment>
                  }
                />
                {errors.password && <FormHelperText>{errors.password.message}</FormHelperText>}
              </FormControl>
            )}
          />

          <Stack direction="row" justifyContent="flex-end">
            <Link component={RouterLink} href={paths.auth.resetPassword} variant="subtitle2" color="text.secondary" underline="hover">
              Forgot password?
            </Link>
          </Stack>

          {errors.root && <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>{errors.root.message}</Alert>}

          <Button 
            disabled={isPending} 
            type="submit" 
            variant="contained" 
            size="large"
            sx={{ borderRadius: 2.5, py: 1.5, fontWeight: 700, textTransform: 'none', fontSize: '1rem' }}
          >
            {isPending ? 'Authenticating...' : 'Sign In'}
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}