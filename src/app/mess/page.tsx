'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Utensils, CheckCircle2 } from 'lucide-react';

export default function StudentMessPage() {
  const [meal, setMeal] = useState('Lunch');
  const [rating, setRating] = useState(4);
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div style={{ maxWidth: '750px', margin: '0 auto' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Mess & Food Feedback</h1>
            <p className="page-subtitle">Submit daily food quality ratings for your dining hall.</p>
          </div>
        </div>

        {submitted ? (
          <div className="card-panel" style={{ textAlign: 'center', padding: '2rem' }}>
            <CheckCircle2 size={48} style={{ color: '#059669', margin: '0 auto 0.5rem' }} />
            <h3 style={{ color: '#059669', marginBottom: '0.5rem' }}>Mess Feedback Submitted!</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sent to Hostel Mess Supervisor.</p>
          </div>
        ) : (
          <div className="card-panel">
            <form onSubmit={handleSubmit}>
              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Meal</label>
                  <select className="form-select" value={meal} onChange={(e) => setMeal(e.target.value)}>
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Snacks">Snacks / Tea</option>
                    <option value="Dinner">Dinner</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Quality Score (1-5)</label>
                  <select className="form-select" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                    <option value={5}>5 Stars - Fresh & Hygienic</option>
                    <option value={4}>4 Stars - Good</option>
                    <option value={3}>3 Stars - Average</option>
                    <option value={2}>2 Stars - Cold / Subpar</option>
                    <option value={1}>1 Star - Poor Quality</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Comments</label>
                <textarea rows={3} className="form-textarea" placeholder="Describe food quality or utensil hygiene..." value={comments} onChange={(e) => setComments(e.target.value)} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.65rem' }}>Submit Mess Feedback</button>
            </form>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
