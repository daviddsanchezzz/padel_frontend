import { authClient } from '../lib/auth-client';

/**
 * Register a new user.
 * role: 'player' | 'organizer'
 */
export const register = ({ name, email, password, role = 'player' }) =>
  authClient.signUp.email({ name, email, password, role });

/**
 * Sign in with email and password.
 */
export const login = ({ email, password }) =>
  authClient.signIn.email({ email, password });

/**
 * Sign in with Google OAuth.
 * Redirects the browser; callbackURL is where the user lands after auth.
 */
export const loginWithGoogle = (callbackURL = '/dashboard') =>
  authClient.signIn.social({ provider: 'google', callbackURL });

/**
 * Sign out the current session.
 */
export const logout = () => authClient.signOut();

/**
 * Get the current session (user + session metadata).
 * Returns null if not authenticated.
 */
export const getMe = () => authClient.getSession();
