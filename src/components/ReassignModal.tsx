'use client';

import React, { useState } from 'react';
import { Complaint, Status, Priority } from '@/lib/types';
import { X, Check } from 'lucide-react';

interface ReassignModalProps {
  complaint: Complaint;
  onClose: () => void;
  onSave: (updated: Complaint) => void;
}

const STAFF_LIST = [
  'Ramesh Kumar (Plumber)',
  'Suresh Carpenter',
  'Master Electrician - Rajesh',
  'IT Helpdesk - Subodh',
  'Mess Supervisor - Gopal',
  'Sanitation Lead - Mahesh',
];

export const ReassignModal: React.FC<ReassignModalProps> = ({ complaint, onClose, onSave }) => {
  const [assignedStaff, setAssignedStaff] = useState(complaint.assignedStaff || STAFF_LIST[0]);
  const [status, setStatus] = useState<Status>(complaint.status);
  const [priority, setPriority] = useState<Priority>(complaint.priority);
  const [notes, setNotes] = useState(complaint.resolutionNotes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...complaint,
      assignedStaff,
      status,
      priority,
      resolutionNotes: notes,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="card-title">Assign & Update Ticket #{complaint.id}</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Issue Title</label>
            <input type="text" className="form-input" value={complaint.title} disabled style={{ backgroundColor: 'var(--bg-subtle)' }} />
          </div>

          <div className="form-group">
            <label className="form-label">Assign Maintenance Staff</label>
            <select className="form-select" value={assignedStaff} onChange={(e) => setAssignedStaff(e.target.value)}>
              {STAFF_LIST.map((staff) => (
                <option key={staff} value={staff}>{staff}</option>
              ))}
            </select>
          </div>

          <div className="grid-cols-2" style={{ gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Update Status</label>
              <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
                <option value="Submitted">Submitted</option>
                <option value="Routed">Routed</option>
                <option value="In Progress">In Progress</option>
                <option value="Escalated">Escalated</option>
                <option value="Resolved">Resolved</option>
                <option value="More Info Needed">More Info Needed</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority Level</label>
              <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="EMERGENCY">EMERGENCY</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Internal Operational Notes</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add instructions or diagnostic notes for staff..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary"><Check size={14} /> Update Ticket</button>
          </div>
        </form>
      </div>
    </div>
  );
};
