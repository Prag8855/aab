from pathlib import Path
from typing import Match
from ursus.linters import MatchResult, RegexLinter
import logging
import re


class DateUpdatedLinter(RegexLinter):
    file_suffixes = ('.md', )
    regex = re.compile(r'^date_updated:', flags=re.IGNORECASE)

    def handle_match(self, file_path: Path, match: Match[str]) -> MatchResult:
        yield "Date_updated attribute is deprecated", logging.WARNING


class ShortTitleLinter(RegexLinter):
    file_suffixes = ('.md', )
    regex = re.compile(r'^short_title: (.*)', flags=re.IGNORECASE)

    def handle_match(self, file_path: Path, match: Match[str]) -> MatchResult:
        if len(match.group(1)) > 43:
            yield f"Short title is too long: {match.group(1)}", logging.WARNING
