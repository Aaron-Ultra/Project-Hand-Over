'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Bell } from 'lucide-react';

export default function SharedNotificationsPage() {
  const notifications = [
    { id: 1, title: 'Status Update: #HST-1048', message: 'Ticket moved to In Progress by Ramesh Kumar.', time: '15 mins ago' },
    { id: 2, title: 'Notice Posted', message: 'New maintenance bulletin posted by Warden Office.', time: '1 hour ago' },
  ];

  return (
    <ProtectedRoute allowedRoles={['student', 'office', 'warden', 'admin']}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Notifications Center</h1>
            <p className="page-subtitle">Real-time alerts for your profile and grievances.</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {notifications.map((item) => (
            <div key={item.id} className="card-panel" style={{ borderLeft: '4px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <strong>{item.title}</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.time}</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.message}</p>
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
