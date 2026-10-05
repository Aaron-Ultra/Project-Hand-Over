'use client';

import React, { useState } from 'react';
import { INITIAL_COMPLAINTS } from '@/lib/store';
import { Complaint } from '@/lib/types';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { Search, Globe, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PublicTrackerPage() {
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
          <h1 className="page-title">Public Complaint Tracking Portal</h1>
          <p className="page-subtitle">
            Search any registered ticket identifier to view live resolution status without logging in.
          </p>
        </div>
      </div>

      <div className="card-panel" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            required
            className="form-input"
            placeholder="Enter Ticket Reference ID (e.g. HST-1048 or 1048)"
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
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Location</div>
                  <strong>{result.hostelBlock} ({result.roomNumber})</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Category</div>
                  <strong>{result.category}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Assigned Staff</div>
                  <strong>{result.assignedStaff || 'Pending Dispatch'}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Target SLA Due</div>
                  <strong>{new Date(result.slaDueDate).toLocaleString()}</strong>
                </div>
              </div>

              {result.resolutionNotes && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Resolution / Update Notes</div>
                  <div style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>{result.resolutionNotes}</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#dc2626' }}>
              <AlertCircle size={32} style={{ margin: '0 auto 0.5rem' }} />
              <strong>No complaint record found matching "{searchQuery}"</strong>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Please verify ticket format (e.g. HST-1048, HST-1049, HST-1052).
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
