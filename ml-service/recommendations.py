"""
Learning recommendations engine.
Maps skill gaps → curated resource suggestions.
"""

from typing import List, Dict, Any

_RESOURCE_MAP: Dict[str, List[Dict[str, str]]] = {
    "python": [
        {"title": "Python Official Tutorial", "url": "https://docs.python.org/3/tutorial/", "type": "Documentation"},
        {"title": "Real Python", "url": "https://realpython.com", "type": "Articles & Tutorials"},
        {"title": "CS50P — Python (Harvard free)", "url": "https://cs50.harvard.edu/python/", "type": "Free Course"},
    ],
    "javascript": [
        {"title": "MDN Web Docs — JavaScript", "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript", "type": "Documentation"},
        {"title": "javascript.info", "url": "https://javascript.info", "type": "Free Book"},
        {"title": "freeCodeCamp JS Algorithms", "url": "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/", "type": "Free Course"},
    ],
    "typescript": [
        {"title": "TypeScript Handbook", "url": "https://www.typescriptlang.org/docs/handbook/", "type": "Documentation"},
        {"title": "Total TypeScript", "url": "https://www.totaltypescript.com", "type": "Video Course"},
    ],
    "react": [
        {"title": "React Official Docs", "url": "https://react.dev", "type": "Documentation"},
        {"title": "Epic React by Kent C. Dodds", "url": "https://epicreact.dev", "type": "Premium Course"},
    ],
    "node": [
        {"title": "Node.js Official Guides", "url": "https://nodejs.org/en/docs/guides", "type": "Documentation"},
        {"title": "The Odin Project — Node", "url": "https://www.theodinproject.com/paths/full-stack-javascript/courses/nodejs", "type": "Free Course"},
    ],
    "sql": [
        {"title": "SQLZoo", "url": "https://sqlzoo.net", "type": "Interactive Practice"},
        {"title": "Mode SQL Tutorial", "url": "https://mode.com/sql-tutorial/", "type": "Guided Tutorial"},
    ],
    "machine learning": [
        {"title": "Andrew Ng — ML Specialization (Coursera)", "url": "https://www.coursera.org/specializations/machine-learning-introduction", "type": "Course"},
        {"title": "fast.ai — Practical Deep Learning", "url": "https://course.fast.ai", "type": "Free Course"},
        {"title": "Kaggle — Intro to ML", "url": "https://www.kaggle.com/learn/intro-to-machine-learning", "type": "Free Course"},
    ],
    "deep learning": [
        {"title": "Deep Learning Specialization — Coursera", "url": "https://www.coursera.org/specializations/deep-learning", "type": "Course"},
        {"title": "fast.ai", "url": "https://course.fast.ai", "type": "Free Course"},
    ],
    "docker": [
        {"title": "Docker Official Get Started", "url": "https://docs.docker.com/get-started/", "type": "Documentation"},
        {"title": "Play with Docker", "url": "https://labs.play-with-docker.com", "type": "Interactive"},
    ],
    "kubernetes": [
        {"title": "Kubernetes Official Tutorial", "url": "https://kubernetes.io/docs/tutorials/", "type": "Documentation"},
        {"title": "Kodekloud — Kubernetes for Beginners", "url": "https://kodekloud.com/courses/kubernetes-for-the-absolute-beginners-hands-on/", "type": "Course"},
    ],
    "aws": [
        {"title": "AWS Skill Builder", "url": "https://skillbuilder.aws", "type": "Free Platform"},
        {"title": "AWS Certified Solutions Architect", "url": "https://aws.amazon.com/certification/certified-solutions-architect-associate/", "type": "Certification"},
    ],
    "git": [
        {"title": "Pro Git (free book)", "url": "https://git-scm.com/book/en/v2", "type": "Free Book"},
        {"title": "Oh My Git!", "url": "https://ohmygit.org", "type": "Game / Interactive"},
    ],
    "system design": [
        {"title": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer", "type": "GitHub Resource"},
        {"title": "Grokking System Design", "url": "https://www.designgurus.io/course/grokking-the-system-design-interview", "type": "Course"},
    ],
    "data structures": [
        {"title": "LeetCode — Study Plan", "url": "https://leetcode.com/study-plan/", "type": "Practice Platform"},
        {"title": "NeetCode", "url": "https://neetcode.io", "type": "Free Video + Practice"},
    ],
    "algorithms": [
        {"title": "Algorithms Part I & II (Princeton — Coursera, free audit)", "url": "https://www.coursera.org/learn/algorithms-part1", "type": "Free Course"},
        {"title": "AlgoExpert", "url": "https://www.algoexpert.io", "type": "Premium Practice"},
    ],
}

_GENERIC = [
    {"title": "LeetCode — Daily Coding Practice", "url": "https://leetcode.com", "type": "Practice"},
    {"title": "roadmap.sh — Developer Roadmaps", "url": "https://roadmap.sh", "type": "Roadmap"},
    {"title": "freeCodeCamp", "url": "https://www.freecodecamp.org", "type": "Free Platform"},
]


def get_learning_recommendations(
    skill_gaps: List[str],
    role: str = "",
) -> Dict[str, Any]:
    """
    Map skill gaps to learning resources.

    Returns:
        {
          "recommendations": [
              { "skill": str, "resources": [...] }
          ],
          "general": [...],
          "total_resources": int,
        }
    """
    recommendations: List[Dict[str, Any]] = []
    covered: set = set()

    for gap in skill_gaps:
        gap_lower = gap.lower()
        matched_resources: List[Dict[str, str]] = []

        for key, resources in _RESOURCE_MAP.items():
            if key in gap_lower or gap_lower in key:
                for r in resources:
                    if r["url"] not in covered:
                        matched_resources.append(r)
                        covered.add(r["url"])
                break

        if matched_resources:
            recommendations.append({"skill": gap, "resources": matched_resources})
        else:
            # Generic fallback for unknown skill
            recommendations.append({
                "skill": gap,
                "resources": [
                    {
                        "title": f"Search '{gap}' on roadmap.sh",
                        "url": f"https://roadmap.sh/search?q={gap.replace(' ', '+')}",
                        "type": "Roadmap",
                    }
                ],
            })

    total = sum(len(r["resources"]) for r in recommendations) + len(_GENERIC)

    return {
        "recommendations": recommendations,
        "general": _GENERIC,
        "total_resources": total,
    }
