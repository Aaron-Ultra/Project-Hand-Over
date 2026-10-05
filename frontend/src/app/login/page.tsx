'use client';

import React, { useState } from 'react';
import { useAuth, UserRole } from '@/lib/auth';
import { Lock, ShieldCheck, User, Wrench, BarChart3, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');
  const [email, setEmail] = useState('student@hostel.edu');
  const [password, setPassword] = useState('password123');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg(null);
    if (role === 'STUDENT') setEmail('student@hostel.edu');
    if (role === 'WARDEN') setEmail('warden@hostel.edu');
    if (role === 'STAFF') setEmail('staff@hostel.edu');
    if (role === 'ADMIN') setEmail('admin@hostel.edu');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    const res = await login(email, password);
    setIsSubmitting(false);
    if (!res.success && res.error) {
      setErrorMsg(res.error);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '2rem auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>
          HostelDesk Authentication Portal
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Strict role-based access control. Please authenticate with your official campus role.
        </p>
      </div>

      <div className="card-panel">
        <h3 className="card-title" style={{ marginBottom: '1rem' }}>Select Persona & Credentials</h3>

        {errorMsg && (
          <div style={{
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            fontSize: '0.875rem'
          }}>
            {errorMsg}
          </div>
        )}

        <div className="grid-cols-4" style={{ gap: '0.75rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => handleRoleSelect('STUDENT')}
            style={{
              border: selectedRole === 'STUDENT' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
              backgroundColor: selectedRole === 'STUDENT' ? 'var(--primary-subtle)' : 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem 0.75rem',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <User size={20} style={{ color: selectedRole === 'STUDENT' ? 'var(--primary)' : 'var(--text-muted)' }} />
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '0.5rem', color: 'var(--text-main)' }}>Student Resident</div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>File grievances & rate repairs</div>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSelect('WARDEN')}
            style={{
              border: selectedRole === 'WARDEN' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
              backgroundColor: selectedRole === 'WARDEN' ? 'var(--primary-subtle)' : 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem 0.75rem',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <ShieldCheck size={20} style={{ color: selectedRole === 'WARDEN' ? 'var(--primary)' : 'var(--text-muted)' }} />
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '0.5rem', color: 'var(--text-main)' }}>Hostel Warden</div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Triage, reassign & duplicate grouping</div>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSelect('STAFF')}
            style={{
              border: selectedRole === 'STAFF' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
              backgroundColor: selectedRole === 'STAFF' ? 'var(--primary-subtle)' : 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem 0.75rem',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <Wrench size={20} style={{ color: selectedRole === 'STAFF' ? 'var(--primary)' : 'var(--text-muted)' }} />
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '0.5rem', color: 'var(--text-main)' }}>Maintenance Staff</div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Work orders & job resolution</div>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSelect('ADMIN')}
            style={{
              border: selectedRole === 'ADMIN' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
              backgroundColor: selectedRole === 'ADMIN' ? 'var(--primary-subtle)' : 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem 0.75rem',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <BarChart3 size={20} style={{ color: selectedRole === 'ADMIN' ? 'var(--primary)' : 'var(--text-muted)' }} />
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '0.5rem', color: 'var(--text-main)' }}>Chief Admin</div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Analytics, SLA & audit trails</div>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ maxWidth: '450px', margin: '0 auto' }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Security Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%', padding: '0.65rem', marginTop: '0.5rem', opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? 'Authenticating...' : `Authenticate & Open ${selectedRole} Dashboard`} <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
