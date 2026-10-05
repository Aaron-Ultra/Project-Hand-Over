'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { INITIAL_COMPLAINTS } from '@/lib/store';
import { Complaint } from '@/lib/types';
import { ComplaintTable } from '@/components/ComplaintTable';
import { ReassignModal } from '@/components/ReassignModal';
import { ShieldCheck, UserCheck } from 'lucide-react';

export default function WardenDashboardPage() {
  const [complaints, setComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS);
  const [reassignTarget, setReassignTarget] = useState<Complaint | null>(null);

  const pending = complaints.filter((c) => c.status === 'Submitted' || c.assignedStaff === 'Unassigned');

  const handleUpdate = (updated: Complaint) => {
    setComplaints((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  return (
    <ProtectedRoute allowedRoles={['warden']}>
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Warden Triage & Dispatch Desk</h1>
            <p className="page-subtitle">Review incoming grievances, assign specialist technicians, and handle escalations.</p>
          </div>
        </div>

        <div className="grid-cols-3" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card" style={{ borderLeft: '4px solid #d97706' }}>
            <div className="stat-title">Pending Assignment</div>
            <div className="stat-value" style={{ color: '#d97706' }}>{pending.length}</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #dc2626' }}>
            <div className="stat-title" style={{ color: '#dc2626' }}>Emergency Priority</div>
            <div className="stat-value" style={{ color: '#dc2626' }}>{complaints.filter((c) => c.priority === 'EMERGENCY').length}</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <div className="stat-title">Total Active Dispatches</div>
            <div className="stat-value">{complaints.length}</div>
          </div>
        </div>

        <div className="card-panel">
          <div className="card-header">
            <h2 className="card-title">All Hostel Complaints Registry</h2>
          </div>

          <ComplaintTable complaints={complaints} showWardenAction={true} onReassign={(c) => setReassignTarget(c)} />
        </div>

        {reassignTarget && (
          <ReassignModal complaint={reassignTarget} onClose={() => setReassignTarget(null)} onSave={handleUpdate} />
        )}
      </div>
    </ProtectedRoute>
  );
}
