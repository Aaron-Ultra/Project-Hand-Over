'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { INITIAL_AUDIT_LOGS } from '@/lib/store';
import { FileCheck2 } from 'lucide-react';

export default function AdminAuditPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">System Audit Trail</h1>
            <p className="page-subtitle">Immutable log of ticket updates and warden actions.</p>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Ticket ID</th>
                <th>Actor</th>
                <th>Role</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {INITIAL_AUDIT_LOGS.map((log) => (
                <tr key={log.id}>
                  <td className="mono" style={{ fontSize: '0.75rem' }}>{log.timestamp}</td>
                  <td className="mono" style={{ fontWeight: 600, color: 'var(--primary)' }}>{log.ticketId}</td>
                  <td><strong>{log.actor}</strong></td>
                  <td><span className="badge badge-submitted">{log.role}</span></td>
                  <td><span className="mono" style={{ fontWeight: 600 }}>{log.action}</span></td>
                  <td style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ProtectedRoute>
  );
}
