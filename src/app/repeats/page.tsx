'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Repeat, AlertTriangle } from 'lucide-react';

export default function WardenRepeatsPage() {
  return (
    <ProtectedRoute allowedRoles={['warden']}>
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Repeat & Recurring Grievances</h1>
            <p className="page-subtitle">Identify chronic infrastructure faults recurring in the same rooms or blocks.</p>
          </div>
        </div>

        <div className="card-panel">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Repeat size={18} style={{ color: '#d97706' }} />
              Flagged Recurring Fault: Block A Bathroom Water Pipe
            </h3>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Room A-302 has registered 3 plumbing leaks in the last 30 days. Recommend complete riser pipe replacement rather than patch repair.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
