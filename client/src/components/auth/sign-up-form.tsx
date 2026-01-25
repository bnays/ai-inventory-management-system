'use client';

import * as React from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Alert, Button, Checkbox, FormControl, FormControlLabel, 
  FormHelperText, InputLabel, Link, OutlinedInput, Stack, 
  Typography, InputAdornment, IconButton, Box, Avatar
} from '@mui/material';
import { 
  UserCirclePlus, EnvelopeSimple, LockKey, 
  Eye, EyeSlash, User 
} from '@phosphor-icons/react';
import { Controller, useForm } from 'react-hook-form';
import { z as zod } from 'zod';

import { paths } from '@/paths';
import { authClient } from '@/lib/auth/client';
import { useNotification } from '@/lib/notification'; // Import hook
import { GlobalSnackbar } from '@/components/core/global-snackbar'; // Import component

const schema = zod.object({
  firstName: zod.string().min(1, { message: 'First name is required' }),
  lastName: zod.string().min(1, { message: 'Last name is required' }),
  email: zod.string().min(1, { message: 'Email is required' }).email(),
  password: zod.string().min(6, { message: 'Password should be at least 6 characters' }),
  terms: zod.boolean().refine((value) => value, 'You must accept the terms and conditions'),
});

type Values = zod.infer<typeof schema>;
const defaultValues = { firstName: '', lastName: '', email: '', password: '', terms: false } satisfies Values;

export function SignUpForm(): React.JSX.Element {
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();
  
  const [isPending, setIsPending] = React.useState<boolean>(false);
  const [showPassword, setShowPassword] = React.useState<boolean>(false);

  const { control, handleSubmit, setError, formState: { errors } } = useForm<Values>({ 
    defaultValues, 
    resolver: zodResolver(schema) 
  });

  const onSubmit = React.useCallback(
    async (values: Values): Promise<void> => {
      setIsPending(true);
      const { error } = await authClient.signUp(values);

      if (error) {
        setError('root', { type: 'server', message: error });
        setIsPending(false);
        return;
      }

      // 1. Show success notification
      showNotification("Account created! Redirecting to login...", "success");

      // 2. Brief delay so the user sees the snackbar before the page changes
      setTimeout(() => {
        router.push(paths.auth.signIn);
      }, 1500);
    },
    [router, setError, showNotification]
  );

  return (
    <Stack spacing={4} sx={{ width: '100%', maxWidth: '400px' }}>
      <Stack spacing={1} textAlign="center">
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
           <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
              <UserCirclePlus size={32} weight="duotone" />
           </Avatar>
        </Box>
        <Typography variant="h4" fontWeight="800">Create Account</Typography>
        <Typography color="text.secondary" variant="body2">
          Already a member?{' '}
          <Link component={NextLink} href={paths.auth.signIn} underline="hover" variant="subtitle2" fontWeight="700">
            Sign in
          </Link>
        </Typography>
      </Stack>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2.5}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              control={control}
              name="firstName"
              render={({ field }) => (
                <FormControl error={Boolean(errors.firstName)} fullWidth>
                  <InputLabel>First name</InputLabel>
                  <OutlinedInput 
                    {...field} 
                    label="First name" 
                    sx={{ borderRadius: 2.5 }}
                    startAdornment={<InputAdornment position="start"><User size={20} /></InputAdornment>}
                  />
                  {errors.firstName && <FormHelperText>{errors.firstName.message}</FormHelperText>}
                </FormControl>
              )}
            />
            <Controller
              control={control}
              name="lastName"
              render={({ field }) => (
                <FormControl error={Boolean(errors.lastName)} fullWidth>
                  <InputLabel>Last name</InputLabel>
                  <OutlinedInput {...field} label="Last name" sx={{ borderRadius: 2.5 }} 
                  startAdornment={<InputAdornment position="start"><User size={20} /></InputAdornment>}/>
                  {errors.lastName && <FormHelperText>{errors.lastName.message}</FormHelperText>}
                </FormControl>
              )}
            />
          </Stack>

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
                  startAdornment={<InputAdornment position="start"><EnvelopeSimple size={20} /></InputAdornment>}
                />
                {errors.email && <FormHelperText>{errors.email.message}</FormHelperText>}
              </FormControl>
            )}
          />

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
                  startAdornment={<InputAdornment position="start"><LockKey size={20} /></InputAdornment>}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                      </IconButton>
                    </InputAdornment>
                  }
                />
                {errors.password && <FormHelperText>{errors.password.message}</FormHelperText>}
              </FormControl>
            )}
          />

          <Controller
            control={control}
            name="terms"
            render={({ field }) => (
              <Box>
                <FormControlLabel
                  control={<Checkbox {...field} color="primary" />}
                  label={
                    <Typography variant="body2" color="text.secondary">
                      I agree to the <Link fontWeight="600" color="primary">Terms & Privacy Policy</Link>
                    </Typography>
                  }
                />
                {errors.terms && <FormHelperText error sx={{ ml: 1 }}>{errors.terms.message}</FormHelperText>}
              </Box>
            )}
          />

          {errors.root && <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>{errors.root.message}</Alert>}

          <Button 
            disabled={isPending} 
            type="submit" 
            variant="contained" 
            size="large"
            sx={{ borderRadius: 2.5, py: 1.5, fontWeight: 700, textTransform: 'none', fontSize: '1rem' }}
          >
            {isPending ? 'Processing...' : 'Sign Up'}
          </Button>
        </Stack>
      </form>

      {/* Render the snackbar at the bottom of the component */}
      <GlobalSnackbar state={notification} onClose={hideNotification} />
    </Stack>
  );
}