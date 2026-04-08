import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMyOrganizations } from '../api/organizations';
import { useAuth } from './AuthContext';

const OrgContext = createContext(null);

export const OrgProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [activeOrg, setActiveOrg] = useState(null);
  const [loadingOrg, setLoadingOrg] = useState(true);

  useEffect(() => {
    // Wait for auth to resolve before checking org.
    // Without this, user is null during session load → hasOrg = false → redirect to onboarding.
    if (authLoading) return;

    if (!user || user.role !== 'organizer') {
      setLoadingOrg(false);
      return;
    }

    setLoadingOrg(true);
    getMyOrganizations()
      .then((res) => setActiveOrg(res.data[0] ?? null))
      .catch(() => setActiveOrg(null))
      .finally(() => setLoadingOrg(false));
  }, [user?.id, authLoading]);

  const hasOrg = !!activeOrg;

  // Called after the user creates their org in Onboarding
  const orgCreated = (org) => setActiveOrg(org);

  return (
    <OrgContext.Provider value={{ activeOrg, loadingOrg, hasOrg, orgCreated }}>
      {children}
    </OrgContext.Provider>
  );
};

export const useOrg = () => useContext(OrgContext);
