"""
AI Resume Analyzer — ML Service (FastAPI)
Phase 1: Stubs + Health
Phase 2: Full NLP pipeline (spaCy, NLTK, TF-IDF, grammar analysis)
"""

import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

load_dotenv()

app = FastAPI(
    title="AI Resume Analyzer — ML Service",
    description="NLP pipeline for resume analysis, ATS scoring, and JD matching",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    resume_id: str
    text: Optional[str] = None
    file_type: Optional[str] = "pdf"  # 'pdf' | 'docx'


class AnalyzeResponse(BaseModel):
    resume_id: str
    ats_score: float
    quality_score: float
    strength: str  # 'weak' | 'average' | 'strong' | 'excellent'
    extracted_skills: list[str]
    grammar_issues: list[dict]
    sections_detected: list[str]
    word_count: int
    insights: list[str]


class MatchRequest(BaseModel):
    resume_text: str
    jd_text: str


class MatchResponse(BaseModel):
    similarity_score: float
    hiring_probability: float
    matched_keywords: list[str]
    skill_gaps: list[str]
    rank_explanation: str


# ──────────────────────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "ml-service", "version": "1.0.0"}


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_resume(req: AnalyzeRequest):
    """
    Phase 1 stub — returns mock data.
    Full NLP pipeline is implemented in Phase 2.
    """
    # ── STUB (Phase 2 will replace this) ─────────────────────
    if not req.text:
        raise HTTPException(status_code=400, detail="Resume text is required")

    word_count = len(req.text.split())

    # Naive scoring stubs
    ats_score = min(100.0, max(20.0, word_count / 5.0))
    quality_score = min(100.0, max(10.0, word_count / 6.0))

    if quality_score >= 80:
        strength = "excellent"
    elif quality_score >= 60:
        strength = "strong"
    elif quality_score >= 40:
        strength = "average"
    else:
        strength = "weak"

    return AnalyzeResponse(
        resume_id=req.resume_id,
        ats_score=round(ats_score, 2),
        quality_score=round(quality_score, 2),
        strength=strength,
        extracted_skills=[],          # Phase 2: spaCy NER
        grammar_issues=[],            # Phase 2: language-tool-python
        sections_detected=[],         # Phase 2: section detector
        word_count=word_count,
        insights=["Full analysis available after Phase 2 NLP pipeline"],
    )


@app.post("/match", response_model=MatchResponse)
async def match_jd(req: MatchRequest):
    """
    Phase 1 stub — JD matching.
    Full TF-IDF + cosine similarity implemented in Phase 3.
    """
    return MatchResponse(
        similarity_score=0.0,
        hiring_probability=0.0,
        matched_keywords=[],
        skill_gaps=[],
        rank_explanation="JD matching not yet implemented (Phase 3)",
    )
