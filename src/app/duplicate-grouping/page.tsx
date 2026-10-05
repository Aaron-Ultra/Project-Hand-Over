'use client';

import React, { useState } from 'react';
import { RoleGuard } from '@/components/RoleGuard';
import { INITIAL_COMPLAINTS } from '@/lib/store';
import { Layers, Merge, Check, AlertTriangle } from 'lucide-react';

export default function DuplicateGroupingPage() {
  const [grouped, setGrouped] = useState(false);

  return (
    <RoleGuard allowedRoles={['warden', 'admin']}>
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Duplicate Complaint Clustering & Grouping</h1>
            <p className="page-subtitle">
              Stitch Operational Feature: Detect duplicate complaints filed by different residents in the same block/corridor and merge them into a single parent work order.
            </p>
          </div>
        </div>

        <div className="card-panel" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} style={{ color: 'var(--primary)' }} />
              Detected High-Similarity Cluster: Block B Wi-Fi AP-B4 Outage
            </h3>
            <span className="badge badge-escalated">3 Similar Complaints</span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            The following 3 tickets were filed within 45 minutes targeting the same physical infrastructure node (4th Floor Corridor Wi-Fi):
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {[
              { id: 'HST-1049', title: 'Wi-Fi Access Point Offline on 4th Floor', student: 'Ananya Verma (Room 402)', time: '19:45' },
              { id: 'HST-1055', title: 'No internet in Block B East Wing 4th floor', student: 'Karan Mehra (Room 408)', time: '20:10' },
              { id: 'HST-1058', title: 'Wi-Fi router lights blinking red near room 412', student: 'Siddharth N. (Room 412)', time: '20:30' },
            ].map((ticket, idx) => (
              <div key={ticket.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: idx === 0 ? 'var(--primary-subtle)' : 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div>
                  <span className="mono" style={{ fontWeight: 700, marginRight: '0.75rem', color: 'var(--primary)' }}>
                    #{ticket.id} {idx === 0 && '(Parent Ticket)'}
                  </span>
                  <strong>{ticket.title}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Filed by {ticket.student} at {ticket.time}</div>
                </div>
                <span className="badge badge-submitted">{idx === 0 ? 'PARENT' : 'CHILD DUPLICATE'}</span>
              </div>
            ))}
          </div>

          {!grouped ? (
            <button onClick={() => setGrouped(true)} className="btn btn-primary">
              <Merge size={16} /> Cluster into Parent Ticket #HST-1049
            </button>
          ) : (
            <div style={{ backgroundColor: '#f0fdf4', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Check size={18} /> Duplicate tickets clustered successfully under parent #HST-1049. Single dispatch sent to IT Helpdesk.
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
