'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User, UserOrganization } from '@stockflow/shared';
import { api, getTokens, setTokens, clearTokens, getOrgId, setOrgId } from '@/lib/api-client';

interface AuthContextType {
  user: User | null;
  organizations: UserOrganization[];
  currentOrg: UserOrganization | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  switchOrg: (orgId: string) => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

const publicPaths = ['/login', '/register'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<UserOrganization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<UserOrganization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const init = async () => {
      const { accessToken } = getTokens();
      if (!accessToken) {
        setIsLoading(false);
        if (!publicPaths.includes(pathname)) router.push('/login');
        return;
      }

      try {
        const data = await api<{ user: User; organizations: UserOrganization[] }>('/auth/me');
        setUser(data.user);
        setOrganizations(data.organizations);

        const savedOrgId = getOrgId();
        const org = data.organizations.find((o) => o.organization.id === savedOrgId) || data.organizations[0];
        if (org) {
          setCurrentOrg(org);
          setOrgId(org.organization.id);
        }
      } catch {
        clearTokens();
        if (!publicPaths.includes(pathname)) router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [pathname, router]);

  const login = async (email: string, password: string) => {
    const data = await api<{
      accessToken: string;
      refreshToken: string;
      user: User;
      organizations: UserOrganization[];
    }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    setOrganizations(data.organizations);
    if (data.organizations[0]) {
      setCurrentOrg(data.organizations[0]);
      setOrgId(data.organizations[0].organization.id);
    }
    router.push('/');
  };

  const register = async (formData: RegisterData) => {
    const data = await api<{
      accessToken: string;
      refreshToken: string;
      user: User;
      organizations: UserOrganization[];
    }>('/auth/register', { method: 'POST', body: JSON.stringify(formData) });

    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    setOrganizations(data.organizations);
    if (data.organizations[0]) {
      setCurrentOrg(data.organizations[0]);
      setOrgId(data.organizations[0].organization.id);
    }
    router.push('/');
  };

  const logout = () => {
    const { refreshToken } = getTokens();
    if (refreshToken) {
      api('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }).catch(() => {});
    }
    clearTokens();
    setUser(null);
    setOrganizations([]);
    setCurrentOrg(null);
    router.push('/login');
  };

  const switchOrg = (orgId: string) => {
    const org = organizations.find((o) => o.organization.id === orgId);
    if (org) {
      setCurrentOrg(org);
      setOrgId(orgId);
    }
  };

  return (
    <AuthContext.Provider value={{ user, organizations, currentOrg, isLoading, login, register, logout, switchOrg }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
