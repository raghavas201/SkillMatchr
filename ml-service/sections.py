"""
Resume section detector using heading-pattern regex heuristics.
"""

import re
from typing import Dict, List, Optional

# ── Section heading patterns ─────────────────────────────────
SECTION_PATTERNS: Dict[str, List[str]] = {
    "contact": [
        r"contact(\s+information)?",
        r"personal(\s+details)?",
        r"(phone|email|linkedin|github)",
    ],
    "summary": [
        r"(professional\s+)?summary",
        r"objective",
        r"profile",
        r"about(\s+me)?",
        r"career\s+objective",
    ],
    "experience": [
        r"(work|professional|employment)(\s+history|\s+experience)?",
        r"experience",
        r"positions?(\s+held)?",
        r"career(\s+history)?",
    ],
    "education": [
        r"education(al\s+background)?",
        r"academic(\s+background|\s+qualifications)?",
        r"qualifications?",
        r"degrees?",
    ],
    "skills": [
        r"(technical\s+)?skills?",
        r"core\s+competencies",
        r"competencies",
        r"technologies",
        r"expertise",
        r"proficiencies",
    ],
    "projects": [
        r"projects?",
        r"personal\s+projects?",
        r"side\s+projects?",
        r"portfolio",
    ],
    "certifications": [
        r"certifications?",
        r"licenses?(\s+&\s+certifications?)?",
        r"credentials?",
        r"courses?(\s+&\s+certifications?)?",
    ],
    "awards": [
        r"awards?",
        r"honors?",
        r"achievements?",
        r"accomplishments?",
    ],
    "languages": [
        r"languages?",
        r"spoken\s+languages?",
    ],
    "publications": [
        r"publications?",
        r"research",
        r"papers?",
    ],
}


def _compile_patterns(patterns: List[str]) -> re.Pattern:
    combined = "|".join(f"(?:{p})" for p in patterns)
    return re.compile(combined, re.IGNORECASE)


COMPILED_PATTERNS = {
    section: _compile_patterns(patterns)
    for section, patterns in SECTION_PATTERNS.items()
}


def detect_sections(text: str) -> Dict[str, Optional[str]]:
    """
    Returns a dict mapping section names to their extracted text content.
    If a section is not found, its value is None.
    """
    lines = text.splitlines()
    sections: Dict[str, Optional[str]] = {s: None for s in SECTION_PATTERNS}

    current_section: Optional[str] = None
    current_lines: List[str] = []
    section_order: List[str] = []

    def _is_heading(line: str) -> Optional[str]:
        """Return section name if line looks like a section heading, else None."""
        stripped = line.strip()
        # Headings are typically short (< 60 chars) and capitalized
        if not stripped or len(stripped) > 60:
            return None
        for section, pattern in COMPILED_PATTERNS.items():
            if pattern.fullmatch(stripped.rstrip(":").strip()):
                return section
            # Looser match for lines that mostly match
            if pattern.search(stripped) and len(stripped) < 40:
                return section
        return None

    for line in lines:
        heading = _is_heading(line)
        if heading:
            # Save current section buffer
            if current_section:
                sections[current_section] = "\n".join(current_lines).strip()
            current_section = heading
            current_lines = []
            if heading not in section_order:
                section_order.append(heading)
        elif current_section:
            current_lines.append(line)

    # Flush last section
    if current_section:
        sections[current_section] = "\n".join(current_lines).strip()

    return sections


def get_detected_section_names(sections: Dict[str, Optional[str]]) -> List[str]:
    """Return list of sections that were actually found."""
    return [k for k, v in sections.items() if v is not None and v.strip()]
