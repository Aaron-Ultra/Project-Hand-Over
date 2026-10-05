'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { INITIAL_COMPLAINTS } from '@/lib/store';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { ArrowLeft, CheckCircle2, Wrench } from 'lucide-react';

export default function OfficeIssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const issueId = params.id as string;

  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('In Progress');
  const [saved, setSaved] = useState(false);

  const issue = INITIAL_COMPLAINTS.find((c) => c.id === issueId) || INITIAL_COMPLAINTS[0];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
  };

  return (
    <ProtectedRoute allowedRoles={['office']}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button onClick={() => router.back()} className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}>
          <ArrowLeft size={14} /> Back to Office Desk
        </button>

        <div className="page-header">
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="mono" style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.25rem' }}>#{issue.id}</span>
              <PriorityBadge priority={issue.priority} />
              <StatusBadge status={issue.status} />
            </div>
            <h1 className="page-title">{issue.title}</h1>
          </div>
        </div>

        {saved ? (
          <div className="card-panel" style={{ textAlign: 'center', padding: '2rem' }}>
            <CheckCircle2 size={48} style={{ color: '#059669', margin: '0 auto 0.5rem' }} />
            <h3 style={{ color: '#059669', marginBottom: '0.5rem' }}>Issue Work Order Updated</h3>
            <button onClick={() => router.push('/office')} className="btn btn-primary">Return to Office Queue</button>
          </div>
        ) : (
          <div className="card-panel">
            <h3 className="card-title" style={{ marginBottom: '0.75rem' }}>Issue Details</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>{issue.description}</p>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Location: <strong>{issue.hostelBlock} - Room {issue.roomNumber}</strong>
            </div>

            <form onSubmit={handleSave} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Update Work Order Status</label>
                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="More Info Needed">More Info Needed</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Technician Work Notes</label>
                <textarea rows={3} className="form-textarea" placeholder="Add resolution notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.65rem' }}>Update Work Order</button>
            </form>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
