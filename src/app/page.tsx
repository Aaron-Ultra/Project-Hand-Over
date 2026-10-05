'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, PROFILES_TABLE, getDashboardForRole } from '@/lib/auth';
import { Lock, ArrowRight, ShieldCheck, User, Wrench, BarChart3, Globe, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function LandingLoginPage() {
  const { user, loading, loginWithCredentials } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('student@hostel.edu');
  const [password, setPassword] = useState('password123');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!loading && user) {
      // Rule 6: If logged-in user types "/", send them to their own dashboard
      router.replace(getDashboardForRole(user.role));
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Checking session & redirecting to your dashboard...
      </div>
    );
  }

  const handleQuickSelect = (userEmail: string) => {
    setEmail(userEmail);
    setErrorMessage('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const res = await loginWithCredentials(email, password);
    if (!res.success) {
      setErrorMessage(res.error || 'Login failed');
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '1.5rem auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ fontSize: '1.85rem', marginBottom: '0.4rem' }}>
          HostelDesk Operational Portal
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Authenticate with your registered email to access your role-specific dashboard.
        </p>
      </div>

      <div className="card-panel" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card-title" style={{ marginBottom: '1rem' }}>Demo Account Quick Selector</h3>

        <div className="grid-cols-4" style={{ gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { email: 'student@hostel.edu', role: 'student', title: 'Student Resident', desc: 'Ayush Nath', icon: User },
            { email: 'office@hostel.edu', role: 'office', title: 'Office / Staff', desc: 'Ramesh Kumar', icon: Wrench },
            { email: 'warden@hostel.edu', role: 'warden', title: 'Hostel Warden', desc: 'Dr. V. K. Gupta', icon: ShieldCheck },
            { email: 'admin@hostel.edu', role: 'admin', title: 'Chief Admin', desc: 'Executive Office', icon: BarChart3 },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = email === item.email;
            return (
              <button
                key={item.email}
                type="button"
                onClick={() => handleQuickSelect(item.email)}
                style={{
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  backgroundColor: isSelected ? 'var(--primary-subtle)' : 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem 0.75rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <Icon size={18} style={{ color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }} />
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginTop: '0.4rem' }}>{item.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{item.desc}</div>
                <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--primary)', marginTop: '0.3rem' }}>
                  Role: {item.role.toUpperCase()}
                </div>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleLoginSubmit} style={{ maxWidth: '450px', margin: '0 auto' }}>
          {errorMessage && (
            <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.65rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.825rem' }}>
              {errorMessage}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Registered Account Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.65rem', marginTop: '0.5rem' }}>
            Authenticate & Open Dashboard <ArrowRight size={16} />
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <Link href="/track" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Globe size={14} /> Public Track
        </Link>
        <span>•</span>
        <Link href="/help" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <HelpCircle size={14} /> Help & FAQs
        </Link>
      </div>
    </div>
  );
}
