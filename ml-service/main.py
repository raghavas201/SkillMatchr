"""
AI Resume Analyzer — ML Service (FastAPI)
Full NLP pipeline: extract → section detect → skill extract → grammar → ATS & quality score → callback
"""

import os
import io
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

load_dotenv()

# ── Import NLP pipeline modules ───────────────────────────────
from extractor import extract_text
from sections import detect_sections, get_detected_section_names
from skills import extract_skills
from grammar import check_grammar
from ats import compute_ats_score
from quality import compute_quality_score, classify_strength, build_insights

app = FastAPI(
    title="AI Resume Analyzer — ML Service",
    description="Full NLP pipeline: text extraction, skill NER, grammar, ATS + quality scoring",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BACKEND_URL = os.getenv("BACKEND_INTERNAL_URL", "http://backend:4000")
AWS_REGION  = os.getenv("AWS_REGION", "us-east-1")
S3_BUCKET   = os.getenv("AWS_S3_BUCKET", "")
USE_LOCAL   = os.getenv("USE_LOCAL_STORAGE", "true").lower() == "true" or not S3_BUCKET


# ──────────────────────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    resume_id: str
    s3_key: Optional[str] = None
    file_type: Optional[str] = "pdf"
    text: Optional[str] = None           # provide text directly (testing)
    callback_url: Optional[str] = None    # where to POST results


class AnalyzeResponse(BaseModel):
    resume_id: str
    status: str = "processing"
    message: str = "Analysis started in background"


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
# Helper: fetch file bytes from S3 or local
# ──────────────────────────────────────────────────────────────

async def _fetch_file_bytes(s3_key: str) -> bytes:
    if USE_LOCAL:
        local_path = os.path.join("/app/uploads", s3_key.replace("/", "_"))
        if not os.path.exists(local_path):
            raise FileNotFoundError(f"Local file not found: {local_path}")
        with open(local_path, "rb") as f:
            return f.read()
    else:
        url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.content


# ──────────────────────────────────────────────────────────────
# Full pipeline (runs in background)
# ──────────────────────────────────────────────────────────────

async def run_pipeline(
    resume_id: str,
    s3_key: Optional[str],
    file_type: str,
    text_override: Optional[str],
    callback_url: str,
) -> None:
    try:
        # Step 1: Extract text
        if text_override:
            raw_text = text_override
        elif s3_key:
            file_bytes = await _fetch_file_bytes(s3_key)
            raw_text = extract_text(file_bytes, file_type)
        else:
            raise ValueError("No text or s3_key provided")

        if not raw_text.strip():
            raise ValueError("Extracted text is empty — file may be scanned/image-based")

        # Step 2: Detect sections
        sections = detect_sections(raw_text)
        detected_section_names = get_detected_section_names(sections)

        # Step 3: Extract skills
        skills = extract_skills(raw_text)

        # Step 4: Grammar check
        grammar_issues = check_grammar(raw_text)

        # Step 5: ATS score
        ats_score = compute_ats_score(raw_text, sections)

        # Step 6: Quality score + strength
        quality_score = compute_quality_score(
            raw_text, sections, grammar_issues, skills, ats_score
        )
        strength = classify_strength(quality_score)

        # Step 7: Insights
        insights = build_insights(ats_score, quality_score, sections, grammar_issues, skills)

        result = {
            "ats_score": ats_score,
            "quality_score": quality_score,
            "strength": strength,
            "extracted_skills": skills,
            "grammar_issues": grammar_issues,
            "sections_detected": detected_section_names,
            "word_count": len(raw_text.split()),
            "insights": insights,
            "raw_result": {
                "text_length": len(raw_text),
                "sections": {k: bool(v) for k, v in sections.items()},
            },
        }

        # Step 8: POST result back to backend
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(callback_url, json=result)

    except Exception as exc:
        print(f"[pipeline] Error for resume {resume_id}: {exc}")
        # Notify backend of failure
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                await client.post(callback_url, json={"error": str(exc)})
        except Exception:
            pass


# ──────────────────────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ml-service", "version": "2.0.0"}


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_resume(req: AnalyzeRequest, background_tasks: BackgroundTasks):
    """
    Kick off async resume analysis pipeline.
    Results are POSTed to callback_url when complete.
    """
    callback_url = (
        req.callback_url
        or f"{BACKEND_URL}/api/resumes/{req.resume_id}/analysis"
    )

    background_tasks.add_task(
        run_pipeline,
        req.resume_id,
        req.s3_key,
        req.file_type or "pdf",
        req.text,
        callback_url,
    )

    return AnalyzeResponse(
        resume_id=req.resume_id,
        status="processing",
        message="Analysis pipeline started. Results will be posted to callback_url.",
    )


@app.post("/analyze/sync")
async def analyze_resume_sync(req: AnalyzeRequest):
    """
    Synchronous analysis — returns results directly.
    Useful for testing without a running backend.
    """
    if not req.text:
        raise HTTPException(status_code=400, detail="text is required for sync mode")

    raw_text = req.text
    sections = detect_sections(raw_text)
    skills = extract_skills(raw_text)
    grammar_issues = check_grammar(raw_text)
    ats_score = compute_ats_score(raw_text, sections)
    quality_score = compute_quality_score(raw_text, sections, grammar_issues, skills, ats_score)
    strength = classify_strength(quality_score)
    insights = build_insights(ats_score, quality_score, sections, grammar_issues, skills)

    return {
        "resume_id": req.resume_id,
        "ats_score": ats_score,
        "quality_score": quality_score,
        "strength": strength,
        "extracted_skills": skills,
        "grammar_issues": grammar_issues,
        "sections_detected": get_detected_section_names(sections),
        "word_count": len(raw_text.split()),
        "insights": insights,
    }


@app.post("/match", response_model=MatchResponse)
async def match_jd(req: MatchRequest):
    """Phase 3: TF-IDF cosine similarity matching (stub)."""
    return MatchResponse(
        similarity_score=0.0,
        hiring_probability=0.0,
        matched_keywords=[],
        skill_gaps=[],
        rank_explanation="JD matching implemented in Phase 3",
    )
