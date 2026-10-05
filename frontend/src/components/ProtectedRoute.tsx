'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, Role, getDashboardForRole } from '@/lib/auth';

interface ProtectedRouteProps {
  allowedRoles: (Role | string)[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  const isAllowed = user
    ? allowedRoles.some((r) => String(r).toLowerCase() === String(user.role).toLowerCase())
    : false;

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/');
      return;
    }

    if (!isAllowed) {
      const dashboard = getDashboardForRole(user.role);
      router.replace(dashboard);
    }
  }, [user, loading, isAllowed, router]);

  if (loading || !user || !isAllowed) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Authenticating & Redirecting...
      </div>
    );
  }

  return <>{children}</>;
};
