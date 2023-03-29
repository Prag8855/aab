#!/usr/bin/env python3
from ursus.config import config
from ursus.linters import RegexLinter
import logging
import re


class WikilinksLinter(RegexLinter):
    """
    Verifies that Wikilinks point to existing glossary entries
    """
    file_suffixes = '.md'
    regex = re.compile(r'\[\[(?P<label>[^\]]+)\]\]')

    def handle_match(self, file_path: int, line_no: int, fix_errors: bool, match: re.Match):
        glossary_file = config.content_path / f"glossary/{match['label']}.md"
        if not glossary_file.exists():
            self.log_error(file_path, line_no, f"Glossary entry does not exist: {match['label']}", logging.ERROR)
        return match.group(0)
