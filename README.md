# AI Resume Analyzer — Intelligent Hiring Portal

> **Phase 1 complete.** Full-stack project with Docker Compose, Google OAuth 2.0, JWT sessions, PostgreSQL schema, and a premium Next.js dashboard.

## Tech Stack

| Layer       | Technology |
|-------------|------------|
| Frontend    | Next.js 14, Tailwind CSS, ShadCN/Radix, Recharts, Axios |
| Backend     | Node.js 20, Express, Passport.js, JWT, Multer, Joi, pg |
| ML Service  | Python 3.11, FastAPI, spaCy, NLTK, scikit-learn, TF-IDF |
| Database    | PostgreSQL 16 |
| Storage     | AWS S3 (Phase 2) |
| DevOps      | Docker + Docker Compose |

## Quick Start

### 1. Set up environment variables

```bash
cp .env.example .env
# Edit .env and fill in:
#   GOOGLE_CLIENT_ID
#   GOOGLE_CLIENT_SECRET
#   JWT_SECRET   (openssl rand -base64 64)
```

### 2. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → **APIs & Services → Credentials → OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Authorised redirect URIs: `http://localhost:4000/auth/google/callback`
5. Copy **Client ID** and **Client Secret** into `.env`

### 3. Start the stack

```bash
docker compose up --build
```

| Service     | URL |
|-------------|-----|
| Frontend    | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| ML Service  | http://localhost:8000 |
| PostgreSQL  | localhost:5432 |

### 4. Verify everything is running

```bash
# All services healthy
docker compose ps

# Backend health
curl http://localhost:4000/api/health

# ML Service health
curl http://localhost:8000/health

# Check DB tables
docker compose exec postgres psql -U postgres -d resume_db -c "\dt"
```

## Project Structure

```
ai-resume-analyzer/
├── docker-compose.yml
├── .env.example
├── db/
│   └── init.sql              # PostgreSQL schema (auto-run on first start)
├── backend/                  # Node.js / Express / Passport.js
│   ├── src/
│   │   ├── index.ts          # Express app entrypoint
│   │   ├── config.ts         # Typed env config
│   │   ├── db.ts             # pg Pool + query helper
│   │   ├── passport.ts       # Google OAuth 2.0 strategy
│   │   ├── middleware/
│   │   │   ├── auth.ts       # requireAuth JWT middleware
│   │   │   └── errorHandler.ts
│   │   └── routes/
│   │       ├── auth.ts       # /auth/google, /callback, /me, /logout
│   │       ├── health.ts     # /api/health
│   │       └── resumes.ts    # /api/resumes (Phase 1 read-only)
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # Next.js 14 App Router
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx    # Root layout + AuthProvider
│   │   │   ├── globals.css   # Dark theme + glass utilities
│   │   │   ├── page.tsx      # Login page
│   │   │   └── dashboard/
│   │   │       └── page.tsx  # Dashboard with stats + resume list
│   │   ├── components/
│   │   │   └── Navbar.tsx    # Glass navbar + user menu
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── lib/
│   │   │   ├── axios.ts      # Axios instance with credentials
│   │   │   └── utils.ts      # cn(), formatDate, score helpers
│   │   └── middleware.ts     # Edge auth guard
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── tsconfig.json
└── ml-service/               # Python / FastAPI
    ├── main.py               # /health + /analyze + /match stubs
    ├── requirements.txt
    └── Dockerfile
```

## Auth Flow

```
Browser → GET /auth/google (backend)
       → Google consent screen
       → GET /auth/google/callback
       → JWT issued as HttpOnly cookie
       → Redirect → /dashboard (frontend)
```

## Phases Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| 1 | ✅ Complete | Foundation, Auth, Dashboard |
| 2 | 🔜 Next | Resume upload (S3 + Multer), full NLP pipeline |
| 3 | ⏳ Planned | JD matching, TF-IDF, hiring probability, Recharts |
| 4 | ⏳ Planned | Recruiter mode, interview AI, deployment |
