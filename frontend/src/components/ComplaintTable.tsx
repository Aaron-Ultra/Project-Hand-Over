'use client';

import React from 'react';
import Link from 'next/link';
import { Complaint } from '@/lib/types';
import { StatusBadge, PriorityBadge } from './StatusBadge';
import { Eye, ArrowRight, UserCheck } from 'lucide-react';

interface ComplaintTableProps {
  complaints: Complaint[];
  onReassign?: (complaint: Complaint) => void;
  showWardenAction?: boolean;
}

export const ComplaintTable: React.FC<ComplaintTableProps> = ({
  complaints,
  onReassign,
  showWardenAction = false,
}) => {
  return (
    <div className="table-wrapper">
      <table className="custom-table">
        <thead>
          <tr>
            <th>Ticket ID</th>
            <th>Title & Category</th>
            <th>Location</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Assigned Staff</th>
            <th>SLA Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {complaints.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No complaints found matching criteria.
              </td>
            </tr>
          ) : (
            complaints.map((c) => (
              <tr key={c.id}>
                <td className="mono" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                  <Link href={`/complaint/${c.id}`}>{c.id}</Link>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{c.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.category}</div>
                </td>
                <td>
                  <div>{c.hostelBlock}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.roomNumber}</div>
                </td>
                <td>
                  <PriorityBadge priority={c.priority} />
                </td>
                <td>
                  <StatusBadge status={c.status} />
                </td>
                <td>
                  <span style={{ fontSize: '0.8rem', color: c.assignedStaff === 'Unassigned' ? '#dc2626' : 'inherit' }}>
                    {c.assignedStaff || 'Unassigned'}
                  </span>
                </td>
                <td>
                  <span
                    className="badge"
                    style={
                      c.slaStatus === 'BREACHED'
                        ? { backgroundColor: '#fee2e2', color: '#991b1b' }
                        : c.slaStatus === 'WARNING'
                        ? { backgroundColor: '#fef3c7', color: '#92400e' }
                        : { backgroundColor: '#dcfce7', color: '#166534' }
                    }
                  >
                    {c.slaStatus === 'BREACHED' ? 'BREACHED' : c.slaStatus === 'WARNING' ? 'NEAR SLA' : 'ON TRACK'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <Link href={`/complaint/${c.id}`} className="btn btn-secondary btn-sm">
                      <Eye size={12} /> View
                    </Link>
                    {showWardenAction && onReassign && (
                      <button onClick={() => onReassign(c)} className="btn btn-secondary btn-sm">
                        <UserCheck size={12} /> Assign
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
