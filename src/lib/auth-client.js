import { createAuthClient } from 'better-auth/react';
import { organizationClient } from 'better-auth/client/plugins';

/**
 * Better Auth client.
 * baseURL points to the server root — Better Auth appends /api/auth internally.
 */
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : 'http://localhost:3001',
  plugins: [organizationClient()],
});

// Named exports for convenience
export const { signIn, signUp, signOut, useSession } = authClient;
