import React from 'react';
import { Status, Priority } from '@/lib/types';
import { Clock, AlertTriangle, CheckCircle, ShieldAlert, FileText, ArrowRightLeft } from 'lucide-react';

interface StatusBadgeProps {
  status: Status;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'Submitted':
      return <span className="badge badge-submitted"><FileText size={12} /> Submitted</span>;
    case 'Routed':
      return <span className="badge badge-routed"><ArrowRightLeft size={12} /> Routed</span>;
    case 'In Progress':
      return <span className="badge badge-in-progress"><Clock size={12} /> In Progress</span>;
    case 'Escalated':
      return <span className="badge badge-escalated"><AlertTriangle size={12} /> Escalated</span>;
    case 'Resolved':
      return <span className="badge badge-resolved"><CheckCircle size={12} /> Resolved</span>;
    case 'More Info Needed':
      return <span className="badge badge-more-info"><AlertTriangle size={12} /> Info Needed</span>;
    default:
      return <span className="badge badge-submitted">{status}</span>;
  }
};

export const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  if (priority === 'EMERGENCY') {
    return <span className="badge badge-emergency"><ShieldAlert size={12} /> EMERGENCY</span>;
  }
  if (priority === 'HIGH') {
    return <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>High</span>;
  }
  if (priority === 'MEDIUM') {
    return <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>Medium</span>;
  }
  return <span className="badge" style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>Low</span>;
};
