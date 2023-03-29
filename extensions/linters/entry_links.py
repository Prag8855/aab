from pathlib import Path
from urllib.parse import urldefrag, unquote
from ursus.config import config
from ursus.linters.markdown import MarkdownLinksLinter
import logging
import re


class EntryLinksLinter(MarkdownLinksLinter):
    """
    Verifies that Wikilinks point to existing glossary entries
    """
    def handle_match(self, file: int, line: int, fix_errors: bool, match: re.Match):
        original_text = match.group(0)
        is_image = match['first_half'].startswith('!')

        if match['url_group']:
            parts = match['url_group'].split(" ", maxsplit=1)
            url = parts[0]

        url_path = Path(config.content_path / unquote(urldefrag(url.lstrip('/'))[0]))

        if (
            not is_image
            and url.startswith('/')
            and not url.startswith((
                '/out',
                '/suggest-business',
                '/donate',
                '/suggest-therapist',
            ))
        ):
            if url_path.suffix == config.html_url_extension:
                if not url_path.with_suffix('.md').exists():
                    self.log_error(file, line, f"Entry not found: {url}", logging.ERROR)
            else:
                if not url_path.exists():
                    self.log_error(file, line, f"Entry not found: {url}", logging.ERROR)
        return original_text
