'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { INITIAL_COMPLAINTS } from '@/lib/store';
import { Complaint } from '@/lib/types';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { PlusCircle, Clock, CheckCircle, FileText, Star, MessageSquare } from 'lucide-react';

export default function StudentDashboard() {
  const [myComplaints, setMyComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS.slice(0, 3));
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'RESOLVED'>('ACTIVE');
  const [rating, setRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedForFeedback, setSelectedForFeedback] = useState<string | null>(null);

  const active = myComplaints.filter((c) => c.status !== 'Resolved');
  const resolved = myComplaints.filter((c) => c.status === 'Resolved');
  const displayList = activeTab === 'ACTIVE' ? active : resolved;

  const submitFeedback = (ticketId: string) => {
    setMyComplaints((prev) =>
      prev.map((c) =>
        c.id === ticketId
          ? { ...c, feedbackRating: rating, feedbackComment: feedbackText }
          : c
      )
    );
    setSelectedForFeedback(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Resident Portal</h1>
          <p className="page-subtitle">
            Track your submitted grievances, receive real-time status updates from wardens, and provide resolution feedback.
          </p>
        </div>
        <Link href="/complaint/new" className="btn btn-primary">
          <PlusCircle size={16} /> File New Complaint
        </Link>
      </div>

      <div className="grid-cols-3" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-title">My Total Filed</div>
          <div className="stat-value">{myComplaints.length}</div>
          <div className="stat-sub">Across all categories</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">In Progress / Pending</div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>{active.length}</div>
          <div className="stat-sub">Under active maintenance review</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Resolved Grievances</div>
          <div className="stat-value" style={{ color: '#059669' }}>{resolved.length}</div>
          <div className="stat-sub">Closed successfully</div>
        </div>
      </div>

      <div className="card-panel">
        <div className="card-header">
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`btn ${activeTab === 'ACTIVE' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setActiveTab('ACTIVE')}
            >
              Active Complaints ({active.length})
            </button>
            <button
              className={`btn ${activeTab === 'RESOLVED' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setActiveTab('RESOLVED')}
            >
              Resolved History ({resolved.length})
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {displayList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
              No {activeTab.toLowerCase()} complaints found for your profile.
            </div>
          ) : (
            displayList.map((c) => (
              <div
                key={c.id}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-surface)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--primary)', marginRight: '0.75rem' }}>
                      #{c.id}
                    </span>
                    <strong style={{ fontSize: '1rem' }}>{c.title}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.status} />
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  {c.description}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-light)', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <div>
                    Location: <strong>{c.hostelBlock} - {c.roomNumber}</strong> | Assigned: <strong>{c.assignedStaff || 'Pending Dispatch'}</strong>
                  </div>
                  <div>
                    Filed: {new Date(c.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {c.status === 'Resolved' && (
                  <div style={{ marginTop: '0.75rem', backgroundColor: '#f0fdf4', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#166534', marginBottom: '0.25rem' }}>
                      Resolution Note from Maintenance Staff:
                    </div>
                    <div style={{ fontSize: '0.825rem', color: '#14532d' }}>
                      {c.resolutionNotes || 'Work completed.'}
                    </div>

                    {c.feedbackRating ? (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#166534' }}>
                        Your Feedback Rating: <strong>{'★'.repeat(c.feedbackRating)} ({c.feedbackRating}/5)</strong>
                        {c.feedbackComment && <div>"{c.feedbackComment}"</div>}
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedForFeedback(selectedForFeedback === c.id ? null : c.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ marginTop: '0.5rem' }}
                      >
                        <Star size={12} /> Rate Resolution Service
                      </button>
                    )}

                    {selectedForFeedback === c.id && (
                      <div style={{ marginTop: '0.75rem', backgroundColor: '#fff', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Score (1 to 5 Stars)</label>
                        <select className="form-select" value={rating} onChange={(e) => setRating(Number(e.target.value))} style={{ marginBottom: '0.5rem' }}>
                          <option value={5}>5 Stars - Excellent Service</option>
                          <option value={4}>4 Stars - Good & Prompt</option>
                          <option value={3}>3 Stars - Average</option>
                          <option value={2}>2 Stars - Delayed / Unsatisfactory</option>
                          <option value={1}>1 Star - Poor Work</option>
                        </select>

                        <textarea
                          className="form-textarea"
                          rows={2}
                          placeholder="Optional comment about staff behavior or speed..."
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                        />

                        <button onClick={() => submitFeedback(c.id)} className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }}>
                          Submit Rating
                        </button>
                      </div>
                    )}
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
