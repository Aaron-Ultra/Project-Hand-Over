'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MessageSquare, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function TicketReplyPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [message, setMessage] = useState('');
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
            <h1 className="page-title">Reply to Warden / Staff on Ticket #{ticketId}</h1>
            <p className="page-subtitle">Provide additional information requested by the maintenance team.</p>
          </div>
        </div>

        {submitted ? (
          <div className="card-panel" style={{ textAlign: 'center', padding: '2rem' }}>
            <CheckCircle2 size={48} style={{ color: '#059669', margin: '0 auto 0.5rem' }} />
            <h3 style={{ color: '#059669', marginBottom: '0.5rem' }}>Reply Sent!</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>The warden and staff have been notified.</p>
            <button onClick={() => router.push('/dashboard')} className="btn btn-primary">Back to Dashboard</button>
          </div>
        ) : (
          <div className="card-panel">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Your Message / Clarification *</label>
                <textarea rows={4} required className="form-textarea" placeholder="Provide detail e.g., Available between 2 PM to 5 PM..." value={message} onChange={(e) => setMessage(e.target.value)} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.65rem' }}>Send Reply</button>
            </form>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
