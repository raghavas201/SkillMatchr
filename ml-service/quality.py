"""
Resume quality scoring: composite 0–100 + strength classification.
"""

from typing import Dict, List, Any, Optional


# Strength thresholds
THRESHOLDS = {
    "excellent": 80,
    "strong": 60,
    "average": 40,
    "weak": 0,
}


def compute_quality_score(
    text: str,
    sections: Dict[str, Optional[str]],
    grammar_issues: List[Dict[str, Any]],
    skills: List[str],
    ats_score: float,
) -> float:
    """
    Composite quality score 0–100.

    Weights:
      - Skills richness   : 25 pts
      - Grammar quality   : 25 pts
      - Section coverage  : 25 pts
      - ATS contribution  : 25 pts
    """
    # 1. Skills richness (25 pts) — 15+ unique skills = full marks
    skill_score = min((len(skills) / 15) * 25, 25)

    # 2. Grammar quality (25 pts) — penalise per issue
    errors = sum(1 for i in grammar_issues if i.get("severity") == "error")
    warnings = sum(1 for i in grammar_issues if i.get("severity") == "warning")
    grammar_penalty = (errors * 4) + (warnings * 2)
    grammar_score = max(0, 25 - grammar_penalty)

    # 3. Section coverage (25 pts)
    all_sections = {
        "contact", "summary", "experience", "education",
        "skills", "projects", "certifications",
    }
    detected = {k for k, v in sections.items() if v and v.strip()}
    section_score = (len(detected & all_sections) / len(all_sections)) * 25

    # 4. ATS contribution (25 pts)
    ats_contribution = (ats_score / 100) * 25

    total = skill_score + grammar_score + section_score + ats_contribution
    return round(min(max(total, 0), 100), 2)


def classify_strength(quality_score: float) -> str:
    """Map a quality score to a human-readable strength label."""
    if quality_score >= THRESHOLDS["excellent"]:
        return "excellent"
    elif quality_score >= THRESHOLDS["strong"]:
        return "strong"
    elif quality_score >= THRESHOLDS["average"]:
        return "average"
    return "weak"


def build_insights(
    ats_score: float,
    quality_score: float,
    sections: Dict[str, Optional[str]],
    grammar_issues: List[Dict[str, Any]],
    skills: List[str],
) -> List[str]:
    """Generate human-readable insights from the analysis."""
    insights: List[str] = []

    if ats_score >= 80:
        insights.append("✅ Excellent ATS compatibility — your resume is highly machine-readable.")
    elif ats_score >= 60:
        insights.append("🟡 Good ATS score. Add more quantified achievements to push higher.")
    else:
        insights.append("🔴 Low ATS score. Ensure key sections are present and use bullet points with action verbs.")

    required = {"summary", "experience", "education", "skills", "contact"}
    missing = required - {k for k, v in sections.items() if v}
    if missing:
        insights.append(f"⚠️ Missing sections: {', '.join(s.title() for s in missing)}")

    if len(skills) < 5:
        insights.append("📌 Very few skills detected. Expand your Skills section with specific technologies.")
    elif len(skills) >= 15:
        insights.append(f"🌟 Strong skills profile — {len(skills)} skills identified.")

    errors = [i for i in grammar_issues if i.get("severity") == "error"]
    if len(errors) > 5:
        insights.append(f"✏️ {len(errors)} grammar/spelling errors found. Proofread carefully before submitting.")
    elif len(errors) == 0:
        insights.append("✅ No major grammar errors detected.")

    if quality_score >= 80:
        insights.append("🏆 Your resume is in the top tier. Well done!")
    elif quality_score < 40:
        insights.append("📈 Significant improvements needed. Focus on completeness and quantifying impact.")

    return insights
