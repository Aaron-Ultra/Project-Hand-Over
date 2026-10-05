'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { INITIAL_NOTICES } from '@/lib/store';
import { Bell, Calendar, AlertTriangle } from 'lucide-react';

export default function SharedNoticesPage() {
  return (
    <ProtectedRoute allowedRoles={['student', 'office', 'warden', 'admin']}>
      <div style={{ maxWidth: '850px', margin: '0 auto' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Campus Maintenance Notices</h1>
            <p className="page-subtitle">Official announcements for all authenticated users.</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {INITIAL_NOTICES.map((notice) => (
            <div key={notice.id} className="card-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="badge badge-submitted">{notice.category}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{notice.date}</span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem' }}>{notice.title}</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{notice.content}</p>
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
