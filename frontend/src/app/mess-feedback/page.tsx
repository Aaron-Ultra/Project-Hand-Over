'use client';

import React, { useState } from 'react';
import { Utensils, Star, CheckCircle2 } from 'lucide-react';

export default function MessFeedbackPage() {
  const [rating, setRating] = useState(4);
  const [meal, setMeal] = useState('Lunch');
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mess & Dining Hall Quality Feedback</h1>
          <p className="page-subtitle">Submit daily food quality, cleanliness, and hygiene reports to the Hostel Mess Committee.</p>
        </div>
      </div>

      {submitted ? (
        <div className="card-panel" style={{ textAlign: 'center', padding: '2rem' }}>
          <CheckCircle2 size={48} style={{ color: '#059669', margin: '0 auto 0.75rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#059669', marginBottom: '0.5rem' }}>
            Mess Feedback Logged
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Thank you! Your ratings have been submitted directly to the Hostel Mess Supervisor and Warden Committee.
          </p>
        </div>
      ) : (
        <div className="card-panel">
          <form onSubmit={handleSubmit}>
            <div className="grid-cols-2">
              <div className="form-group">
                <label className="form-label">Select Meal</label>
                <select className="form-select" value={meal} onChange={(e) => setMeal(e.target.value)}>
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Snacks">Snacks / Tea</option>
                  <option value="Dinner">Dinner</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quality Score (1 to 5 Stars)</label>
                <select className="form-select" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                  <option value={5}>5 Stars - Excellent Quality & Hygiene</option>
                  <option value={4}>4 Stars - Good & Fresh</option>
                  <option value={3}>3 Stars - Average</option>
                  <option value={2}>2 Stars - Subpar / Cold Food</option>
                  <option value={1}>1 Star - Raw / Unhygienic</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Detailed Comments / Observations</label>
              <textarea
                rows={4}
                className="form-textarea"
                placeholder="Mention specific dishes, cleanliness of utensils, or serving staff behavior..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.65rem' }}>
              Submit Mess Feedback
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
