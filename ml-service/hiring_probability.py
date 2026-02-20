"""
Hiring probability scoring with logistic-style formula + explainability.
"""

from typing import Dict, List


def compute_hiring_probability(
    similarity_score: float,
    ats_score: float,
    quality_score: float,
    skills_matched_count: int,
    total_jd_keywords: int = 20,
) -> Dict[str, float]:
    """
    Estimate probability of being hired (0–1) using a weighted formula.

    Factors and weights:
      - JD similarity (TF-IDF cosine)  : 35%
      - ATS score                       : 25%
      - Quality score                   : 25%
      - Keyword match ratio             : 15%

    Returns:
        probability    : float 0.0–1.0
        explanation    : dict of factor names → contribution scores
    """

    # Normalise inputs to 0–1 scale
    sim_norm   = float(similarity_score)  # already 0–1
    ats_norm   = float(ats_score) / 100.0
    qual_norm  = float(quality_score) / 100.0
    kw_ratio   = min(skills_matched_count / max(total_jd_keywords, 1), 1.0)

    # Weighted sum
    w_sim, w_ats, w_qual, w_kw = 0.35, 0.25, 0.25, 0.15

    raw_prob = (
        w_sim  * sim_norm +
        w_ats  * ats_norm +
        w_qual * qual_norm +
        w_kw   * kw_ratio
    )

    # Apply sigmoid-like boost to spread out scores
    # Clamp to reasonable bounds
    probability = round(max(0.02, min(0.98, raw_prob)), 4)

    explanation = {
        "jd_similarity": round(w_sim * sim_norm, 4),
        "ats_score":     round(w_ats * ats_norm, 4),
        "quality_score": round(w_qual * qual_norm, 4),
        "keyword_match": round(w_kw * kw_ratio, 4),
    }

    return {"probability": probability, "explanation": explanation}
