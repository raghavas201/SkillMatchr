"""
Skill extraction using spaCy PhraseMatcher + curated vocabulary.
"""

import json
from pathlib import Path
from typing import List

import spacy
from spacy.matcher import PhraseMatcher

# ── Load spaCy model once at module level ─────────────────────
nlp = spacy.load("en_core_web_sm")

# ── Load skills vocabulary ────────────────────────────────────
_VOCAB_PATH = Path(__file__).parent / "data" / "skills_vocab.json"

def _load_vocab() -> List[str]:
    if _VOCAB_PATH.exists():
        with open(_VOCAB_PATH) as f:
            data = json.load(f)
        # Support both flat list and {"skills": [...]} structure
        if isinstance(data, list):
            return data
        return data.get("skills", [])
    return []

_SKILLS_VOCAB: List[str] = _load_vocab()

# ── Build PhraseMatcher ───────────────────────────────────────
_matcher = PhraseMatcher(nlp.vocab, attr="LOWER")
if _SKILLS_VOCAB:
    patterns = list(nlp.pipe(_SKILLS_VOCAB))
    _matcher.add("SKILLS", patterns)


def extract_skills(text: str) -> List[str]:
    """
    Extract skills from resume text using spaCy PhraseMatcher.
    Returns a deduplicated, sorted list of matched skills.
    """
    if not text.strip():
        return []

    doc = nlp(text)
    matches = _matcher(doc)

    found: set[str] = set()
    for _match_id, start, end in matches:
        skill = doc[start:end].text
        found.add(skill)

    # Also try NER — PRODUCT / ORG entities often map to tech skills
    for ent in doc.ents:
        if ent.label_ in ("PRODUCT", "ORG", "WORK_OF_ART"):
            candidate = ent.text.strip()
            if candidate.lower() in {s.lower() for s in _SKILLS_VOCAB}:
                found.add(candidate)

    return sorted(found, key=str.lower)
