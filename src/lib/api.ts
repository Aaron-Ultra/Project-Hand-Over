import { supabase } from './supabase';
import { Complaint, Notice, AuditLogItem, Category } from './types';
import { INITIAL_COMPLAINTS, INITIAL_NOTICES, INITIAL_AUDIT_LOGS } from './store';

const API_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env && ((import.meta as any).env.VITE_API_URL || (import.meta as any).env.NEXT_PUBLIC_API_URL)) ||
  (typeof process !== 'undefined' && process.env && (process.env.VITE_API_URL || process.env.NEXT_PUBLIC_API_URL)) ||
  '';

const IS_MOCK =
  (typeof import.meta !== 'undefined' && (import.meta as any).env && ((import.meta as any).env.VITE_USE_MOCK === 'true' || (import.meta as any).env.NEXT_PUBLIC_USE_MOCK === 'true')) ||
  (typeof process !== 'undefined' && process.env && (process.env.VITE_USE_MOCK === 'true' || process.env.NEXT_PUBLIC_USE_MOCK === 'true'));

export interface ComplaintSubmitInput {
  title: string;
  text: string;
  block: string;
  floor?: string;
  room?: string;
  photo_url?: string;
  is_anonymous?: boolean;
  share_identity_with_warden?: boolean;
  category?: string;
  urgency?: 'normal' | 'urgent';
}

export async function submitComplaintToBackend(
  input: ComplaintSubmitInput,
  token?: string | null
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (IS_MOCK) {
    const newComp: Complaint = {
      id: `HST-${Math.floor(1000 + Math.random() * 9000)}`,
      title: input.title || input.text.slice(0, 40),
      category: (input.category || 'General') as Category,
      description: input.text,
      hostelBlock: input.block,
      roomNumber: input.room || 'General',
      studentName: input.is_anonymous ? 'Anonymous Student' : 'Logged Student',
      studentId: '2024CSB1090',
      studentPhone: '+91 98765-43210',
      status: 'Submitted',
      priority: input.urgency === 'urgent' ? 'HIGH' : 'MEDIUM',
      assignedStaff: 'Unassigned',
      wardenInCharge: 'Dr. V. K. Gupta',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      slaDueDate: new Date(Date.now() + 86400000).toISOString(),
      slaStatus: 'ON_TRACK',
    };
    INITIAL_COMPLAINTS.unshift(newComp);
    return { success: true, data: { complaint: newComp } };
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/complaints`, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, error: errText || `Server error ${response.status}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to connect to backend server' };
  }
}

export async function fetchComplaintsList(): Promise<{ data: Complaint[]; loading: boolean; error: string | null }> {
  if (IS_MOCK) {
    return { data: INITIAL_COMPLAINTS, loading: false, error: null };
  }

  try {
    const { data: issuesData, error: issuesError } = await supabase
      .from('issues')
      .select('*')
      .order('opened_at', { ascending: false });

    if (issuesError) {
      return { data: INITIAL_COMPLAINTS, loading: false, error: issuesError.message };
    }

    if (!issuesData || issuesData.length === 0) {
      return { data: [], loading: false, error: null };
    }

    const mappedComplaints: Complaint[] = issuesData.map((iss: any) => ({
      id: iss.public_id || iss.id,
      title: iss.title,
      category: (iss.category || 'General') as Category,
      description: iss.summary || iss.title,
      hostelBlock: iss.block || 'Main Block',
      roomNumber: 'N/A',
      studentName: 'Student',
      studentId: 'STUDENT',
      studentPhone: 'N/A',
      status: iss.status === 'open' ? 'Submitted' : iss.status === 'in_progress' ? 'In Progress' : iss.status === 'resolved' ? 'Resolved' : 'Escalated',
      priority: iss.severity >= 3 ? 'HIGH' : iss.severity === 2 ? 'MEDIUM' : 'LOW',
      assignedStaff: 'Office Staff',
      wardenInCharge: 'Chief Warden',
      createdAt: iss.opened_at || new Date().toISOString(),
      updatedAt: iss.updated_at || new Date().toISOString(),
      slaDueDate: new Date(Date.now() + 86400000).toISOString(),
      slaStatus: 'ON_TRACK',
    }));

    return { data: mappedComplaints, loading: false, error: null };
  } catch (err: any) {
    return { data: INITIAL_COMPLAINTS, loading: false, error: err.message || 'Failed to fetch complaints' };
  }
}

