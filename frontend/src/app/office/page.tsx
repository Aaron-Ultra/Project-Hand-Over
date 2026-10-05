'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { INITIAL_COMPLAINTS } from '@/lib/store';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { Wrench, CheckCircle, Clock } from 'lucide-react';

export default function OfficeDashboardPage() {
  const [complaints, setComplaints] = useState(INITIAL_COMPLAINTS);

  return (
    <ProtectedRoute allowedRoles={['office']}>
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Maintenance Office Work Orders</h1>
            <p className="page-subtitle">Maintenance staff & office work dispatch queue.</p>
          </div>
        </div>

        <div className="grid-cols-3" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <div className="stat-title">Active Assigned Queue</div>
            <div className="stat-value">{complaints.filter((c) => c.status !== 'Resolved').length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">In Progress</div>
            <div className="stat-value" style={{ color: 'var(--primary)' }}>
              {complaints.filter((c) => c.status === 'In Progress').length}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Resolved Today</div>
            <div className="stat-value" style={{ color: '#059669' }}>
              {complaints.filter((c) => c.status === 'Resolved').length}
            </div>
          </div>
        </div>

        <div className="card-panel">
          <div className="card-header">
            <h2 className="card-title">Assigned Issue Work Orders</h2>
          </div>

          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Issue ID</th>
                  <th>Title & Location</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned Staff</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.id}>
                    <td className="mono" style={{ fontWeight: 600, color: 'var(--primary)' }}>{c.id}</td>
                    <td>
                      <strong style={{ display: 'block' }}>{c.title}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.hostelBlock} - {c.roomNumber}</span>
                    </td>
                    <td><PriorityBadge priority={c.priority} /></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td>{c.assignedStaff || 'Unassigned'}</td>
                    <td>
                      <Link href={`/office/issue/${c.id}`} className="btn btn-secondary btn-sm">
                        Inspect Issue
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
