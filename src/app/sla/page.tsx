'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { INITIAL_COMPLAINTS } from '@/lib/store';
import { ComplaintTable } from '@/components/ComplaintTable';
import { Clock } from 'lucide-react';

export default function WardenSLAPage() {
  const breached = INITIAL_COMPLAINTS.filter((c) => c.slaStatus === 'BREACHED');

  return (
    <ProtectedRoute allowedRoles={['warden']}>
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">SLA Compliance & Guaranteed Turnaround</h1>
            <p className="page-subtitle">Track tickets nearing breach or past target resolution window.</p>
          </div>
        </div>

        <div className="card-panel" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title" style={{ color: '#dc2626' }}>Breached SLA Tickets ({breached.length})</h3>
          </div>
          <ComplaintTable complaints={breached} />
        </div>

        <div className="card-panel">
          <div className="card-header">
            <h3 className="card-title">All SLA Tracked Tickets</h3>
          </div>
          <ComplaintTable complaints={INITIAL_COMPLAINTS} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
