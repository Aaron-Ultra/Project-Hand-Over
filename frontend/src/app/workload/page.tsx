'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Building2, Wrench } from 'lucide-react';

export default function AdminWorkloadPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Maintenance Workload Matrix</h1>
            <p className="page-subtitle">Capacity and shift management for hostel maintenance departments.</p>
          </div>
        </div>

        <div className="grid-cols-3" style={{ marginBottom: '1.5rem' }}>
          <div className="card-panel">
            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Plumbing Department</h4>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.2rem 0' }}>2 Technicians</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>3 Open Orders</div>
          </div>
          <div className="card-panel">
            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Electrical Department</h4>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.2rem 0' }}>3 Technicians</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>4 Open Orders</div>
          </div>
          <div className="card-panel">
            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>IT Network Desk</h4>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.2rem 0' }}>1 Technician</div>
            <div style={{ fontSize: '0.8rem', color: '#dc2626' }}>6 Open Orders (High Load)</div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
