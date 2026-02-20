"""
Rule-based role predictor — classifies a resume into one of 20 role categories
based on skill vocabulary intersection.
"""

from typing import Dict, List, Tuple

# ── Role definitions: role → required skill fingerprints ─────
ROLE_SKILLS: Dict[str, List[str]] = {
    "ML/AI Engineer": [
        "tensorflow", "pytorch", "scikit-learn", "keras", "pandas", "numpy",
        "machine learning", "deep learning", "nlp", "hugging face", "llm",
        "langchain", "spacy", "mlflow", "airflow", "computer vision",
    ],
    "Data Scientist": [
        "pandas", "numpy", "matplotlib", "seaborn", "plotly", "r",
        "jupyter", "statistics", "data analysis", "data visualization",
        "scikit-learn", "hypothesis testing", "tableau", "power bi",
    ],
    "Data Engineer": [
        "spark", "kafka", "airflow", "dbt", "etl", "data pipeline",
        "snowflake", "redshift", "bigquery", "data warehouse", "hadoop",
        "hive", "flink",
    ],
    "Backend Engineer": [
        "node.js", "express.js", "python", "java", "spring boot", "django",
        "flask", "fastapi", "rest api", "postgresql", "mysql", "mongodb",
        "redis", "graphql", "microservices",
    ],
    "Frontend Engineer": [
        "react", "next.js", "vue.js", "angular", "typescript", "javascript",
        "html", "css", "tailwind css", "sass", "webpack", "vite",
        "responsive design", "figma",
    ],
    "Full Stack Engineer": [
        "react", "node.js", "postgresql", "mongodb", "typescript",
        "rest api", "docker", "aws", "express.js",
    ],
    "DevOps / SRE": [
        "docker", "kubernetes", "terraform", "ansible", "helm", "ci/cd",
        "jenkins", "github actions", "aws", "gcp", "azure", "linux",
        "nginx", "prometheus", "grafana", "argocd",
    ],
    "Cloud Architect": [
        "aws", "gcp", "azure", "cloudformation", "terraform", "eks",
        "ecs", "lambda", "s3", "iam", "vpc", "cloud architecture",
    ],
    "Mobile Developer (iOS/Android)": [
        "swift", "kotlin", "ios", "android", "react native", "flutter",
        "xcode", "android studio", "expo",
    ],
    "Security Engineer": [
        "penetration testing", "owasp", "iam", "zero trust", "soc 2",
        "cryptography", "vulnerability assessment", "security",
    ],
    "QA / Test Engineer": [
        "jest", "cypress", "playwright", "selenium", "pytest",
        "junit", "tdd", "bdd", "postman",
    ],
    "Blockchain / Web3": [
        "solidity", "ethereum", "web3", "smart contracts", "blockchain",
        "hardhat", "truffle", "defi",
    ],
    "Product Manager": [
        "agile", "scrum", "kanban", "jira", "roadmap", "product strategy",
        "user research", "okrs", "stakeholder management",
    ],
    "Engineering Manager": [
        "team leadership", "mentoring", "agile", "scrum", "hiring",
        "performance review", "roadmap", "stakeholder management",
    ],
    "System Design / Architect": [
        "system design", "microservices", "distributed systems", "caching",
        "load balancing", "kafka", "event driven", "api gateway",
    ],
    "Data Analyst": [
        "sql", "excel", "tableau", "power bi", "data visualization",
        "pandas", "google analytics", "looker",
    ],
    "Research Scientist": [
        "reinforcement learning", "computer vision", "nlp", "pytorch",
        "tensorflow", "research", "publications", "phd", "mathematics",
    ],
    "Site Reliability Engineer": [
        "kubernetes", "prometheus", "grafana", "terraform", "on-call",
        "incident management", "reliability", "observability",
    ],
    "Technical Writer": [
        "technical writing", "documentation", "markdown", "confluence",
        "api documentation", "swagger",
    ],
    "Software Engineer (General)": [
        "python", "java", "c++", "algorithms", "data structures",
        "oop", "git", "code review",
    ],
}


def predict_role(
    skills: List[str],
    text: str = "",
) -> Dict[str, object]:
    """
    Predict the most likely role for a candidate.

    Args:
        skills  : List of extracted skill strings
        text    : Full resume text (for fallback keyword matching)

    Returns:
        role         : str — predicted role name
        confidence   : float 0–1
        alternatives : List[str] — top 3 alternative roles
        scores       : Dict[str, int] — all role match counts
    """
    lower_skills = {s.lower() for s in skills}
    lower_text   = text.lower()

    scores: Dict[str, int] = {}
    for role, keywords in ROLE_SKILLS.items():
        matched = sum(
            1 for kw in keywords
            if kw in lower_skills or kw in lower_text
        )
        scores[role] = matched

    # Sort by score descending
    ranked: List[Tuple[str, int]] = sorted(scores.items(), key=lambda x: x[1], reverse=True)

    if not ranked or ranked[0][1] == 0:
        return {
            "role": "Software Engineer (General)",
            "confidence": 0.30,
            "alternatives": [],
            "scores": scores,
        }

    best_role, best_score = ranked[0]
    total_keywords = len(ROLE_SKILLS.get(best_role, []))
    confidence = round(min(best_score / max(total_keywords, 1), 1.0), 4)

    alternatives = [r for r, _ in ranked[1:4] if _ > 0]

    return {
        "role": best_role,
        "confidence": confidence,
        "alternatives": alternatives,
        "scores": scores,
    }
