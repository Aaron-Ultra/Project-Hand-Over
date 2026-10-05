'use client';

import React from 'react';
import { RoleGuard } from '@/components/RoleGuard';
import { Building2, Users, CheckCircle2, Clock } from 'lucide-react';

export default function OfficeWorkloadPage() {
  return (
    <RoleGuard allowedRoles={['WARDEN', 'ADMIN']}>
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Warden Office Workload & Resource Allocation</h1>
            <p className="page-subtitle">
              Operational matrix monitoring technician shift availability, active queue length, and department backlog.
            </p>
          </div>
        </div>

        <div className="grid-cols-3" style={{ marginBottom: '1.5rem' }}>
          <div className="card-panel">
            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Plumbing Wing</h4>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.2rem 0' }}>2 Staff On Duty</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Active Queue: 3 Tickets</div>
          </div>

          <div className="card-panel">
            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Electrical Wing</h4>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.2rem 0' }}>3 Staff On Duty</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Active Queue: 4 Tickets</div>
          </div>

          <div className="card-panel">
            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>IT & Wi-Fi Desk</h4>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.2rem 0' }}>1 Staff On Duty</div>
            <div style={{ fontSize: '0.8rem', color: '#dc2626' }}>Active Queue: 6 Tickets (Overloaded)</div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
