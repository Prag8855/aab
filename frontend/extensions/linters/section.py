from pathlib import Path
from typing import Match
from ursus.linters import MatchResult, RegexLinter
import logging
import re


class SectionSignLinter(RegexLinter):
    """
    Verifies that there is a space after § symbols
    """
    file_suffixes = ('.md', )
    regex = re.compile(r'§[^ ]+')

    def handle_match(self, file_path: Path, match: Match[str]) -> MatchResult:
        yield f"Missing space after section symbol: {match.group(0)}", logging.ERROR
