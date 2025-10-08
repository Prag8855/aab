from markdown.blockprocessors import HashHeaderProcessor
from pathlib import Path
from typing import Match
from ursus.config import config
from ursus.linters import LinterResult, MatchResult, RegexLinter
import logging


class DuplicateTitlesLinter(RegexLinter):
    file_suffixes = (".md",)
    regex = HashHeaderProcessor.RE

    def lint(self, file_path: Path) -> LinterResult:
        self.title_slugs: set[str] = set()
        return super().lint(file_path)

    def handle_match(self, file_path: Path, match: Match[str]) -> MatchResult:
        slug = config.markdown_extensions["toc"]["slugify"](
            match.group(0).lstrip("#").strip(), "-"
        )
        if slug in self.title_slugs:
            yield f"Duplicate title: {match.group(0)}", logging.ERROR
        self.title_slugs.add(slug)


class SequentialTitlesLinter(RegexLinter):
    file_suffixes = (".md",)
    regex = HashHeaderProcessor.RE

    def lint(self, file_path: Path) -> LinterResult:
        self.last_title: str | None = None
        return super().lint(file_path)

    def get_number(self, title: str) -> int | None:
        try:
            return int(title.strip().split(".")[0])
        except ValueError:
            return None

    def handle_match(self, file_path: Path, match: Match[str]) -> MatchResult:
        title = match.group(0).lstrip("#").strip()
        if self.last_title:
            if (
                (prev := self.get_number(self.last_title))
                and (curr := self.get_number(title))
                and curr != prev + 1
            ):
                yield f"Invalid title sequence: {match.group(0)}", logging.ERROR
        self.last_title = title


class TitleCountLinter(RegexLinter):
    file_suffixes = (".md",)
    regex = HashHeaderProcessor.RE

    def lint(self, file_path: Path) -> LinterResult:
        self.title_count = 0
        return super().lint(file_path)

    def handle_match(self, file_path: Path, match: Match[str]) -> MatchResult:
        if match.group("level") == "##":
            self.title_count += 1
            # Roughly how many fit on a 1280x768 screen, including "Related guides" and donation prompt
            if self.title_count > 12:
                yield f"Too many level 2 titles: {match.group(0)}", logging.ERROR
