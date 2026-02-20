"""
Anomaly detector — flags suspicious resume patterns.
"""

import re
from typing import List, Dict, Optional


def detect_anomalies(
    text: str,
    sections: Dict[str, Optional[str]],
    word_count: int,
) -> List[str]:
    """
    Returns a list of anomaly warning strings.
    Each entry starts with an emoji and describes the issue.
    """
    warnings: List[str] = []
    lower = text.lower()

    # 1. Contact info missing
    has_email = bool(re.search(r"[\w.+-]+@[\w-]+\.\w+", text))
    has_phone = bool(re.search(r"(\+?\d[\d\s\-().]{7,}\d)", text))
    if not has_email and not has_phone:
        warnings.append("⚠️ No contact information (email or phone) detected.")

    # 2. Inflated word count — extremely long resume
    if word_count > 1200:
        warnings.append(
            f"📄 Resume is very long ({word_count} words). Most recruiters prefer 400–800 words."
        )

    # 3. Too short — not enough content
    if word_count < 150:
        warnings.append(
            f"📄 Resume seems very short ({word_count} words). Consider adding more detail."
        )

    # 4. Repetitive keyword overuse (keyword stuffing)
    words = re.findall(r"\b\w{4,}\b", lower)
    freq: Dict[str, int] = {}
    for w in words:
        if w not in {
            "with", "that", "this", "from", "your", "have", "been",
            "will", "more", "also", "were", "they", "their", "about",
        }:
            freq[w] = freq.get(w, 0) + 1

    overused = [w for w, c in freq.items() if c > 10 and len(w) > 5]
    if len(overused) >= 3:
        warnings.append(
            f"🔁 Possible keyword stuffing: '{', '.join(overused[:3])}' appear excessively."
        )

    # 5. No dates in experience section — suspicious
    exp_text = sections.get("experience") or ""
    if exp_text and not re.search(r"\b(19|20)\d{2}\b", exp_text):
        warnings.append("📅 No dates found in Experience section. Employment gaps may be hidden.")

    # 6. Generic objective detected
    generic_phrases = [
        "seeking a challenging position",
        "looking for an opportunity",
        "hardworking and dedicated",
        "team player",
        "fast learner",
        "go-getter",
    ]
    for phrase in generic_phrases:
        if phrase in lower:
            warnings.append(f"💬 Generic phrase detected: \"{phrase}\". Personalise your summary.")
            break

    # 7. Missing LinkedIn / GitHub (important for tech roles)
    has_linkedin = "linkedin" in lower
    has_github = "github" in lower
    if not has_linkedin and not has_github:
        warnings.append("🔗 No LinkedIn or GitHub profile URL detected.")

    return warnings
