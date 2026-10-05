'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth, UserRole } from '@/lib/auth';
import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: (UserRole | string)[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="card-panel">
          <Lock size={48} style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
          <h2 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            Authentication Required
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            You must log in to access this portal section.
          </p>
          <Link href="/login" className="btn btn-primary" style={{ width: '100%' }}>
            Go to Login Page
          </Link>
        </div>
      </div>
    );
  }

  const isAllowed = allowedRoles.some(
    (r) => String(r).toLowerCase() === String(user.role).toLowerCase()
  );

  if (!isAllowed) {
    const getDashboardHref = (role: string) => {
      const lower = role.toLowerCase();
      if (lower === 'student') return '/dashboard';
      if (lower === 'warden') return '/warden';
      if (lower === 'office' || lower === 'staff') return '/office';
      if (lower === 'admin') return '/admin';
      return '/login';
    };

    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="card-panel" style={{ borderTop: '4px solid #dc2626' }}>
          <ShieldAlert size={56} style={{ color: '#dc2626', margin: '0 auto 1rem' }} />
          <h2 className="card-title" style={{ color: '#dc2626', fontSize: '1.35rem', marginBottom: '0.5rem' }}>
            Access Restricted (Strict Role Isolation)
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '1rem', lineHeight: 1.5 }}>
            Your account role is registered as <strong>{user.role}</strong>. You are strictly restricted from viewing or modifying other role portals (such as Warden, Staff, or Student internal consoles).
          </p>

          <div
            style={{
              backgroundColor: 'var(--bg-subtle)',
              padding: '0.85rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.825rem',
              color: 'var(--text-muted)',
              marginBottom: '1.5rem',
              textAlign: 'left',
            }}
          >
            <div>Account Identity: <strong>{user.name}</strong> ({user.email})</div>
            <div>Authorized Role: <strong>{user.role}</strong></div>
          </div>

          <Link href={getDashboardHref(user.role)} className="btn btn-primary">
            <ArrowLeft size={16} /> Return to Authorized {user.role} Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
