'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layers, Merge, Check } from 'lucide-react';

export default function WardenGroupsPage() {
  const [grouped, setGrouped] = useState(false);

  return (
    <ProtectedRoute allowedRoles={['warden']}>
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Duplicate Complaint Groups</h1>
            <p className="page-subtitle">Group similar complaints into a single parent ticket for efficient staff dispatch.</p>
          </div>
        </div>

        <div className="card-panel">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} style={{ color: 'var(--primary)' }} />
              Cluster: Block B Wi-Fi AP Outage
            </h3>
            <span className="badge badge-escalated">3 Similar Complaints</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: '1rem 0 1.25rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--primary-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <strong>#HST-1049: Wi-Fi Access Point Offline on 4th Floor</strong> (Parent)
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              #HST-1055: No internet in Block B East Wing 4th floor
            </div>
          </div>

          {!grouped ? (
            <button onClick={() => setGrouped(true)} className="btn btn-primary">
              <Merge size={16} /> Cluster into Parent Ticket #HST-1049
            </button>
          ) : (
            <div style={{ color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Check size={18} /> Duplicate tickets merged successfully under #HST-1049.
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
