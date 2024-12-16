from markdown.blockprocessors import HashHeaderProcessor
from pathlib import Path
from typing import Match
from ursus.config import config
from ursus.linters import LinterResult, MatchResult, RegexLinter
import logging


class DuplicateTitlesLinter(RegexLinter):
    file_suffixes = ('.md', )
    regex = HashHeaderProcessor.RE

    def lint(self, file_path: Path) -> LinterResult:
        self.title_slugs: set[str] = set()
        return super().lint(file_path)

    def handle_match(self, file_path: Path, match: Match[str]) -> MatchResult:
        slug = config.markdown_extensions['toc']['slugify'](match.group(0).lstrip('#').strip(), '-')
        if slug in self.title_slugs:
            yield f"Duplicate title: {match.group(0)}", logging.ERROR
        self.title_slugs.add(slug)
