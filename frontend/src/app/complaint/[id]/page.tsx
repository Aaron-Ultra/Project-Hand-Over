'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { INITIAL_COMPLAINTS, INITIAL_AUDIT_LOGS } from '@/lib/store';
import { Complaint } from '@/lib/types';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { ArrowLeft, Clock, User, Phone, MapPin, AlertCircle, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function ComplaintDetailPage() {
  const params = useParams();
  const ticketId = params.id as string;

  const [complaint, setComplaint] = useState<Complaint>(() => {
    return (
      INITIAL_COMPLAINTS.find((c) => c.id === ticketId) || {
        id: ticketId || 'HST-1048',
        title: 'Water Leakage in Bathroom Pipe',
        category: 'Plumbing',
        description: 'Main pipe connector under sink cracked causing water overflow in Room 302 bathroom.',
        hostelBlock: 'Block A (Men)',
        roomNumber: 'A-302',
        studentName: 'Rohan Sharma',
        studentId: '2023CSB1042',
        studentPhone: '+91 98765-43210',
        status: 'In Progress',
        priority: 'HIGH',
        assignedStaff: 'Ramesh Kumar (Plumber)',
        wardenInCharge: 'Dr. V. K. Gupta',
        createdAt: '2026-10-04T08:30:00Z',
        updatedAt: '2026-10-04T11:15:00Z',
        slaDueDate: '2026-10-04T16:30:00Z',
        slaStatus: 'ON_TRACK',
        resolutionNotes: 'Technician dispatched with replacement pipe fittings.',
      }
    );
  });

  const auditLogs = INITIAL_AUDIT_LOGS.filter((l) => l.ticketId === complaint.id);

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/" className="btn btn-secondary btn-sm">
          <ArrowLeft size={14} /> Back to Registry
        </Link>
      </div>

      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
              #{complaint.id}
            </span>
            <PriorityBadge priority={complaint.priority} />
            <StatusBadge status={complaint.status} />
          </div>
          <h1 className="page-title">{complaint.title}</h1>
        </div>
      </div>

      <div className="grid-cols-3" style={{ gap: '1.25rem' }}>
        {/* Left Column: Complaint Details */}
        <div style={{ gridColumn: 'span 2' }}>
          <div className="card-panel" style={{ marginBottom: '1.25rem' }}>
            <h3 className="card-title">Issue Description & Specifications</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', margin: '1rem 0 1.5rem', lineHeight: 1.6 }}>
              {complaint.description}
            </p>

            <div className="grid-cols-2" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Category</div>
                <div style={{ fontWeight: 600, marginTop: '0.2rem' }}>{complaint.category}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Hostel Location</div>
                <div style={{ fontWeight: 600, marginTop: '0.2rem' }}>{complaint.hostelBlock} - Room {complaint.roomNumber}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Date Logged</div>
                <div style={{ fontWeight: 600, marginTop: '0.2rem' }}>{new Date(complaint.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>SLA Due Target</div>
                <div style={{ fontWeight: 600, marginTop: '0.2rem' }}>{new Date(complaint.slaDueDate).toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Operational Progress Timeline */}
          <div className="card-panel">
            <h3 className="card-title">Audit Trail & Work History</h3>
            <div style={{ position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid var(--border-color)', margin: '1rem 0' }}>
              {auditLogs.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Ticket created. Pending initial warden review.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} style={{ marginBottom: '1.25rem', position: 'relative' }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: '-1.95rem',
                        top: '0.1rem',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary)',
                      }}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.timestamp}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.action} by {log.actor} ({log.role})</div>
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{log.details}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Stakeholders & Contacts */}
        <div>
          <div className="card-panel" style={{ marginBottom: '1.25rem' }}>
            <h3 className="card-title">Assigned Personnel</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', margin: '1rem 0' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assigned Maintenance Staff</div>
                <div style={{ fontWeight: 600, color: complaint.assignedStaff === 'Unassigned' ? '#dc2626' : 'inherit' }}>
                  {complaint.assignedStaff || 'Unassigned'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hostel Warden In-Charge</div>
                <div style={{ fontWeight: 600 }}>{complaint.wardenInCharge}</div>
              </div>
            </div>
          </div>

          <div className="card-panel">
            <h3 className="card-title">Student Resident Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: '1rem 0', fontSize: '0.85rem' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Name</div>
                <strong>{complaint.studentName}</strong>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Roll Number</div>
                <strong className="mono">{complaint.studentId}</strong>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Phone Contact</div>
                <strong>{complaint.studentPhone}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
