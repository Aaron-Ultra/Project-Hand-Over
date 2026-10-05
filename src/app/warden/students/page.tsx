'use client';

import React, { useState, useEffect } from 'react';
import { RoleGuard } from '@/components/RoleGuard';
import { useAuth } from '@/lib/auth';
import {
  fetchWardenStudentsApi,
  createWardenStudentApi,
  bulkCreateWardenStudentsApi,
  updateWardenStudentApi,
  WardenStudentInput
} from '@/lib/api';
import {
  UserPlus,
  FileSpreadsheet,
  Search,
  Filter,
  RefreshCw,
  Copy,
  Check,
  X,
  AlertCircle,
  Loader2,
  Lock,
  Edit2,
  UserCheck,
  UserX,
  Download,
  KeyRound
} from 'lucide-react';

interface Student {
  id: string;
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
  status: 'active' | 'inactive';
  created_at?: string;
}

export default function WardenStudentsPage() {
  const { token, user } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [blockFilter, setBlockFilter] = useState('');

  // Add Student Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const defaultHostel = user?.hostelBlock || 'Block A (Men)';
  const [formData, setFormData] = useState<WardenStudentInput>({
    full_name: '',
    email: '',
    roll_number: '',
    phone: '',
    hostel: defaultHostel,
    block: 'Block A',
    floor: '3rd Floor',
    room_number: '',
    course: 'B.Tech CS',
    year: '2nd Year',
    guardian_name: '',
    guardian_phone: '',
  });

  // Credentials Modal State (Success Card)
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{ email: string; temporary_password: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Bulk Import CSV Modal State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreviewRows, setCsvPreviewRows] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [bulkResults, setBulkResults] = useState<any | null>(null);

  // Edit Student Modal State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Student>>({});

  // Action Loading ID
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadStudents = async () => {
    setLoading(true);
    setErrorMsg(null);
    const res = await fetchWardenStudentsApi(token, search, blockFilter);
    setLoading(false);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setStudents(res.data);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [token, search, blockFilter]);

  // Download CSV Template
  const handleDownloadTemplate = () => {
    const csvContent =
      'full_name,email,roll_number,phone,hostel,block,floor,room_number,course,year,guardian_name,guardian_phone\n' +
      'Rahul Sharma,rahul.s@college.edu,2024CSB1091,9876543210,Block A (Men),Block A,3rd Floor,A-304,B.Tech CS,2nd Year,Ramesh Sharma,9876543211\n' +
      'Priya Patel,priya.p@college.edu,2024CSB1092,9876543220,Girls Hostel 1,Block B,2nd Floor,B-201,B.Tech EE,1st Year,Suresh Patel,9876543221';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'student_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Form Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.full_name.trim()) errors.full_name = 'Full Name is required.';
    if (!formData.email.trim()) {
      errors.email = 'College Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email address format.';
    }
    if (!formData.roll_number.trim()) errors.roll_number = 'Roll / Student ID is required.';
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required.';
    } else if (formData.phone.replace(/\D/g, '').length < 10) {
      errors.phone = 'Phone must contain at least 10 digits.';
    }
    if (!formData.hostel.trim()) errors.hostel = 'Hostel name is required.';
    if (!formData.block.trim()) errors.block = 'Block is required.';
    if (!formData.room_number.trim()) errors.room_number = 'Room number is required.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create Single Student Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await createWardenStudentApi(token, formData);
    setIsSubmitting(false);

    if (res.success && res.data) {
      setShowAddModal(false);
      setCreatedCreds({
        email: res.data.email,
        temporary_password: res.data.temporary_password,
        name: res.data.full_name,
      });
      setShowCredsModal(true);
      // reset form
      setFormData({
        full_name: '',
        email: '',
        roll_number: '',
        phone: '',
        hostel: defaultHostel,
        block: 'Block A',
        floor: '3rd Floor',
        room_number: '',
        course: 'B.Tech CS',
        year: '2nd Year',
        guardian_name: '',
        guardian_phone: '',
      });
      loadStudents();
    } else {
      setErrorMsg(res.error || 'Failed to create student. Please verify all details.');
    }
  };

  // CSV File Change Preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        const headers = lines[0].split(',').map((h) => h.trim());
        const preview = lines.slice(1, 6).map((line) => {
          const values = line.split(',').map((v) => v.trim());
          const obj: any = {};
          headers.forEach((h, i) => {
            obj[h] = values[i] || '';
          });
          return obj;
        });
        setCsvPreviewRows(preview);
      }
    };
    reader.readAsText(file);
  };

  // Submit Bulk CSV
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;

    setIsUploading(true);
    setBulkResults(null);
    setErrorMsg(null);

    const res = await bulkCreateWardenStudentsApi(token, csvFile);
    setIsUploading(false);

    if (res.success && res.data) {
      setBulkResults(res.data);
      loadStudents();
    } else {
      setErrorMsg(res.error || 'Failed to process CSV file.');
    }
  };

  // Toggle Student Status (Active / Inactive)
  const handleToggleStatus = async (student: Student) => {
    setActionLoadingId(student.id);
    const newStatus = student.status === 'active' ? 'inactive' : 'active';
    const res = await updateWardenStudentApi(token, student.id, { status: newStatus });
    setActionLoadingId(null);
    if (res.success) {
      loadStudents();
    } else {
      alert(`Error updating student status: ${res.error}`);
    }
  };

  // Reset Student Password
  const handleResetPassword = async (student: Student) => {
    if (!confirm(`Are you sure you want to reset the password for ${student.full_name}?`)) return;
    setActionLoadingId(student.id);
    const res = await updateWardenStudentApi(token, student.id, { reset_password: true });
    setActionLoadingId(null);
    if (res.success && res.data?.temporary_password) {
      setCreatedCreds({
        email: student.email,
        temporary_password: res.data.temporary_password,
        name: student.full_name,
      });
      setShowCredsModal(true);
    } else {
      alert(`Error resetting password: ${res.error}`);
    }
  };

  // Submit Edit Student
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    setIsSubmitting(true);
    const res = await updateWardenStudentApi(token, editingStudent.id, editFormData);
    setIsSubmitting(false);

    if (res.success) {
      setEditingStudent(null);
      loadStudents();
    } else {
      alert(`Error updating student: ${res.error}`);
    }
  };

  // Copy Credentials
  const handleCopyCredentials = () => {
    if (!createdCreds) return;
    const credText = `Student Credentials:\nEmail: ${createdCreds.email}\nTemporary Password: ${createdCreds.temporary_password}`;
    navigator.clipboard.writeText(credText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <RoleGuard allowedRoles={['warden', 'admin']}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">Warden Student Management</h1>
            <p className="page-subtitle">
              Manage hostel resident profiles, generate single/bulk credentials, and oversee account status.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setShowBulkModal(true)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileSpreadsheet size={16} /> Import CSV
            </button>
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <UserPlus size={16} /> Add Student
            </button>
          </div>
        </div>

        {/* Global Error Alert */}
        {errorMsg && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Search & Filters Panel */}
        <div className="card-panel" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
          <div className="grid-cols-3" style={{ gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.25rem' }}
                placeholder="Search by Name, Roll No, or Email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div>
              <select className="form-select" value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)}>
                <option value="">All Hostel Blocks</option>
                <option value="Block A">Block A</option>
                <option value="Block B">Block B</option>
                <option value="Block C">Block C</option>
                <option value="Girls Hostel 1">Girls Hostel 1</option>
                <option value="Girls Hostel 2">Girls Hostel 2</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={loadStudents} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh List
              </button>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="card-panel" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
              <p>Fetching student records...</p>
            </div>
          ) : students.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <UserX size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>No Student Records Found</h3>
              <p style={{ fontSize: '0.85rem' }}>Try adjusting your search query or block filter, or add a new student.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Roll / ID</th>
                  <th>College Email</th>
                  <th>Block & Room</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.course} ({s.year})</div>
                    </td>
                    <td className="mono" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      {s.roll_number || 'N/A'}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{s.email}</td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {s.block || 'Block A'} - {s.room_number || 'N/A'}
                    </td>
                    <td>
                      <span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {s.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button
                          onClick={() => {
                            setEditingStudent(s);
                            setEditFormData({
                              full_name: s.full_name,
                              phone: s.phone,
                              block: s.block,
                              floor: s.floor,
                              room_number: s.room_number,
                              course: s.course,
                              year: s.year,
                              guardian_name: s.guardian_name,
                              guardian_phone: s.guardian_phone,
                            });
                          }}
                          className="btn btn-secondary btn-sm"
                          title="Edit Details"
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(s)}
                          disabled={actionLoadingId === s.id}
                          className={`btn btn-sm ${s.status === 'active' ? 'btn-secondary' : 'btn-primary'}`}
                          title={s.status === 'active' ? 'Deactivate Student' : 'Activate Student'}
                        >
                          {actionLoadingId === s.id ? <Loader2 size={13} className="animate-spin" /> : s.status === 'active' ? <UserX size={13} /> : <UserCheck size={13} />}
                        </button>
                        <button
                          onClick={() => handleResetPassword(s)}
                          disabled={actionLoadingId === s.id}
                          className="btn btn-secondary btn-sm"
                          title="Reset Password"
                          style={{ color: '#d97706' }}
                        >
                          <KeyRound size={13} /> Reset Pwd
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* MODAL 1: Add Single Student */}
        {showAddModal && (
          <div className="modal-backdrop">
            <div className="modal-content" style={{ maxWidth: '650px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Register New Student</h2>
                <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddSubmit}>
                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                    {formErrors.full_name && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{formErrors.full_name}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">College Email *</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="student@college.edu"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    {formErrors.email && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{formErrors.email}</span>}
                  </div>
                </div>

                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Roll Number / Student ID *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 2024CSB1090"
                      value={formData.roll_number}
                      onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                    />
                    {formErrors.roll_number && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{formErrors.roll_number}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number (10 Digits) *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                    {formErrors.phone && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{formErrors.phone}</span>}
                  </div>
                </div>

                <div className="grid-cols-3">
                  <div className="form-group">
                    <label className="form-label">Hostel (Prefilled)</label>
                    <input
                      type="text"
                      className="form-input"
                      readOnly
                      style={{ backgroundColor: 'var(--bg-subtle)' }}
                      value={formData.hostel}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Block *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Block A"
                      value={formData.block}
                      onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Room Number *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="A-302"
                      value={formData.room_number}
                      onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid-cols-3">
                  <div className="form-group">
                    <label className="form-label">Floor</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="3rd Floor"
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Course</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="B.Tech CS"
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="2nd Year"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Guardian Name (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.guardian_name}
                      onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Guardian Phone (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.guardian_phone}
                      onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Registering...</> : 'Create Student Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: Credentials Success Card */}
        {showCredsModal && createdCreds && (
          <div className="modal-backdrop">
            <div className="modal-content" style={{ maxWidth: '500px', textAlign: 'center' }}>
              <div style={{ color: '#059669', marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
                <Lock size={48} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#059669', marginBottom: '0.25rem' }}>
                Student Credentials Generated
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Account created for <strong>{createdCreds.name}</strong>.
              </p>

              <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '1.25rem', textAlign: 'left' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Student Email:</div>
                <div className="mono" style={{ fontWeight: 600, marginBottom: '0.75rem' }}>{createdCreds.email}</div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Temporary Password:</div>
                <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.05em' }}>
                  {createdCreds.temporary_password}
                </div>
              </div>

              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', marginBottom: '1.25rem', textAlign: 'left' }}>
                <strong>Important Note:</strong> Shown only once. Ask the student to change it on first login.
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={handleCopyCredentials} className="btn btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}>
                  {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Credentials</>}
                </button>
                <button onClick={() => { setShowCredsModal(false); setCreatedCreds(null); }} className="btn btn-secondary">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: Import CSV */}
        {showBulkModal && (
          <div className="modal-backdrop">
            <div className="modal-content" style={{ maxWidth: '750px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Import Students via CSV</h2>
                <button onClick={() => { setShowBulkModal(false); setBulkResults(null); setCsvFile(null); setCsvPreviewRows([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <button onClick={handleDownloadTemplate} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Download size={14} /> Download CSV Template
                </button>
              </div>

              <form onSubmit={handleBulkSubmit}>
                <div className="form-group">
                  <label className="form-label">Select CSV File *</label>
                  <input type="file" accept=".csv" required className="form-input" onChange={handleFileChange} />
                </div>

                {/* CSV Preview */}
                {csvPreviewRows.length > 0 && !bulkResults && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Previewing First {csvPreviewRows.length} Rows:</h4>
                    <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                      <table className="data-table" style={{ fontSize: '0.775rem' }}>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Roll No</th>
                            <th>Block</th>
                            <th>Room</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvPreviewRows.map((r, i) => (
                            <tr key={i}>
                              <td>{r.full_name}</td>
                              <td>{r.email}</td>
                              <td>{r.roll_number}</td>
                              <td>{r.block}</td>
                              <td>{r.room_number}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Bulk Results Table */}
                {bulkResults && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                      <div>Total: <strong>{bulkResults.total}</strong></div>
                      <div style={{ color: '#059669' }}>Created: <strong>{bulkResults.created}</strong></div>
                      <div style={{ color: '#dc2626' }}>Failed: <strong>{bulkResults.failed}</strong></div>
                    </div>

                    <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                      <table className="data-table" style={{ fontSize: '0.775rem' }}>
                        <thead>
                          <tr>
                            <th>Row</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Temp Password / Failure Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bulkResults.results?.map((res: any, idx: number) => (
                            <tr key={idx}>
                              <td>Row {res.row}</td>
                              <td>{res.email}</td>
                              <td>
                                <span className={`badge ${res.status === 'created' ? 'badge-success' : 'badge-danger'}`}>
                                  {res.status}
                                </span>
                              </td>
                              <td className="mono">
                                {res.status === 'created' ? (
                                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{res.student?.temporary_password}</span>
                                ) : (
                                  <span style={{ color: '#dc2626' }}>{res.reason}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => { setShowBulkModal(false); setBulkResults(null); setCsvFile(null); setCsvPreviewRows([]); }} className="btn btn-secondary">
                    Close
                  </button>
                  {!bulkResults && (
                    <button type="submit" disabled={isUploading || !csvFile} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {isUploading ? <><Loader2 size={16} className="animate-spin" /> Processing CSV...</> : 'Upload & Import Students'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 4: Edit Student Details */}
        {editingStudent && (
          <div className="modal-backdrop">
            <div className="modal-content" style={{ maxWidth: '600px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Edit Student Details</h2>
                <button onClick={() => setEditingStudent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit}>
                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editFormData.full_name || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editFormData.phone || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid-cols-3">
                  <div className="form-group">
                    <label className="form-label">Block</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editFormData.block || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, block: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Floor</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editFormData.floor || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, floor: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Room Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editFormData.room_number || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, room_number: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Course</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editFormData.course || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, course: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editFormData.year || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, year: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setEditingStudent(null)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
