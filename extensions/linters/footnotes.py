from pathlib import Path
from ursus.linters import RegexLinter
import logging
import re


class FootnoteLocationLinter(RegexLinter):
    """
    Verifies that footnotes appear after punctuation, not before.
    """
    file_suffixes = '.md'
    regex = re.compile(r'(?<!^)\[\^\d+\][\.,;:].{0,15}')

    def handle_match(self, file_path: Path, match: re.Match):
        yield f"Footnote before punctuation: {match.group(0)}", logging.ERROR
