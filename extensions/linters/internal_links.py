from ursus.linters.markdown import MarkdownInternalLinksLinter as OriginalInternalLinksLinter
import re


class MarkdownInternalLinksLinter(OriginalInternalLinksLinter):
    ignored_urls = (
        re.compile("^/donate$"),
        re.compile("^/out"),
        re.compile("^/suggest-[a-z]+$"),
    )
