'use client';

import type { User } from '@/types/user';

// Define your API base URL (update this to your server's address)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface SignUpParams {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface SignInWithPasswordParams {
  email: string;
  password: string;
}

class AuthClient {
  /**
   * Register a new user in the Node.js backend
   * Backend should handle password hashing and MySQL storage [cite: 161, 165, 179]
   */
  async signUp(params: SignUpParams): Promise<{ error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const result = await response.json();

      if (!response.ok) {
        return { error: result.message || 'Registration failed' };
      }

      // Store the JWT returned by the backend [cite: 165]
      localStorage.setItem('custom-auth-token', result.token);
      return {};
    } catch (err) {
      return { error: 'Connection error. Is the Node.js server running?' };
    }
  }

  /**
   * Authenticate user and receive a JWT
   * Matches email and password hash in the database [cite: 184, 199]
   */
  async signInWithPassword(params: SignInWithPasswordParams): Promise<{ error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const result = await response.json();

      if (!response.ok) {
        return { error: result.message || 'Invalid credentials' };
      }

      // Save token to localStorage for persistent session management [cite: 151, 165]
      localStorage.setItem('custom-auth-token', result.token);
      return {};
    } catch (err) {
      return { error: 'Could not connect to the authentication service.' };
    }
  }

  /**
   * Fetch user data using the stored JWT
   * Supports Role-Based Access Control (RBAC) [cite: 180, 233]
   */
  async getUser(): Promise<{ data?: User | null; error?: string }> {
    const token = localStorage.getItem('custom-auth-token');

    if (!token) {
      return { data: null };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      const result = await response.json();

      if (!response.ok) {
        localStorage.removeItem('custom-auth-token');
        return { data: null, error: 'Session expired' };
      }

      // Result should match your User type: id, firstName, role, etc. [cite: 273]
      return { data: result.user };
    } catch (err) {
      return { error: 'Failed to fetch user data' };
    }
  }

  async signOut(): Promise<{ error?: string }> {
    localStorage.removeItem('custom-auth-token');
    return {};
  }
}

export const authClient = new AuthClient();