export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';

export type Status = 'Submitted' | 'Routed' | 'In Progress' | 'Escalated' | 'Resolved' | 'More Info Needed';

export type Category = 'Plumbing' | 'Electrical' | 'Internet/Wi-Fi' | 'Carpentry' | 'Cleanliness' | 'Security' | 'Mess/Food';

export interface Complaint {
  id: string; // e.g. HST-1048
  title: string;
  category: Category;
  description: string;
  hostelBlock: string; // e.g., Block A, Block B, Girls Hostel 2
  roomNumber: string; // e.g. A-302
  studentName: string;
  studentId: string;
  studentPhone: string;
  status: Status;
  priority: Priority;
  assignedStaff?: string;
  wardenInCharge?: string;
  createdAt: string;
  updatedAt: string;
  slaDueDate: string;
  slaStatus: 'ON_TRACK' | 'WARNING' | 'BREACHED';
  resolutionNotes?: string;
  feedbackRating?: number;
  feedbackComment?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  isImportant: boolean;
  category: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  ticketId: string;
  actor: string;
  role: string;
  action: string;
  details: string;
}
