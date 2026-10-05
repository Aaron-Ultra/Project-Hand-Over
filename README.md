# Hostel & Mess Complaint Tracking System

A full-stack hostel grievance management platform with AI triage, role-based dashboards, automated duplication detection, and escalation tracking.

## Project Structure

```
hostel-complaint/
├── frontend/   # Next.js / React application (UI, Auth, Dashboards)
├── backend/    # FastAPI / Python application (AI triage, Supabase backend)
├── .gitignore  # Root gitignore
└── README.md   # Project overview & guide
```

## Quick Start

### 1. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

To build for production:
```bash
npm run build
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Open API documentation at [http://localhost:8000/docs](http://localhost:8000/docs) and health endpoint at [http://localhost:8000/health](http://localhost:8000/health).

## Environment Variables
Copy `.env.example` in `frontend/` and `backend/` to `.env` (or `.env.local`) and configure values.
