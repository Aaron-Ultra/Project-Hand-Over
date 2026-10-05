'use client';

import React from 'react';
import { HelpCircle, PhoneCall, ShieldAlert, FileText } from 'lucide-react';

export default function PublicHelpPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Help & Frequently Asked Questions</h1>
          <p className="page-subtitle">Public guidance on hostel maintenance policies, emergency hotlines, and SLA guidelines.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="card-panel">
          <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>How do guaranteed SLAs work?</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            EMERGENCY issues (sparking, gas leakage) are assigned a 2-hour resolution window. HIGH priority issues have an 8-hour target, and standard issues are resolved within 24 hours.
          </p>
        </div>

        <div className="card-panel">
          <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>Who reviews my complaints?</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Complaints are triaged by the Hostel Warden Office and dispatched to dedicated maintenance technicians (Plumbers, Electricians, Carpenters, IT staff).
          </p>
        </div>
      </div>
    </div>
  );
}
