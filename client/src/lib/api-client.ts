// src/lib/api-client.ts

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('custom-auth-token');
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`http://localhost:3001/api${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    // Handle Session Expired
    if (response.status === 401) {
      localStorage.removeItem('custom-auth-token');
      window.location.href = '/auth/sign-in';
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'API_ERROR');
    }

    return await response.json();
  } catch (error: any) {
    // If it's a network error (like ERR_CONNECTION_REFUSED)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('BACKEND_OFFLINE'); 
    }
    throw error;
  }
}