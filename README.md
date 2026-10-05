# HAND OVER

> **AI-powered hostel & mess complaint management, tracking, and resolution platform.**

**Live Demo:** [ADD DEPLOYED URL TOMORROW]  
**Repository:** [https://github.com/Aaron-Ultra/Project-Hand-Over]

---

## 🎯 Problem Statement & User Insights

Hostel and mess complaints are often reported through informal channels such as messages, calls, verbal communication, or scattered forms. This can lead to:

- Complaints getting lost or overlooked
- Multiple students reporting the same issue separately
- Complaints reaching the wrong department
- No clear visibility into complaint status
- Delayed resolution
- No automatic escalation when important issues remain unresolved

### User Research

We conducted a preliminary survey with **22 students** to understand their hostel and mess complaint experiences and identify common pain points.

**Key findings:**

- *63.6%* reported facing mess food quality issues, while *54.5%* reported cleanliness issues.
- *36.4%* of respondents did not report their last issue; among non-reporters, *40.9%* felt nothing would happen and *36.4%* did not know whom to tell.
- *59.1%* said they often saw the same problem reported by multiple students without being fixed.
- *63.6%* considered status tracking, reminders to the responsible office, and confirmation of resolution useful features.


> **Note:** The survey had 22 responses and was used as preliminary problem validation rather than as a statistically representative study.

---

## 💡 Our Solution

**Hand Over** is a centralized AI-powered hostel and mess complaint management system.

Students can submit complaints, while the system automatically understands and structures the complaint, detects related/duplicate issues, calculates priority, routes the issue to the appropriate department, monitors unresolved complaints, and supports resolution confirmation.

The system combines **AI for complaint understanding** with **deterministic backend logic for important system decisions**, making the workflow more reliable and controllable.

---

## ✨ Key Features

### Student Features
- 📝 Submit hostel and mess complaints
- 📸 Attach photos
- 👤 Anonymous complaint option
- 📊 Track complaint status and history
- ✅ Confirm whether an issue was resolved
- 🔄 Reopen an issue when the problem is not actually fixed

### AI-Powered Features
- 🤖 Automatic complaint understanding
- 🏷️ Complaint category classification
- 🚨 Severity assessment
- 🧹 Complaint text cleaning and standardization
- 🔁 Duplicate issue detection and grouping
- 🔒 Sensitive complaint detection
- ❓ Follow-up question when important information is missing

### Management & Automation
- 🏢 Automatic department/office routing
- 📈 Priority calculation
- 👥 Reporter count for grouped complaints
- ⏰ 24-hour unresolved-issue reminder
- 🚨 48-hour escalation
- 📜 Issue event/audit history
- 🌐 Public tracker for non-sensitive issues

---

## 🔄 How Hand Over Works

```text
Student submits complaint
          ↓
     AI Intake Agent
          ↓
Category + Severity + Cleaned Text
          ↓
   Duplicate Detection
       ↙         ↘
 Existing Issue   New Issue
       ↓              ↓
 Group Complaint   Create Issue
       ↘              ↙
        Priority Calculation
                ↓
        Department Routing
                ↓
        Issue Monitoring
          ↓           ↓
        24h          48h
      Reminder     Escalation
          \           /
           \         /
            Resolution
                ↓
       Student Confirmation
                ↓
     Resolved / Reopened
```

---

## 🤖 AI & Technical Architecture

### AI Intake Agent

The intake agent converts an unstructured student complaint into structured information:

- Category
- Severity
- Short title
- Cleaned complaint description
- Sensitive complaint flag
- Follow-up question when an important detail is missing

### Duplicate Detection Agent

The duplicate detection agent compares a new complaint with existing active issues and checks whether they describe the **same underlying real-world problem**.

The system does **not** treat complaints as duplicates simply because they belong to the same category.

### Deterministic Backend Logic

AI is used for understanding the complaint, while important system decisions are handled by the backend.

The backend controls:

- Final routing
- Priority calculation
- Reporter counting
- Complaint grouping
- Timers
- Escalation
- Status changes
- Resolution confirmation
- Audit/event logging

This separation reduces dependence on AI for critical workflow decisions.

---

## 🏗️ System Architecture

```text
                  ┌─────────────────────┐
                  │       Student       │
                  │      Web / PWA      │
                  └──────────┬──────────┘
                             │
                             ↓
                  ┌─────────────────────┐
                  │ React + Vite +      │
                  │ Tailwind CSS        │
                  └──────────┬──────────┘
                             │
                             ↓
                  ┌─────────────────────┐
                  │    FastAPI Backend  │
                  └──────┬───────┬──────┘
                         │       │
                ┌────────┘       └─────────┐
                ↓                          ↓
       ┌─────────────────┐        ┌─────────────────┐
       │   AI / LLM      │        │    Supabase     │
       │ Intake + Dedup  │        │ Auth + Postgres │
       └─────────────────┘        │ + Storage       │
                                  └─────────────────┘

                  ┌─────────────────────┐
                  │     APScheduler     │
                  │ 24h / 48h Monitoring│
                  └─────────────────────┘
```

---

## 🧪 AI Evaluation & Reliability

The AI pipeline was evaluated using a **30-case sample dataset** containing hostel and mess complaints across different categories, severities, duplicate situations, and sensitive cases.

### Evaluation Results

| Metric | Result | Target | Status |
|---|---:|---:|---|
| Correct office routing | **25/27 — 92.6%** | ≥90% | ✅ PASS |
| Correct duplicate grouping | **7/8 — 87.5%** | ≥85% | ✅ PASS |
| Wrongly merged complaints | **0/19** | Minimize | ✅ |
| Sensitive complaint detection | **30/30 — 100%** | — | ✅ |
| Severity within ±1 | **26/27 — 96.3%** | — | ✅ |

The evaluation was used to identify errors and validate the AI pipeline before final integration.

The complete sample dataset is included in the repository:

`hostel_mess_30_sample_test_set.json`

---

## 💎 Originality & Differentiation

Hand Over goes beyond a basic complaint form or ticketing system.

### What makes it different?

- **AI understands unstructured complaints** instead of relying only on fixed form fields.
- **Duplicate complaints are grouped** into a shared issue instead of creating multiple separate tickets.
- **Complaints are automatically routed** to the appropriate department.
- **Priority considers severity, number of reporters, and issue age.**
- **Unresolved complaints trigger automatic reminders and escalation.**
- **Sensitive complaints receive separate/private handling.**
- **Students can confirm resolution or reopen an issue** if the problem was not actually fixed.
- The system provides a **transparent status history** for non-sensitive complaints.

---

## 🌍 Real-World Usability

### Students

Students can:

- Report issues quickly
- Attach supporting photos
- Report anonymously when appropriate
- Track issue status
- Confirm or reject a resolution

### Hostel/Mess Staff

Staff receive complaints that are:

- Structured
- Categorized
- Prioritized
- Routed to the appropriate office

### Wardens & Administrators

Management can:

- Monitor active issues
- See unresolved complaints
- Receive escalations
- Track recurring problems
- Review issue history

### Deployment Potential

```text
Single Hostel
     ↓
Entire College
     ↓
Multiple Hostels / Blocks
     ↓
Multiple Campuses
     ↓
Multiple Institutions
```

---

## 🔐 Responsible Design & Trust

Hand Over is designed to keep sensitive complaints and important administrative decisions under controlled handling.

### Privacy & Security

- Authentication through Supabase Auth
- Role-based access for different users
- Anonymous complaint support
- Sensitive complaints are not exposed on the public tracker
- Complaint and issue events can be recorded for accountability
- Photos are stored using Supabase Storage

### AI Safety

AI is primarily used for **understanding and structuring complaints**.

Critical workflow decisions such as routing, priority, escalation, status changes, and resolution handling remain controlled by backend logic rather than being left entirely to the LLM.

---

## 📈 Scalability

Hand Over is designed with a modular architecture so that the system can grow with the number of students, complaints, departments, and institutions.

### Technical Scalability

- FastAPI provides an API-based backend
- Supabase provides managed PostgreSQL, authentication, and storage
- The AI layer can be scaled independently
- Background monitoring is handled through APScheduler
- The PWA-ready frontend can support additional client platforms
- The API architecture can support future mobile or chatbot interfaces

---

## 🚀 Future Scope

Possible future improvements include:

- 🎙️ Voice-based complaint submission
- 📱 Dedicated mobile application
- 💬 WhatsApp/chatbot-based complaint submission
- 🖼️ Advanced image understanding for maintenance complaints
- 📊 Advanced analytics for hostel management
- 🔮 Predictive identification of recurring hostel problems
- 🔧 Automatic maintenance task creation
- 🌍 Multi-language complaint support
- 📈 Long-term issue trend analysis
- 🌐 Multi-campus and multi-institution support

---

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- Progressive Web App (PWA) ready

### Backend
- Python
- FastAPI

### Database, Authentication & Storage
- Supabase
- PostgreSQL
- Supabase Auth — email/password authentication
- Supabase Storage — complaint photo storage

### AI / LLM
- OpenAI-compatible LLM API

> **Exact provider/model:** [ADD TOMORROW]

### Scheduler
- APScheduler
- Used for automated 24-hour reminders and 48-hour escalations

---

## ⚙️ Installation & Setup

### Prerequisites

- Python 3.x
- Node.js and npm
- A Supabase project
- Required LLM API credentials

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create the required environment variables.

```text
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
LLM_API_KEY=your_llm_api_key
LLM_BASE_URL=your_llm_base_url
LLM_MODEL=your_llm_model
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

> **Note:** Update these setup instructions tomorrow if the final repository structure or deployment configuration differs.

---

## 📁 Project Structure

```text
HAND-OVER/
│
├── frontend/
│   └── ...
│
├── backend/
│   ├── main.py
│   ├── agents.py
│   ├── schema.sql
│   ├── evaluate.py
│   └── ...
│
├── hostel_mess_30_sample_test_set.json
│
└── README.md
```

> **Update the structure tomorrow** to match the final GitHub repository.


---

## 🌐 Live Demo

**[ADD LIVE DEPLOYMENT URL TOMORROW]**

**GitHub Repository:** [https://github.com/Aaron-Ultra/Project-Hand-Over]

---

## 🏆 Hackathon

Built for **WCC Launchpad 30 — We Code Coders**.

**Project:** HAND OVER

**Team:** LET'S TRY

**Hackathon Dates:** 4–5 October 2026

---

## 🤖 AI / Development Disclosure

[ADD FINAL HACKATHON-REQUIRED AI DISCLOSURE TOMORROW]

AI-assisted development tools were used during development. The team reviewed, tested, and integrated the resulting code and AI behavior into the final project.

---
