import React, { createContext, useContext } from 'react';
import { authClient } from '../lib/auth-client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Better Auth React hook — re-renders on session change, handles loading state
  const { data: session, isPending: loading } = authClient.useSession();

  // Normalize: expose user directly; keep null when not authenticated
  const user = session?.user ?? null;

  const loginUser = ({ email, password }) =>
    authClient.signIn.email({ email, password });

  const loginWithGoogle = (callbackURL = '/resumen') =>
    authClient.signIn.social({ provider: 'google', callbackURL });

  const logout = async () => {
    const { error } = await authClient.signOut();
    if (error) throw new Error(error.message || 'No se pudo cerrar sesión');
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
