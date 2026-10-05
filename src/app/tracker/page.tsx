'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { INITIAL_COMPLAINTS } from '@/lib/store';
import { ComplaintTable } from '@/components/ComplaintTable';
import { Search } from 'lucide-react';

export default function SharedTrackerPage() {
  const [search, setSearch] = useState('');

  const filtered = INITIAL_COMPLAINTS.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProtectedRoute allowedRoles={['student', 'office', 'warden', 'admin']}>
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Grievance Status Tracker</h1>
            <p className="page-subtitle">Search and inspect active complaint status across all hostel blocks.</p>
          </div>
        </div>

        <div className="card-panel" style={{ marginBottom: '1.25rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by ticket ID or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="card-panel">
          <ComplaintTable complaints={filtered} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
