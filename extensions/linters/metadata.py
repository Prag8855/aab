from pathlib import Path
from ursus.linters import RegexLinter
import logging
import re


class DateUpdatedLinter(RegexLinter):
    file_suffixes = '.md'
    regex = re.compile(r'^date_updated:', flags=re.IGNORECASE)

    def handle_match(self, file_path: Path, match: re.Match):
        yield "Date_updated attribute is deprecated", logging.WARNING


class ShortTitleLinter(RegexLinter):
    file_suffixes = '.md'
    regex = re.compile(r'^short_title: (.*)', flags=re.IGNORECASE)

    def handle_match(self, file_path: Path, match: re.Match):
        if len(match.group(1)) > 43:
            yield f"Short title is too long: {match.group(1)}", logging.WARNING
