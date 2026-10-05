'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Category, Priority } from '@/lib/types';
import { CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { submitComplaintToBackend } from '@/lib/api';

export default function NewComplaintPage() {
  const router = useRouter();
  const { token, user } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Plumbing');
  const [hostelBlock, setHostelBlock] = useState('Block A (Men)');
  const [roomNumber, setRoomNumber] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [studentName, setStudentName] = useState(user?.name || 'Ayush Nath');
  const [studentId, setStudentId] = useState(user?.studentId || '2024CSB1090');
  const [studentPhone, setStudentPhone] = useState(user?.phone || '+91 98765-12345');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [newTicketId, setNewTicketId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

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
      setNewTicketId(generatedId);
      setIsSubmitted(true);
    } else {
      setErrorMessage(result.error || 'Failed to register complaint. Please try again.');
    }
  };

  if (isSubmitted) {
    return (
      <div style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
        <div className="card-panel">
          <div style={{ color: '#059669', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            <CheckCircle2 size={56} />
          </div>
          <h2 className="page-title" style={{ color: '#059669', marginBottom: '0.5rem' }}>
            Grievance Logged Successfully!
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Your complaint has been registered under official ticket tracking identifier:
          </p>

          <div
            className="mono"
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--primary)',
              backgroundColor: 'var(--primary-subtle)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.5rem',
              letterSpacing: '0.05em'
            }}
          >
            #{newTicketId}
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            The Hostel Warden in charge (<strong>Dr. V. K. Gupta</strong>) has been automatically notified. Guaranteed SLA response time for priority <strong>{priority}</strong> is <strong>24 Hours</strong>.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            <Link href="/dashboard" className="btn btn-primary">
              View My Dashboard
            </Link>
            <button
              onClick={() => {
                setIsSubmitted(false);
                setTitle('');
                setDescription('');
                setRoomNumber('');
              }}
              className="btn btn-secondary"
            >
              File Another Complaint
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/" className="btn btn-secondary btn-sm">
          <ArrowLeft size={14} /> Back to Portal Overview
        </Link>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">File Infrastructure Grievance</h1>
          <p className="page-subtitle">
            Provide precise location and breakdown detail to allow instant operational dispatch.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="card-panel">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Complaint Title / Summary *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g., Geyser leaking water in bathroom / No power in socket 2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Internet/Wi-Fi">Internet/Wi-Fi</option>
                <option value="Carpentry">Carpentry</option>
                <option value="Cleanliness">Cleanliness</option>
                <option value="Mess/Food">Mess/Food</option>
                <option value="Security">Security</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority Level *</label>
              <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                <option value="LOW">LOW - Non-urgent fixture repair</option>
                <option value="MEDIUM">MEDIUM - Standard room maintenance</option>
                <option value="HIGH">HIGH - Urgent disruption (No water / light)</option>
                <option value="EMERGENCY">EMERGENCY - Sparking, gas, structural hazard</option>
              </select>
            </div>
          </div>

          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">Hostel Block *</label>
              <select className="form-select" value={hostelBlock} onChange={(e) => setHostelBlock(e.target.value)}>
                <option value="Block A (Men)">Block A (Men's Hostel)</option>
                <option value="Block B (Men)">Block B (Men's Hostel)</option>
                <option value="Block C (Men)">Block C (Men's Hostel)</option>
                <option value="Girls Hostel 1">Girls Hostel 1</option>
                <option value="Girls Hostel 2">Girls Hostel 2</option>
                <option value="Central Mess Hall">Central Mess Hall</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Room / Specific Location *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Room A-302 / 2nd Floor Common Washroom"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Breakdown Description *</label>
            <textarea
              required
              rows={4}
              className="form-textarea"
              placeholder="Describe the issue, time of onset, and any safety hazards observed..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Resident Verification Details</h4>
            <div className="grid-cols-3" style={{ gap: '0.5rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Student Name</label>
                <input type="text" className="form-input" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Roll / Student ID</label>
                <input type="text" className="form-input" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Contact Phone</label>
                <input type="text" className="form-input" value={studentPhone} onChange={(e) => setStudentPhone(e.target.value)} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={() => router.back()} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Registering...</> : 'Register Complaint Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
