'use client';

import React, { useState } from 'react';
import { INITIAL_COMPLAINTS } from '@/lib/store';
import { Complaint } from '@/lib/types';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { Search, Globe, AlertCircle } from 'lucide-react';

export default function PublicTrackPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [result, setResult] = useState<Complaint | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toUpperCase();
    const found = INITIAL_COMPLAINTS.find((c) => c.id === query || c.id === `HST-${query}`);
    setResult(found || null);
    setSearched(true);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Public Ticket Tracking</h1>
          <p className="page-subtitle">Track ticket status publicly without authenticating.</p>
        </div>
      </div>

      <div className="card-panel" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            required
            className="form-input"
            placeholder="Enter Ticket ID (e.g. HST-1048)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>
            <Search size={16} /> Track Status
          </button>
        </form>
      </div>

      {searched && (
        <div className="card-panel">
          {result ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <div>
                  <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                    #{result.id}
                  </span>
                  <h3 style={{ fontSize: '1.1rem', marginTop: '0.2rem' }}>{result.title}</h3>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <PriorityBadge priority={result.priority} />
                  <StatusBadge status={result.status} />
                </div>
              </div>
              <div className="grid-cols-2" style={{ gap: '1rem', fontSize: '0.85rem' }}>
                <div>Location: <strong>{result.hostelBlock} ({result.roomNumber})</strong></div>
                <div>Category: <strong>{result.category}</strong></div>
                <div>Assigned Staff: <strong>{result.assignedStaff || 'Pending'}</strong></div>
                <div>Target SLA: <strong>{new Date(result.slaDueDate).toLocaleString()}</strong></div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#dc2626' }}>
              <AlertCircle size={32} style={{ margin: '0 auto 0.5rem' }} />
              <strong>No ticket found for "{searchQuery}"</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
