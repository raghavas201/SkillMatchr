# 🧠 AI Resume Analyzer — Intelligent Hiring Portal

> 🚀 End-to-End AI Recruitment Platform  
> Analyze resumes, match them with job descriptions, detect skill gaps, rank candidates, and generate hiring insights using NLP and machine learning.  
> Built with a Dockerized microservice architecture for scalability and privacy.

---

# ✨ Features

## 🔐 Authentication & User Management
- Google OAuth 2.0 login
- Secure JWT sessions (HttpOnly cookies)
- User dashboard with resume & analysis history
- Resume privacy controls

## 📄 Resume Processing
- Upload resumes (PDF / DOCX)
- Automatic text extraction
- Resume section detection (Skills, Experience, Education, Projects)
- Experience timeline extraction
- Multiple resume versions per user

## 🤖 Core AI Resume Analysis
- Resume quality score (0–100)
- Resume strength classification (Strong / Average / Weak)
- Grammar & readability analysis
- Action verb detection
- Achievement quantification detection
- ATS compatibility scoring
- Section-wise scoring

## 🧠 Skill Intelligence
- NLP-based skill extraction
- Skill proficiency estimation
- Skill gap analysis
- Missing skill recommendations

## 🎯 Keyword Scanner
- Custom keyword search
- Keyword coverage percentage
- Color-coded match results
- Keyword importance detection

## 🧠 Job Description Matching
- Upload or paste job description
- Semantic similarity scoring (TF-IDF + cosine similarity)
- Match percentage calculation
- Suitability classification
- Keyword overlap analysis
- Explainable AI insights

## 📊 Candidate Evaluation AI
- Candidate ranking algorithm
- Hiring probability score
- Experience level detection
- Resume anomaly detection

## 💡 Recommendation & Optimization Engine
- Personalized improvement suggestions
- Resume rewriting suggestions
- Section-specific feedback
- Role-based optimization tips

## 🧠 Role & Career Intelligence
- Role prediction model
- Career path prediction
- Resume similarity search
- Personalized learning recommendations

## 🎤 Interview Preparation AI
- Interview question generation based on skills
- Skill-based interview topics
- Difficulty categorization

## 📈 Analytics & Dashboard
- Resume score history
- JD match history
- Skill improvement tracking
- Visual analytics charts
- Downloadable reports

## 🗂️ Recruiter Mode
- Upload multiple candidate resumes
- Rank candidates by JD match
- Filter candidates by skills
- Candidate comparison dashboard

## ⚙️ System Highlights
- Dockerized microservice architecture
- Local ML models (privacy-focused)
- RESTful APIs
- Secure file storage
- Scalable backend

---

# 🧰 Tech Stack

| Layer | Technology |
|------|-----------|
| Frontend | Next.js 14, Tailwind CSS, ShadCN/Radix, Recharts, Axios |
| Backend | Node.js 20, Express, Passport.js, JWT, Multer, Joi, pg |
| ML Service | Python 3.11, FastAPI, spaCy, NLTK, scikit-learn, TF-IDF |
| Database | PostgreSQL 16 |
| Storage | AWS S3 (optional production) |
| DevOps | Docker + Docker Compose |

---

# 🧠 AI & ML Techniques

- Named Entity Recognition → skill extraction  
- Text classification → resume strength & role prediction  
- TF-IDF + cosine similarity → JD matching  
- Rule-based NLP → suggestions & scoring  
- Ranking algorithms → candidate ranking  
- Anomaly detection → suspicious resumes  

---

# 🚀 Quick Start

## 1️⃣ Clone the repository
```bash
gh repo clone raghavas201/SkillMatchr
cd ai-resume-analyzer

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

## 📜 License

MIT License © 2026 Raghava Srivastava

Permission is hereby granted, free of charge, to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of this software, provided the above copyright notice and this permission notice are included.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.

