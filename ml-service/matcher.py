"""
TF-IDF cosine similarity matcher for resume ↔ JD matching.
"""

import re
from typing import List, Tuple, Dict, Any

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def _preprocess(text: str) -> str:
    """Lowercase and strip punctuation."""
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _extract_top_keywords(vectorizer: TfidfVectorizer, tfidf_row, top_n: int = 20) -> List[str]:
    """Return top-N terms by TF-IDF weight from a single document row."""
    feature_names = vectorizer.get_feature_names_out()
    row = tfidf_row.toarray()[0]
    top_indices = row.argsort()[-top_n:][::-1]
    return [feature_names[i] for i in top_indices if row[i] > 0]


def match_resume_to_jd(
    resume_text: str,
    jd_text: str,
) -> Dict[str, Any]:
    """
    Compute TF-IDF cosine similarity between a resume and a job description.

    Returns:
        similarity_score  : float 0.0–1.0
        matched_keywords  : List[str] — JD keywords present in resume
        skill_gaps        : List[str] — JD keywords absent from resume
        jd_keywords       : List[str] — all extracted JD keywords
    """
    clean_resume = _preprocess(resume_text)
    clean_jd = _preprocess(jd_text)

    if not clean_resume or not clean_jd:
        return {
            "similarity_score": 0.0,
            "matched_keywords": [],
            "skill_gaps": [],
            "jd_keywords": [],
        }

    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),  # unigrams + bigrams
        max_features=500,
        min_df=1,
    )

    try:
        tfidf_matrix = vectorizer.fit_transform([clean_resume, clean_jd])
    except ValueError:
        return {"similarity_score": 0.0, "matched_keywords": [], "skill_gaps": [], "jd_keywords": []}

    score = float(cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0])

    # JD keyword set
    jd_keywords = _extract_top_keywords(vectorizer, tfidf_matrix[1:2], top_n=30)
    resume_words = set(clean_resume.split())

    matched = [kw for kw in jd_keywords if all(w in resume_words for w in kw.split())]
    gaps = [kw for kw in jd_keywords if kw not in matched]

    return {
        "similarity_score": round(score, 4),
        "matched_keywords": matched[:20],
        "skill_gaps": gaps[:15],
        "jd_keywords": jd_keywords,
    }
