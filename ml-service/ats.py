"""
ATS (Applicant Tracking System) scoring algorithm.
Score 0-100 based on industry-standard ATS criteria.
"""

import re
from typing import Dict, List, Optional

# ── Action verbs commonly rewarded by ATS ────────────────────
ACTION_VERBS = {
    "achieved", "built", "created", "delivered", "designed",
    "developed", "drove", "engineered", "established", "executed",
    "generated", "implemented", "improved", "increased", "launched",
    "led", "managed", "optimized", "oversaw", "planned",
    "produced", "reduced", "resolved", "shipped", "streamlined",
    "transformed", "utilized", "validated", "architected", "automated",
    "collaborated", "coordinated", "contributed", "deployed", "enhanced",
    "facilitated", "handled", "identified", "integrated", "maintained",
    "mentored", "migrated", "monitored", "negotiated", "operated",
    "owned", "partnered", "prioritized", "refactored", "scaled",
}

# ── Metric patterns (numbers, %, $, x multipliers) ───────────
METRIC_PATTERN = re.compile(
    r"\b(\d+[\.,]?\d*\s*(%|percent|x|times|million|billion|k\b|hrs?|hours?|\$)|\$\s*\d+)",
    re.IGNORECASE,
)

# ── Key ATS sections (required for good score) ───────────────
ATS_REQUIRED_SECTIONS = {"contact", "summary", "experience", "education", "skills"}
ATS_BONUS_SECTIONS = {"projects", "certifications", "awards"}

# ── Optimal word count range ──────────────────────────────────
OPTIMAL_MIN_WORDS = 350
OPTIMAL_MAX_WORDS = 900


def compute_ats_score(
    text: str,
    sections: Dict[str, Optional[str]],
) -> float:
    """
    Compute ATS compatibility score (0–100).

    Breakdown:
      - Section presence    : 35 pts
      - Bullet usage        : 20 pts
      - Action verbs        : 20 pts
      - Quantified metrics  : 15 pts
      - Length optimality   : 10 pts
    """
    words = text.split()
    word_count = len(words)
    lower_words = {w.lower().strip(".,;:") for w in words}
    detected = {k for k, v in sections.items() if v}

    # 1. Section presence (35 pts)
    required_present = len(ATS_REQUIRED_SECTIONS & detected)
    bonus_present = len(ATS_BONUS_SECTIONS & detected)
    section_score = (required_present / len(ATS_REQUIRED_SECTIONS)) * 30
    section_score += min(bonus_present, 2) * 2.5  # up to 5 bonus pts
    section_score = min(section_score, 35)

    # 2. Bullet point usage (20 pts) — presence of bullet chars
    bullet_lines = len(
        [
            l
            for l in text.splitlines()
            if l.strip().startswith(("•", "-", "*", "·", "▪", "–", "○", "►"))
        ]
    )
    bullet_score = min((bullet_lines / max(word_count / 20, 1)) * 20, 20)

    # 3. Action verbs (20 pts)
    verb_matches = lower_words & ACTION_VERBS
    action_score = min((len(verb_matches) / 8) * 20, 20)

    # 4. Quantified metrics (15 pts)
    metric_matches = METRIC_PATTERN.findall(text)
    metric_score = min((len(metric_matches) / 5) * 15, 15)

    # 5. Word count optimality (10 pts)
    if OPTIMAL_MIN_WORDS <= word_count <= OPTIMAL_MAX_WORDS:
        length_score = 10.0
    elif word_count < OPTIMAL_MIN_WORDS:
        length_score = max(0, (word_count / OPTIMAL_MIN_WORDS) * 10)
    else:
        overage = (word_count - OPTIMAL_MAX_WORDS) / OPTIMAL_MAX_WORDS
        length_score = max(0, 10 - overage * 10)

    total = section_score + bullet_score + action_score + metric_score + length_score
    return round(min(max(total, 0), 100), 2)
