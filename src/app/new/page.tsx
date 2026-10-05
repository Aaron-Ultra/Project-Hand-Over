'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Category, Priority } from '@/lib/types';
import { CheckCircle2, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { submitComplaintToBackend } from '@/lib/api';

export default function NewComplaintPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Plumbing');
  const [hostelBlock, setHostelBlock] = useState('Block A (Men)');
  const [roomNumber, setRoomNumber] = useState('A-302');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [submittedId, setSubmittedId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await submitComplaintToBackend(
        {
          title,
          text: description,
          block: hostelBlock,
          room: roomNumber,
          category: category.toLowerCase(),
          urgency: priority === 'HIGH' || priority === 'EMERGENCY' ? 'urgent' : 'normal',
        },
        token
      );

      setIsSubmitting(false);

      if (result.success) {
        const generatedId = result.data?.issue?.public_id || result.data?.complaint?.public_id || result.data?.complaint?.id || `HST-${Math.floor(1000 + Math.random() * 9000)}`;
        setSubmittedId(generatedId);
      } else {
        console.error('Failed to submit complaint:', result.error);
        setErrorMessage(result.error || 'Failed to submit complaint. Please check server connection.');
      }
    } catch (err: any) {
      console.error('Unexpected exception during complaint submission:', err);
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'An unexpected error occurred while processing your request.');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div style={{ maxWidth: '750px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/dashboard" className="btn btn-secondary btn-sm">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
        </div>

        <div className="page-header">
          <div>
            <h1 className="page-title">Submit Infrastructure Grievance</h1>
            <p className="page-subtitle">Registered under Student Profile.</p>
          </div>
        </div>

        {errorMessage && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {submittedId ? (
          <div className="card-panel" style={{ textAlign: 'center', padding: '2rem' }}>
            <CheckCircle2 size={48} style={{ color: '#059669', margin: '0 auto 0.75rem' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#059669', marginBottom: '0.5rem' }}>
              Ticket Created Successfully!
            </h2>
            <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1.25rem' }}>
              #{submittedId}
            </div>
            <Link href="/dashboard" className="btn btn-primary">
              Return to Student Dashboard
            </Link>
          </div>
        ) : (
          <div className="card-panel">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Complaint Title *</label>
                <input type="text" required className="form-input" placeholder="e.g. Geyser leaking in bathroom" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Internet/Wi-Fi">Internet/Wi-Fi</option>
                    <option value="Carpentry">Carpentry</option>
                    <option value="Mess/Food">Mess/Food</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="EMERGENCY">EMERGENCY</option>
                  </select>
                </div>
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Hostel Block</label>
                  <input type="text" className="form-input" value={hostelBlock} onChange={(e) => setHostelBlock(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Room Number</label>
                  <input type="text" className="form-input" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea rows={4} required className="form-textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%', padding: '0.65rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Submitting to System...</> : 'Submit Complaint'}
              </button>
            </form>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
