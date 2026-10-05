'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirm password do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (authError) {
        setIsSubmitting(false);
        setErrorMsg(authError.message || 'Failed to update password in Auth.');
        return;
      }

      if (user?.id) {
        await supabase.from('profiles').update({ must_change_password: false }).eq('id', user.id);
      }

      setIsSubmitting(false);
      setSuccess(true);

      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'An unexpected error occurred while setting your new password.');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '3rem auto' }}>
      <div className="card-panel">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
            <Lock size={48} />
          </div>
          <h1 className="page-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            Set Your New Password
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Your account was initialized with a temporary password. Please set a secure new password before continuing to your student dashboard.
          </p>
        </div>

        {errorMsg && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <CheckCircle2 size={48} style={{ color: '#059669', margin: '0 auto 0.75rem' }} />
            <h3 style={{ color: '#059669', marginBottom: '0.5rem', fontSize: '1.1rem', fontWeight: 600 }}>
              Password Updated Successfully!
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Redirecting you to your dashboard...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">New Password *</label>
              <input
                type="password"
                required
                minLength={8}
                className="form-input"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password *</label>
              <input
                type="password"
                required
                minLength={8}
                className="form-input"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%', padding: '0.65rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
              {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Updating Password...</> : 'Save New Password & Continue'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
