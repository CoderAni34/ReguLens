# ReguLens

ReguLens is a regulatory compliance document intelligence platform prototype. It is designed to help teams ingest regulatory and policy documents, extract obligations, track ownership/deadlines, compare versions for conflicts/changes, and preserve source traceability.

## 1) What ReguLens Is

A full-stack monorepo for a student hackathon prototype that separates API, AI, frontend, data samples, and project documentation so each layer can evolve independently.

## 2) Main Problem Being Solved

Compliance teams often read large policy/regulatory documents manually and then translate findings into spreadsheets and tasks. This is slow, hard to audit, and error-prone. ReguLens will streamline that flow by structuring obligations and linking each extracted item to its source/page reference.

## 3) Planned Architecture

- **Frontend (React + Vite):** user-facing flows for upload, review, and tracking.
- **Backend API (FastAPI):** domain endpoints and orchestration layer.
- **AI Module (Python):** extraction/prompt/evaluation components behind a service boundary.
- **Database (PostgreSQL + SQLAlchemy):** persistence for users, documents, obligations, tasks, and audit logs.

### Simple Architecture Diagram

```text
User
 ↓
Frontend
 ↓
Backend API
 ↓
AI Processing
 ↓
PostgreSQL
```

## 4) Repository Structure

```text
ReguLens/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── documents.py
│   │   │   │   ├── obligations.py
│   │   │   │   ├── tasks.py
│   │   │   │   └── users.py
│   │   │   └── dependencies.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   ├── db/
│   │   │   ├── database.py
│   │   │   └── models/
│   │   │       ├── document.py
│   │   │       ├── obligation.py
│   │   │       ├── task.py
│   │   │       ├── user.py
│   │   │       └── audit_log.py
│   │   ├── schemas/
│   │   │   ├── document.py
│   │   │   ├── obligation.py
│   │   │   ├── task.py
│   │   │   └── user.py
│   │   ├── services/
│   │   │   ├── document_service.py
│   │   │   ├── obligation_service.py
│   │   │   └── task_service.py
│   │   └── main.py
│   ├── tests/
│   ├── requirements.txt
│   └── README.md
├── ai/
│   ├── extraction/
│   ├── prompts/
│   ├── schemas/
│   │   └── obligation_schema.json
│   ├── evaluation/
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── Dashboard/
│   │   │   ├── Documents/
│   │   │   ├── Obligations/
│   │   │   ├── Tasks/
│   │   │   └── Login/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── README.md
├── sample-data/
│   ├── documents/
│   ├── ground-truth/
│   └── README.md
├── docs/
│   ├── architecture/
│   ├── research/
│   ├── api/
│   └── README.md
├── .gitignore
├── README.md
├── docker-compose.yml
└── .env.example
```

## 5) Technology Stack

- **Backend:** Python + FastAPI
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy
- **Frontend:** React + Vite
- **AI Layer:** Python-based module/service for future LLM integration
- **Containerization:** Docker + Docker Compose

## 6) How Components Communicate

1. **Frontend → Backend API:** HTTP requests for documents, obligations, tasks, and user flows.
2. **Backend API → AI Processing:** backend service layer calls AI module interfaces (not route-level coupling).
3. **Backend API ↔ PostgreSQL:** SQLAlchemy persistence for structured records.
4. **AI Processing → Backend contracts:** extracted outputs conform to shared schemas before storage.

This keeps AI logic modular and decoupled from route handlers.

## 7) Basic Local Setup

```bash
cp .env.example .env
docker compose up
```

Endpoints:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- AI placeholder: http://localhost:8100

## 8) Development Workflow

1. Build feature slices independently by layer (`frontend/`, `backend/`, `ai/`).
2. Keep business logic in services/modules, not API routes.
3. Add tests in each component as functionality is introduced.
4. Use `sample-data/` for demo inputs and `docs/` for architecture/API notes.
5. Keep this monorepo as the single source of truth for the prototype.
