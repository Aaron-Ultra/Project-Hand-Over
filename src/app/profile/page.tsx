'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth';
import { User, Mail, Phone, Building2, Home } from 'lucide-react';

export default function StudentProfilePage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div style={{ maxWidth: '650px', margin: '0 auto' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Student Profile</h1>
            <p className="page-subtitle">Your verified resident profile details.</p>
          </div>
        </div>

        <div className="card-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700 }}>
              {user?.name.charAt(0)}
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{user?.name}</h3>
              <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>ID: {user?.studentId}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email</div>
              <strong>{user?.email}</strong>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hostel Location</div>
              <strong>{user?.hostelBlock} - Room {user?.roomNumber}</strong>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone</div>
              <strong>{user?.phone}</strong>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
