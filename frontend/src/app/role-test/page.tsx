'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth, Role, PROFILES_TABLE, getDashboardForRole } from '@/lib/auth';
import { CheckCircle2, XCircle, Shield, User, ArrowRight } from 'lucide-react';

interface RouteDefinition {
  path: string;
  label: string;
  category: string;
  allowedRoles: Role[] | 'public';
}

const ALL_ROUTES: RouteDefinition[] = [
  // Public
  { path: '/', label: 'Landing Login', category: 'Public (No Login)', allowedRoles: 'public' },
  { path: '/track', label: 'Public Track', category: 'Public (No Login)', allowedRoles: 'public' },
  { path: '/help', label: 'Help & FAQs', category: 'Public (No Login)', allowedRoles: 'public' },

  // Student
  { path: '/dashboard', label: 'Student Dashboard', category: 'Student Routes', allowedRoles: ['student'] },
  { path: '/new', label: 'New Complaint', category: 'Student Routes', allowedRoles: ['student'] },
  { path: '/complaint/HST-1048', label: 'Complaint Inspector', category: 'Student Routes', allowedRoles: ['student'] },
  { path: '/complaint/HST-1048/feedback', label: 'Complaint Feedback', category: 'Student Routes', allowedRoles: ['student'] },
  { path: '/complaint/HST-1048/reply', label: 'Complaint Reply', category: 'Student Routes', allowedRoles: ['student'] },
  { path: '/mess', label: 'Mess Feedback', category: 'Student Routes', allowedRoles: ['student'] },
  { path: '/profile', label: 'Student Profile', category: 'Student Routes', allowedRoles: ['student'] },

  // Office
  { path: '/office', label: 'Office Dashboard', category: 'Office Routes', allowedRoles: ['office'] },
  { path: '/office/issue/HST-1048', label: 'Office Issue Inspector', category: 'Office Routes', allowedRoles: ['office'] },

  // Warden
  { path: '/warden', label: 'Warden Dashboard', category: 'Warden Routes', allowedRoles: ['warden'] },
  { path: '/groups', label: 'Duplicate Groups', category: 'Warden Routes', allowedRoles: ['warden'] },
  { path: '/sla', label: 'SLA Tracking', category: 'Warden Routes', allowedRoles: ['warden'] },
  { path: '/repeats', label: 'Repeat Complaints', category: 'Warden Routes', allowedRoles: ['warden'] },

  // Admin
  { path: '/admin', label: 'Admin Dashboard', category: 'Admin Routes', allowedRoles: ['admin'] },
  { path: '/audit', label: 'Audit Log', category: 'Admin Routes', allowedRoles: ['admin'] },
  { path: '/workload', label: 'Workload Matrix', category: 'Admin Routes', allowedRoles: ['admin'] },

  // Shared
  { path: '/notices', label: 'Notices', category: 'Shared Logged-In Routes', allowedRoles: ['student', 'office', 'warden', 'admin'] },
  { path: '/notifications', label: 'Notifications', category: 'Shared Logged-In Routes', allowedRoles: ['student', 'office', 'warden', 'admin'] },
  { path: '/emergency', label: 'Emergency', category: 'Shared Logged-In Routes', allowedRoles: ['student', 'office', 'warden', 'admin'] },
  { path: '/tracker', label: 'Tracker', category: 'Shared Logged-In Routes', allowedRoles: ['student', 'office', 'warden', 'admin'] },
];

export default function RoleTestDevPage() {
  const { user, loginWithCredentials, logout } = useAuth();

  const isRouteAllowed = (allowed: Role[] | 'public') => {
    if (allowed === 'public') return true;
    if (!user) return false;
    return allowed.includes(user.role);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ backgroundColor: '#fffbe6', border: '1px solid #ffe58f', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
        <strong style={{ color: '#d48800' }}>[DEV ONLY] Role Access Matrix Tester (`/role-test`)</strong>
        <p style={{ fontSize: '0.85rem', color: '#8c6b00', marginTop: '0.2rem' }}>
          This page tests route permission evaluation for the active session. Remember to remove before production.
        </p>
      </div>

      {/* Session Controls */}
      <div className="card-panel" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card-title" style={{ marginBottom: '0.75rem' }}>Active User Persona & Session</h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            {user ? (
              <div>
                Logged in as: <strong>{user.name}</strong> ({user.email}) | Role: <span className="badge badge-submitted" style={{ textTransform: 'uppercase', fontWeight: 700 }}>{user.role}</span>
              </div>
            ) : (
              <div style={{ color: '#dc2626', fontWeight: 600 }}>Not Logged In (Public Guest)</div>
            )}
          </div>
          {user && (
            <button onClick={logout} className="btn btn-secondary btn-sm">
              Log Out
            </button>
          )}
        </div>

        <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
          Switch Mock User Persona:
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {Object.values(PROFILES_TABLE).map((p) => (
            <button
              key={p.email}
              onClick={() => loginWithCredentials(p.email, 'pass')}
              className={`btn ${user?.email === p.email ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            >
              {p.role.toUpperCase()}: {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Route Access Matrix Table */}
      <div className="card-panel">
        <h3 className="card-title" style={{ marginBottom: '1rem' }}>Complete Route Permission Matrix</h3>

        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Route Path</th>
                <th>Route Name</th>
                <th>Category</th>
                <th>Ownership Rules</th>
                <th>Access Status for ({user?.role.toUpperCase() || 'PUBLIC'})</th>
              </tr>
            </thead>
            <tbody>
              {ALL_ROUTES.map((route) => {
                const allowed = isRouteAllowed(route.allowedRoles);
                return (
                  <tr key={route.path}>
                    <td className="mono" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      <Link href={route.path}>{route.path}</Link>
                    </td>
                    <td><strong>{route.label}</strong></td>
                    <td><span className="badge badge-submitted">{route.category}</span></td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {route.allowedRoles === 'public' ? 'Public' : route.allowedRoles.join(', ')}
                      </span>
                    </td>
                    <td>
                      {allowed ? (
                        <span style={{ color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <CheckCircle2 size={14} /> ALLOWED
                        </span>
                      ) : (
                        <span style={{ color: '#dc2626', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <XCircle size={14} /> BLOCKED (Redirects to {user ? getDashboardForRole(user.role) : '/'})
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
