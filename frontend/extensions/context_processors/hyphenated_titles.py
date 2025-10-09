from extensions.functions import hyphenate, soft_hyphen
from pathlib import Path
from ursus.config import config
from ursus.context_processors import Context, EntryContextProcessor, Entry, EntryURI


class HyphenatedTitleProcessor(EntryContextProcessor):
    hyphenated_attributes = ('title', 'short_title', 'german_term')

    def process_entry(self, context: Context, entry_uri: EntryURI, changed_files: set[Path] | None = None) -> None:
        if entry_uri.lower().endswith('.md') and (changed_files is None or (config.content_path / entry_uri) in changed_files):
            entry: Entry = context['entries'][entry_uri]
            for attr in self.hyphenated_attributes:
                if attr in entry and soft_hyphen not in entry[attr]:
                    entry[attr] = hyphenate(entry[attr], 'de_DE', soft_hyphen)
