'use client';

import React, { useState } from 'react';
import { INITIAL_COMPLAINTS } from '@/lib/store';
import { Complaint } from '@/lib/types';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { Wrench, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function StaffWorkloadPage() {
  const [complaints, setComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS);
  const [selectedStaff, setSelectedStaff] = useState('Ramesh Kumar (Plumber)');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const assignedJobs = complaints.filter((c) => c.assignedStaff === selectedStaff);

  const handleResolveJob = (id: string) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: 'Resolved',
              resolutionNotes: notes || 'Work completed by technician.',
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
    setResolvingId(null);
    setNotes('');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Technician & Maintenance Staff Console</h1>
          <p className="page-subtitle">
            View assigned work orders, update job status, and record maintenance closure notes.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Select Staff Profile:</label>
          <select className="form-select" value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)}>
            <option value="Ramesh Kumar (Plumber)">Ramesh Kumar (Plumber)</option>
            <option value="Suresh Carpenter">Suresh Carpenter</option>
            <option value="Master Electrician - Rajesh">Master Electrician - Rajesh</option>
            <option value="IT Helpdesk - Subodh">IT Helpdesk - Subodh</option>
          </select>
        </div>
      </div>

      <div className="grid-cols-3" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-title">Assigned Tickets</div>
          <div className="stat-value">{assignedJobs.length}</div>
          <div className="stat-sub">Current active queue</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">In Progress</div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>
            {assignedJobs.filter((j) => j.status === 'In Progress').length}
          </div>
          <div className="stat-sub">Under active repair</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Resolved by Me</div>
          <div className="stat-value" style={{ color: '#059669' }}>
            {assignedJobs.filter((j) => j.status === 'Resolved').length}
          </div>
          <div className="stat-sub">Closed successfully</div>
        </div>
      </div>

      <div className="card-panel">
        <div className="card-header">
          <h2 className="card-title">Assigned Work Orders for {selectedStaff}</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {assignedJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No active work orders assigned to {selectedStaff}.
            </div>
          ) : (
            assignedJobs.map((job) => (
              <div
                key={job.id}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-surface)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--primary)', marginRight: '0.75rem' }}>
                      #{job.id}
                    </span>
                    <strong style={{ fontSize: '1rem' }}>{job.title}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <PriorityBadge priority={job.priority} />
                    <StatusBadge status={job.status} />
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Location: <strong>{job.hostelBlock} - Room {job.roomNumber}</strong>
                  <p style={{ marginTop: '0.3rem' }}>{job.description}</p>
                </div>

                {job.status !== 'Resolved' ? (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                    {resolvingId === job.id ? (
                      <div>
                        <textarea
                          className="form-textarea"
                          rows={2}
                          placeholder="Describe work completed (e.g. replaced washers, tightened joints)..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button onClick={() => handleResolveJob(job.id)} className="btn btn-primary btn-sm">
                            <CheckCircle size={14} /> Submit & Close Ticket
                          </button>
                          <button onClick={() => setResolvingId(null)} className="btn btn-secondary btn-sm">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setResolvingId(job.id)} className="btn btn-primary btn-sm">
                        <CheckCircle size={14} /> Mark Ticket as Resolved
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ backgroundColor: '#f0fdf4', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: '#166534' }}>
                    Closed: {job.resolutionNotes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
