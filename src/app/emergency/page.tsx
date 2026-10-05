'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ShieldAlert, PhoneCall, CheckCircle2 } from 'lucide-react';

export default function SharedEmergencyPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <ProtectedRoute allowedRoles={['student', 'office', 'warden', 'admin']}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title" style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={28} /> Emergency Hazard Hotline
            </h1>
            <p className="page-subtitle">Immediate emergency broadcast for fire, electrical, or medical hazards.</p>
          </div>
        </div>

        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', color: '#991b1b', fontSize: '0.85rem' }}>
          <strong>Control Room Hotlines:</strong> Hostel Desk: +91 99999-00001 | Electrician: +91 99999-00002
        </div>

        {submitted ? (
          <div className="card-panel" style={{ textAlign: 'center', padding: '2rem' }}>
            <CheckCircle2 size={48} style={{ color: '#059669', margin: '0 auto 0.5rem' }} />
            <h3 style={{ color: '#059669' }}>Emergency Broadcast Dispatched</h3>
          </div>
        ) : (
          <div className="card-panel">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Hazard Category *</label>
                <select className="form-select" required>
                  <option value="Electrical Sparking">Electrical Sparking / Short Circuit</option>
                  <option value="Gas Leakage / Fire">Gas Leakage / Fire</option>
                  <option value="Medical Emergency">Medical Emergency</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Location / Room *</label>
                <input type="text" className="form-input" required placeholder="e.g. Block A Room 302" />
              </div>

              <button type="submit" className="btn btn-danger" style={{ width: '100%', padding: '0.75rem' }}>
                <ShieldAlert size={18} /> Broadcast Emergency Signal
              </button>
            </form>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
