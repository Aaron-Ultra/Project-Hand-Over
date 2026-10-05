'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Star, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function TicketFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div style={{ maxWidth: '650px', margin: '0 auto' }}>
        <button onClick={() => router.back()} className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}>
          <ArrowLeft size={14} /> Back
        </button>

        <div className="page-header">
          <div>
            <h1 className="page-title">Resolution Feedback for Ticket #{ticketId}</h1>
            <p className="page-subtitle">Rate the service provided by maintenance staff.</p>
          </div>
        </div>

        {submitted ? (
          <div className="card-panel" style={{ textAlign: 'center', padding: '2rem' }}>
            <CheckCircle2 size={48} style={{ color: '#059669', margin: '0 auto 0.5rem' }} />
            <h3 style={{ color: '#059669', marginBottom: '0.5rem' }}>Feedback Recorded!</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Thank you for helping us improve hostel maintenance.</p>
            <button onClick={() => router.push('/dashboard')} className="btn btn-primary">Back to Dashboard</button>
          </div>
        ) : (
          <div className="card-panel">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Service Rating (1 to 5 Stars)</label>
                <select className="form-select" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                  <option value={5}>5 Stars - Excellent & Prompt</option>
                  <option value={4}>4 Stars - Good</option>
                  <option value={3}>3 Stars - Average</option>
                  <option value={2}>2 Stars - Subpar</option>
                  <option value={1}>1 Star - Unsatisfactory</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Feedback Comments</label>
                <textarea rows={3} className="form-textarea" placeholder="Optional comments on work quality..." value={comment} onChange={(e) => setComment(e.target.value)} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.65rem' }}>Submit Feedback</button>
            </form>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
