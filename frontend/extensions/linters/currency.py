from pathlib import Path
from typing import Match
from ursus.linters import MatchResult, RegexLinter
import logging
import re


class CurrencyLinter(RegexLinter):
    """
    Raises error when the euro sign appears after a euro amount. For example: "23,000€"
    """

    file_suffixes = (".md",)
    regex = re.compile(r"((\d+(,\d{3})*(\.\d{2})?))[$€]")

    def handle_match(self, file_path: Path, match: Match[str]) -> MatchResult:
        yield f"Currency symbol after amount: {match.group(0)}", logging.ERROR


class JinjaCurrencyLinter(RegexLinter):
    """
    Raises error when the euro sign appears after a euro amount. For example: "{{ BVG_FEE|cur }}€"
    """

    file_suffixes = (".md",)
    regex = re.compile(r"({{([^}]+)}})[$€]")

    def handle_match(self, file_path: Path, match: Match[str]) -> MatchResult:
        yield f"Currency symbol after amount: {match.group(0)}", logging.ERROR
