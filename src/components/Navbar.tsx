'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth, getDashboardForRole } from '@/lib/auth';
import { LogOut, UserCheck, ShieldAlert } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="top-nav">
      <Link href={user ? getDashboardForRole(user.role) : '/'} className="brand-badge">
        <div className="brand-icon">H</div>
        <div>
          <span>HostelDesk</span>
          <span style={{ fontSize: '0.7rem', display: 'block', color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1 }}>
            Operations & Grievance Portal
          </span>
        </div>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
              <div style={{ fontWeight: 700 }}>{user.name}</div>
              <span className="badge badge-submitted" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                ROLE: {user.role}
              </span>
            </div>

            <button onClick={logout} className="btn btn-secondary btn-sm" title="Log out">
              <LogOut size={14} /> Logout
            </button>
          </div>
        ) : (
          <Link href="/" className="btn btn-primary btn-sm">
            <UserCheck size={14} /> Log In
          </Link>
        )}

        {user && (
          <Link href="/emergency" className="btn btn-danger btn-sm">
            <ShieldAlert size={14} /> Emergency SOS
          </Link>
        )}
      </div>
    </header>
  );
};
