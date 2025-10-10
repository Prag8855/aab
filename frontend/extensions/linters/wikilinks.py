from pathlib import Path
from typing import Match
from ursus.config import config
from ursus.linters import MatchResult, RegexLinter
import logging
import re


class WikilinksLinter(RegexLinter):
    """
    Verifies that Wikilinks point to existing glossary entries
    """

    file_suffixes = (".md",)
    regex = re.compile(r"\[\[(?P<label>[^\]]+)\]\]")

    def handle_match(self, file_path: Path, match: Match[str]) -> MatchResult:
        glossary_file = config.content_path / f"glossary/{match['label']}.md"
        if not glossary_file.exists():
            yield f"Glossary entry does not exist: {match['label']}", logging.ERROR