export async function fetchNoticesList(): Promise<{ data: Notice[]; loading: boolean; error: string | null }> {
  if (IS_MOCK) {
    return { data: INITIAL_NOTICES, loading: false, error: null };
  }

  try {
    const { data, error } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
    if (error || !data || data.length === 0) {
      return { data: INITIAL_NOTICES, loading: false, error: error?.message || null };
    }

    const mapped: Notice[] = data.map((n: any) => ({
      id: n.id,
      title: n.title,
      content: n.content || n.body,
      author: n.author || 'Hostel Management',
      date: n.created_at ? n.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      isImportant: !!n.is_important,
      category: n.category || 'General',
    }));

    return { data: mapped, loading: false, error: null };
  } catch (err: any) {
    return { data: INITIAL_NOTICES, loading: false, error: err.message };
  }
}

export async function fetchTimelineEvents(issueId?: string): Promise<AuditLogItem[]> {
  if (IS_MOCK) {
    return INITIAL_AUDIT_LOGS;
  }

  try {
    let query = supabase.from('issue_events').select('*').order('created_at', { ascending: false });
    if (issueId) {
      query = query.eq('issue_id', issueId);
    }
    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return INITIAL_AUDIT_LOGS;
    }

    return data.map((e: any) => ({
      id: e.id,
      timestamp: e.created_at,
      ticketId: e.issue_id || 'SYSTEM',
      actor: e.actor || 'System',
      role: 'System',
      action: e.event_type,
      details: e.detail || '',
    }));
  } catch {
    return INITIAL_AUDIT_LOGS;
  }
}

export async function submitFeedbackToBackend(
  complaintId: string,
  rating: number,
  comment: string
): Promise<{ success: boolean; error?: string }> {
  if (IS_MOCK) {
    const comp = INITIAL_COMPLAINTS.find((c) => c.id === complaintId);
    if (comp) {
      comp.feedbackRating = rating;
      comp.feedbackComment = comment;
    }
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('resolution_votes')
      .insert({ issue_id: complaintId, fixed: rating >= 3 });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export interface WardenStudentInput {
  full_name: string;
  email: string;
  roll_number: string;
  phone: string;
  hostel: string;
  block: string;
  floor: string;
  room_number: string;
  course: string;
  year: string;
  guardian_name?: string;
  guardian_phone?: string;
}

export async function fetchWardenStudentsApi(
  token?: string | null,
  search?: string,
  block?: string
): Promise<{ data: any[]; total: number; error?: string }> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (block) params.append('block', block);

    const res = await fetch(`${API_URL}/warden/students?${params.toString()}`, { headers });
    if (!res.ok) {
      const errText = await res.text();
      return { data: [], total: 0, error: errText || `Error ${res.status}` };
    }
    const json = await res.json();
    return { data: json.students || [], total: json.total || 0 };
  } catch (err: any) {
    return { data: [], total: 0, error: err.message || 'Failed to fetch students' };
  }
}

export async function createWardenStudentApi(
  token: string | null | undefined,
  input: WardenStudentInput
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/warden/students`, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    });

    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.detail || json.message || `Error ${res.status}` };
    }
    return { success: true, data: json.student };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error while creating student' };
  }
}

export async function bulkCreateWardenStudentsApi(
  token: string | null | undefined,
  file: File
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_URL}/warden/students/bulk`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.detail || json.message || `Error ${res.status}` };
    }
    return { success: true, data: json };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error during CSV import' };
  }
}

export async function updateWardenStudentApi(
  token: string | null | undefined,
  studentId: string,
  updateData: Record<string, any>
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/warden/students/${studentId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updateData),
    });

    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.detail || json.message || `Error ${res.status}` };
    }
    return { success: true, data: json };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error updating student' };
  }
}
