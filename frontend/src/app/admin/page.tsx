'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { INITIAL_COMPLAINTS } from '@/lib/store';
import { BarChart3, TrendingUp, CheckCircle2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const total = INITIAL_COMPLAINTS.length;
  const resolved = INITIAL_COMPLAINTS.filter((c) => c.status === 'Resolved').length;

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Executive Admin Control Dashboard</h1>
            <p className="page-subtitle">System-wide performance analytics and warden throughput.</p>
          </div>
        </div>

        <div className="grid-cols-4" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <div className="stat-title">System Resolution Rate</div>
            <div className="stat-value" style={{ color: '#059669' }}>83.3%</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Avg SLA Resolution</div>
            <div className="stat-value" style={{ color: 'var(--primary)' }}>4.2 Hours</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Active Complaints</div>
            <div className="stat-value">{total - resolved}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Student Rating</div>
            <div className="stat-value">4.8 / 5.0</div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
