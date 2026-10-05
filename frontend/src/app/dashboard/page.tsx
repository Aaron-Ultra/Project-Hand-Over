'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { INITIAL_COMPLAINTS } from '@/lib/store';
import { Complaint } from '@/lib/types';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { PlusCircle, Star, MessageSquare } from 'lucide-react';

export default function StudentDashboardPage() {
  const [myComplaints, setMyComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS.slice(0, 3));
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'RESOLVED'>('ACTIVE');

  const active = myComplaints.filter((c) => c.status !== 'Resolved');
  const resolved = myComplaints.filter((c) => c.status === 'Resolved');
  const displayList = activeTab === 'ACTIVE' ? active : resolved;

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Student Resident Dashboard</h1>
            <p className="page-subtitle">Track your submitted grievances, receive updates, and provide feedback.</p>
          </div>
          <Link href="/new" className="btn btn-primary">
            <PlusCircle size={16} /> File New Complaint
          </Link>
        </div>

        <div className="grid-cols-3" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <div className="stat-title">Total Filed</div>
            <div className="stat-value">{myComplaints.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">In Progress</div>
            <div className="stat-value" style={{ color: 'var(--primary)' }}>{active.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Resolved</div>
            <div className="stat-value" style={{ color: '#059669' }}>{resolved.length}</div>
          </div>
        </div>

        <div className="card-panel">
          <div className="card-header">
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className={`btn ${activeTab === 'ACTIVE' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setActiveTab('ACTIVE')}>
                Active Complaints ({active.length})
              </button>
              <button className={`btn ${activeTab === 'RESOLVED' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setActiveTab('RESOLVED')}>
                Resolved History ({resolved.length})
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {displayList.map((c) => (
              <div key={c.id} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1.25rem', backgroundColor: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
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

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{c.description}</p>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link href={`/complaint/${c.id}`} className="btn btn-secondary btn-sm">
                    View Details
                  </Link>
                  <Link href={`/complaint/${c.id}/reply`} className="btn btn-secondary btn-sm">
                    <MessageSquare size={12} /> Reply
                  </Link>
                  {c.status === 'Resolved' && (
                    <Link href={`/complaint/${c.id}/feedback`} className="btn btn-primary btn-sm">
                      <Star size={12} /> Give Feedback
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
