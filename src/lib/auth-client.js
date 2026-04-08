import { createAuthClient } from 'better-auth/react';
import { organizationClient } from 'better-auth/client/plugins';

/**
 * Better Auth client.
 * baseURL points to the server root — Better Auth appends /api/auth internally.
 */
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// When VITE_API_URL is relative (e.g. '/api'), Vercel proxies requests to the backend.
// Better Auth client needs an absolute origin — use window.location.origin so auth
// calls go to the same domain and cookies are treated as first-party by iOS Safari.
const baseURL = rawApiUrl.startsWith('/')
  ? (typeof window !== 'undefined' ? window.location.origin : '')
  : rawApiUrl.replace('/api', '');

export const authClient = createAuthClient({
  baseURL,
  plugins: [organizationClient()],
});

// Named exports for convenience
export const { signIn, signUp, signOut, useSession } = authClient;
