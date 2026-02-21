"""
Interview question generator — rule-based, skill-keyed.
"""

from typing import List, Dict, Any

# Skill → question bank  (easy / medium / hard)
_SKILL_QUESTIONS: Dict[str, Dict[str, List[str]]] = {
    "python": {
        "easy": [
            "What are Python's key data types?",
            "Explain the difference between a list and a tuple.",
            "What is a Python virtual environment and why use one?",
        ],
        "medium": [
            "What is the Global Interpreter Lock (GIL) and how does it affect multithreading?",
            "Explain list comprehensions and generator expressions — when would you prefer each?",
            "How does Python's garbage collection work?",
        ],
        "hard": [
            "Describe how you would implement a thread-safe singleton in Python.",
            "Explain Python's asyncio event loop and when async/await is preferable over threads.",
            "How do decorators work under the hood; implement a memoization decorator from scratch.",
        ],
    },
    "javascript": {
        "easy": [
            "What is the difference between `var`, `let`, and `const`?",
            "What is `undefined` vs `null` in JavaScript?",
            "Explain event bubbling and capturing.",
        ],
        "medium": [
            "How does the JavaScript event loop and call stack work?",
            "Explain closures and give a practical use case.",
            "What are Promises and how do they differ from callbacks?",
        ],
        "hard": [
            "Describe how you would implement a debounce function from scratch.",
            "Explain the differences between prototype-based and class-based inheritance in JS.",
            "How would you optimise a React application with large list rendering?",
        ],
    },
    "typescript": {
        "easy": [
            "What is TypeScript and what advantages does it add over plain JavaScript?",
            "What is the difference between `interface` and `type`?",
        ],
        "medium": [
            "Explain generics in TypeScript with a practical example.",
            "What are utility types (Partial, Required, Pick, Omit)? Give examples.",
        ],
        "hard": [
            "Implement a strongly-typed EventEmitter class in TypeScript.",
            "Explain conditional types and how you would use `infer` in a complex mapped type.",
        ],
    },
    "react": {
        "easy": [
            "What is JSX and how is it different from HTML?",
            "What are hooks? Name three commonly used hooks.",
        ],
        "medium": [
            "Explain React's reconciliation algorithm.",
            "When would you use `useMemo` and `useCallback`?",
        ],
        "hard": [
            "How would you architect a large React app for scalability and code splitting?",
            "Explain React Fiber and how it improves rendering.",
        ],
    },
    "sql": {
        "easy": [
            "What is the difference between INNER JOIN and LEFT JOIN?",
            "What is an index and why is it important?",
        ],
        "medium": [
            "Explain ACID properties in database transactions.",
            "What is a window function? Give an example using ROW_NUMBER().",
        ],
        "hard": [
            "How would you optimise a slow query with millions of rows?",
            "Explain query execution plans and how to read EXPLAIN output.",
        ],
    },
    "machine learning": {
        "easy": [
            "What is the difference between supervised and unsupervised learning?",
            "What is overfitting and how do you prevent it?",
        ],
        "medium": [
            "Explain bias-variance trade-off.",
            "What is cross-validation and why is it used?",
        ],
        "hard": [
            "How would you handle class imbalance in a classification problem?",
            "Explain gradient boosting and compare it to random forests.",
        ],
    },
    "docker": {
        "easy": [
            "What is the difference between a Docker image and a Docker container?",
            "What is a Dockerfile?",
        ],
        "medium": [
            "Explain Docker networking modes.",
            "What is Docker Compose and when would you use it over Kubernetes?",
        ],
        "hard": [
            "How would you optimise a Docker image to minimise its size?",
            "Explain multi-stage builds and their benefits.",
        ],
    },
    "git": {
        "easy": [
            "What is the difference between `git merge` and `git rebase`?",
            "What does `git stash` do?",
        ],
        "medium": [
            "Explain the git branching strategy used in GitFlow.",
            "What is a pull request and what should a good PR description include?",
        ],
        "hard": [
            "How would you revert a pushed merge commit without losing history?",
            "Explain how `git bisect` works and when you would use it.",
        ],
    },
}

# Generic behavioral questions always included
_BEHAVIORAL = [
    "Tell me about a challenging project you worked on and how you overcame obstacles.",
    "Describe a time you disagreed with a team decision — what did you do?",
    "How do you prioritise tasks when working on multiple projects simultaneously?",
    "Give an example of a time you improved a process or system.",
    "Describe a situation where you had to learn something new very quickly.",
]

# Generic role-based questions
_ROLE_QUESTIONS: Dict[str, List[str]] = {
    "software engineer": [
        "How do you approach code reviews?",
        "Describe your approach to writing unit tests.",
        "How do you ensure your code is maintainable?",
    ],
    "data scientist": [
        "Walk me through your typical data exploration process.",
        "How do you communicate complex findings to non-technical stakeholders?",
        "Describe your experience with feature engineering.",
    ],
    "devops engineer": [
        "How do you approach setting up a CI/CD pipeline?",
        "Describe your experience with infrastructure as code.",
        "How do you monitor production systems and respond to incidents?",
    ],
    "frontend developer": [
        "How do you ensure cross-browser compatibility?",
        "Describe your approach to responsive design.",
        "How do you optimise web performance?",
    ],
    "backend developer": [
        "How do you design RESTful APIs?",
        "Describe your experience with database schema design.",
        "How do you handle authentication and authorisation in your applications?",
    ],
}


def generate_interview_questions(
    skills: List[str],
    role: str = "",
) -> Dict[str, Any]:
    """
    Generate categorised interview questions based on the candidate's skills and predicted role.

    Returns:
        {
          "behavioral": [...],
          "technical": {"easy": [...], "medium": [...], "hard": [...] },
          "role_specific": [...],
          "total": int,
        }
    """
    technical: Dict[str, List[str]] = {"easy": [], "medium": [], "hard": []}

    for skill in skills:
        skill_lower = skill.lower()
        # Fuzzy match against known skill keys
        for key, bank in _SKILL_QUESTIONS.items():
            if key in skill_lower or skill_lower in key:
                for difficulty in ("easy", "medium", "hard"):
                    qs = bank.get(difficulty, [])
                    # Add up to 1 per difficulty per matched skill to avoid bloat
                    for q in qs[:1]:
                        if q not in technical[difficulty]:
                            technical[difficulty].append(q)
                break

    # If we matched very few skills, pad with generic engineering questions
    if sum(len(v) for v in technical.values()) < 3:
        technical["easy"].append("Describe your software development workflow.")
        technical["medium"].append("How do you approach debugging a production issue?")
        technical["hard"].append("Describe the most complex system you have designed or contributed to.")

    # Role-specific questions
    role_lower = role.lower()
    role_specific: List[str] = []
    for rkey, rqs in _ROLE_QUESTIONS.items():
        if rkey in role_lower or role_lower in rkey:
            role_specific = rqs
            break
    if not role_specific:
        role_specific = _ROLE_QUESTIONS.get("software engineer", [])

    total = (
        len(_BEHAVIORAL)
        + sum(len(v) for v in technical.values())
        + len(role_specific)
    )

    return {
        "behavioral": _BEHAVIORAL,
        "technical": technical,
        "role_specific": role_specific,
        "total": total,
    }
