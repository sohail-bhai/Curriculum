# CurriculumOS v2.0 — University Curriculum Management Platform

Full-stack rebuild with Django REST Framework + Next.js + PostgreSQL + Celery + WeasyPrint.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 14)                     │
│  Auth → HOD Dashboard → Faculty Editor (6 Modules) → PDF        │
│  React Query  |  Zustand Auth Store  |  Axios + JWT Interceptor  │
└──────────────────────────┬───────────────────────────────────────┘
                           │ HTTP/REST (JWT Bearer)
┌──────────────────────────▼───────────────────────────────────────┐
│                    BACKEND API (Django REST)                      │
│  accounts/ | core/ | subjects/ | workflow/ | documents/          │
│  SimpleJWT | DRF | django-filter | CORS Headers                  │
└───────────┬─────────────────────────────┬────────────────────────┘
            │                             │
      ┌─────▼─────┐               ┌───────▼─────────────────┐
      │ PostgreSQL │               │   CELERY WORKERS        │
      │  (models) │               │  email_tasks.py         │
      └───────────┘               │  document_tasks.py      │
                                  │  Broker: Redis          │
                                  └─────────────────────────┘
```

## Role-Based Workflow

```
HOD creates subject shell
    ↓
HOD assigns to Faculty member
    ↓ (email notification via Celery)
Faculty sees subject in dashboard (status: PENDING)
    ↓
Faculty fills 6 modules (status: DRAFT)
    ↓
Faculty submits to HOD (status: SUBMITTED)
    ↓ (email notification via Celery)
HOD reviews → Approve (status: APPROVED)
           → Request Revision (status: REVISION)
    ↓
PDF available for download at any stage
```

## Quick Start (Local)

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL 15+
- Redis 7+

### Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials

pip install -r requirements.txt

python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_data

python manage.py runserver
```

### Start Celery Workers
```bash
# In separate terminals:
celery -A curriculum_platform worker -l info
celery -A curriculum_platform beat -l info
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

npm run dev
```

### Docker (Full Stack)
```bash
docker-compose up --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/v1
- Django Admin: http://localhost:8000/admin

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/login/ | JWT login |
| POST | /api/v1/auth/refresh/ | Refresh token |
| POST | /api/v1/auth/logout/ | Blacklist token |
| GET/PATCH | /api/v1/auth/me/ | Profile |
| GET | /api/v1/auth/faculty/ | List faculty |

### HOD Subject Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/subjects/hod/ | List dept subjects |
| POST | /api/v1/subjects/hod/ | Create + assign |
| PATCH | /api/v1/subjects/hod/{id}/ | Update metadata |
| POST | /api/v1/subjects/hod/{id}/approve/ | Approve |
| POST | /api/v1/subjects/hod/{id}/request-revision/ | Request revision |

### Faculty Subject Editor
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/subjects/faculty/ | My subjects |
| GET | /api/v1/subjects/faculty/{id}/ | Subject detail |
| POST | /api/v1/subjects/{id}/module/1/ | Save basic info |
| POST | /api/v1/subjects/{id}/module/2/ | Save objectives |
| POST | /api/v1/subjects/{id}/module/3/ | Save units+topics |
| POST | /api/v1/subjects/{id}/module/4/ | Save textbooks+refs |
| POST | /api/v1/subjects/{id}/module/5/ | Save COs+matrix |
| POST | /api/v1/subjects/{id}/module/6/ | Save SDG+SME |
| GET | /api/v1/subjects/{id}/module/{n}/data/ | Get module data |
| POST | /api/v1/subjects/{id}/submit/ | Submit to HOD |
| POST | /api/v1/subjects/{id}/retract/ | Retract submission |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/subjects/{id}/document/ | Stream PDF |
| POST | /api/v1/subjects/{id}/document/async/ | Queue PDF |
| GET | /api/v1/tasks/{task_id}/ | Poll task status |

---

## Seed Credentials
| Role | Email | Password |
|------|-------|----------|
| HOD | hod_cse@univ.edu | HOD123! |
| Faculty | faculty1@univ.edu | Fac123! |
| Faculty | faculty2@univ.edu | Fac123! |
| Dean | dean@univ.edu | Dean123! |
