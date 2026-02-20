"""
AI Resume Analyzer — ML Service v3.0
Full pipeline: NLP analysis + JD matching + hiring probability + role prediction + anomaly detection
"""

import os
import io
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Any, Dict

load_dotenv()

from extractor import extract_text
from sections import detect_sections, get_detected_section_names
from skills import extract_skills
from grammar import check_grammar
from ats import compute_ats_score
from quality import compute_quality_score, classify_strength, build_insights
from matcher import match_resume_to_jd
from hiring_probability import compute_hiring_probability
from role_predictor import predict_role
from anomaly import detect_anomalies

app = FastAPI(
    title="AI Resume Analyzer — ML Service",
    description="Full NLP + JD matching + hiring probability + role prediction",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BACKEND_URL = os.getenv("BACKEND_INTERNAL_URL", "http://backend:4000")
S3_BUCKET   = os.getenv("AWS_S3_BUCKET", "")
AWS_REGION  = os.getenv("AWS_REGION", "us-east-1")
USE_LOCAL   = os.getenv("USE_LOCAL_STORAGE", "true").lower() == "true" or not S3_BUCKET


# ──────────────────────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    resume_id: str
    s3_key: Optional[str] = None
    file_type: Optional[str] = "pdf"
    text: Optional[str] = None
    callback_url: Optional[str] = None


class ResumeForMatch(BaseModel):
    id: str
    name: str
    skills: List[str] = []
    ats_score: float = 0.0
    quality_score: float = 0.0
    text: Optional[str] = ""


class MatchRequest(BaseModel):
    job_id: str
    jd_text: str
    resumes: List[ResumeForMatch]
    callback_url: Optional[str] = None


# ──────────────────────────────────────────────────────────────
# File fetch helper
# ──────────────────────────────────────────────────────────────

async def _fetch_file_bytes(s3_key: str) -> bytes:
    if USE_LOCAL:
        local_path = os.path.join("/app/uploads", s3_key.replace("/", "_"))
        if not os.path.exists(local_path):
            raise FileNotFoundError(f"Local file not found: {local_path}")
        with open(local_path, "rb") as f:
            return f.read()
    url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return resp.content


# ──────────────────────────────────────────────────────────────
# Resume analysis pipeline (background)
# ──────────────────────────────────────────────────────────────

async def run_analysis_pipeline(
    resume_id: str,
    s3_key: Optional[str],
    file_type: str,
    text_override: Optional[str],
    callback_url: str,
) -> None:
    try:
        if text_override:
            raw_text = text_override
        elif s3_key:
            file_bytes = await _fetch_file_bytes(s3_key)
            raw_text = extract_text(file_bytes, file_type)
        else:
            raise ValueError("No text or s3_key provided")

        if not raw_text.strip():
            raise ValueError("Extracted text is empty — file may be image-based")

        sections        = detect_sections(raw_text)
        skills          = extract_skills(raw_text)
        grammar_issues  = check_grammar(raw_text)
        ats_score       = compute_ats_score(raw_text, sections)
        quality_score   = compute_quality_score(raw_text, sections, grammar_issues, skills, ats_score)
        strength        = classify_strength(quality_score)
        insights        = build_insights(ats_score, quality_score, sections, grammar_issues, skills)
        role_info       = predict_role(skills, raw_text)
        anomalies       = detect_anomalies(raw_text, sections, len(raw_text.split()))

        result = {
            "ats_score": ats_score,
            "quality_score": quality_score,
            "strength": strength,
            "extracted_skills": skills,
            "grammar_issues": grammar_issues,
            "sections_detected": get_detected_section_names(sections),
            "word_count": len(raw_text.split()),
            "insights": insights,
            "role_prediction": role_info,
            "anomalies": anomalies,
            "raw_result": {
                "text_length": len(raw_text),
                "sections": {k: bool(v) for k, v in sections.items()},
                "text": raw_text[:5000],  # store first 5k chars for JD matching
            },
        }

        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(callback_url, json=result)

    except Exception as exc:
        print(f"[analysis] Error for {resume_id}: {exc}")
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                await client.post(callback_url, json={"error": str(exc)})
        except Exception:
            pass


# ──────────────────────────────────────────────────────────────
# JD match pipeline (background)
# ──────────────────────────────────────────────────────────────

async def run_match_pipeline(
    job_id: str,
    jd_text: str,
    resumes: List[ResumeForMatch],
    callback_url: str,
) -> None:
    try:
        results = []
        for resume in resumes:
            resume_text = resume.text or " ".join(resume.skills)

            match_result = match_resume_to_jd(resume_text, jd_text)

            prob_result  = compute_hiring_probability(
                similarity_score    = match_result["similarity_score"],
                ats_score           = resume.ats_score,
                quality_score       = resume.quality_score,
                skills_matched_count= len(match_result["matched_keywords"]),
                total_jd_keywords   = len(match_result["jd_keywords"]),
            )

            role_info = predict_role(resume.skills, resume_text)

            sections_dummy = {}  # already analyzed; no text needed for anomaly
            anomalies = detect_anomalies(resume_text, sections_dummy, len(resume_text.split()))

            results.append({
                "resume_id":         resume.id,
                "resume_name":       resume.name,
                "similarity_score":  match_result["similarity_score"],
                "hiring_probability": prob_result["probability"],
                "matched_keywords":  match_result["matched_keywords"],
                "skill_gaps":        match_result["skill_gaps"],
                "explanation":       prob_result["explanation"],
<<<<<<< HEAD
                "role_prediction":   role_info["role"],
                "role_confidence":   role_info["confidence"],
                "role_alternatives": role_info["alternatives"],
=======
                "role_prediction":   role_info,
>>>>>>> 00d4f48 (Today's final commit)
                "anomalies":         anomalies,
            })

        # Sort by hiring probability
        results.sort(key=lambda x: x["hiring_probability"], reverse=True)
        for i, r in enumerate(results):
            r["rank"] = i + 1

        async with httpx.AsyncClient(timeout=15) as client:
            await client.post(callback_url, json={"matches": results})

    except Exception as exc:
        print(f"[match] Error for job {job_id}: {exc}")
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
    return {"status": "ok", "service": "ml-service", "version": "3.0.0"}


@app.post("/analyze")
async def analyze_resume(req: AnalyzeRequest, background_tasks: BackgroundTasks):
    callback_url = req.callback_url or f"{BACKEND_URL}/api/resumes/{req.resume_id}/analysis"
    background_tasks.add_task(
        run_analysis_pipeline,
        req.resume_id, req.s3_key, req.file_type or "pdf", req.text, callback_url,
    )
    return {"resume_id": req.resume_id, "status": "processing"}


@app.post("/analyze/sync")
async def analyze_sync(req: AnalyzeRequest):
    if not req.text:
        raise HTTPException(400, "text is required for sync mode")
    raw_text = req.text
    sections       = detect_sections(raw_text)
    skills         = extract_skills(raw_text)
    grammar_issues = check_grammar(raw_text)
    ats_score      = compute_ats_score(raw_text, sections)
    quality_score  = compute_quality_score(raw_text, sections, grammar_issues, skills, ats_score)
    strength       = classify_strength(quality_score)
    insights       = build_insights(ats_score, quality_score, sections, grammar_issues, skills)
    role_info      = predict_role(skills, raw_text)
    anomalies      = detect_anomalies(raw_text, sections, len(raw_text.split()))
    return {
        "resume_id": req.resume_id,
        "ats_score": ats_score, "quality_score": quality_score,
        "strength": strength, "extracted_skills": skills,
        "grammar_issues": grammar_issues,
        "sections_detected": get_detected_section_names(sections),
        "word_count": len(raw_text.split()),
        "insights": insights,
        "role_prediction": role_info,
        "anomalies": anomalies,
    }


@app.post("/match")
async def match_jd(req: MatchRequest, background_tasks: BackgroundTasks):
    callback_url = req.callback_url or f"{BACKEND_URL}/api/jobs/{req.job_id}/match-result"
    background_tasks.add_task(
        run_match_pipeline, req.job_id, req.jd_text, req.resumes, callback_url,
    )
    return {
        "job_id": req.job_id,
        "status": "processing",
        "resume_count": len(req.resumes),
        "message": "Matching pipeline started",
    }


@app.post("/predict-role")
async def predict_role_endpoint(body: Dict[str, Any]):
    skills = body.get("skills", [])
    text   = body.get("text", "")
    return predict_role(skills, text)
