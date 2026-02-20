"""
Grammar and language quality checker using language-tool-python.
Caches the LanguageTool instance (slow to initialise).
"""

import functools
from typing import List, Dict, Any

try:
    import language_tool_python  # type: ignore

    @functools.lru_cache(maxsize=1)
    def _get_tool() -> language_tool_python.LanguageTool:
        return language_tool_python.LanguageTool("en-US")

    _LT_AVAILABLE = True
except Exception:
    _LT_AVAILABLE = False


# Rules to suppress (style suggestions that aren't real errors)
_IGNORED_RULES = {
    "WHITESPACE_RULE",
    "EN_QUOTES",
    "SENTENCE_WHITESPACE",
    "UPPERCASE_SENTENCE_START",
    "MORFOLOGIK_RULE_EN_US",
}


def check_grammar(text: str) -> List[Dict[str, Any]]:
    """
    Run grammar/style checks on the given text.
    Returns a list of issues: {message, context, offset, length, suggestions}.
    """
    if not _LT_AVAILABLE or not text.strip():
        return []

    try:
        tool = _get_tool()
        matches = tool.check(text)
        issues = []
        for m in matches:
            if m.ruleId in _IGNORED_RULES:
                continue
            issues.append(
                {
                    "rule_id": m.ruleId,
                    "message": m.message,
                    "context": m.context,
                    "offset": m.offset,
                    "length": m.errorLength,
                    "suggestions": list(m.replacements[:3]),  # top 3
                    "severity": _classify_severity(m.ruleId),
                }
            )
        return issues[:50]  # cap at 50 issues for response size
    except Exception as e:
        print(f"[grammar] check failed: {e}")
        return []


def _classify_severity(rule_id: str) -> str:
    """Map known rule categories to a severity level."""
    if any(k in rule_id for k in ("SPELL", "TYPO")):
        return "error"
    if any(k in rule_id for k in ("GRAMMAR", "AGREEMENT", "TENSE")):
        return "warning"
    return "suggestion"
