from pathlib import Path
from ursus.linters import LineLinter, LineLinterResult
from ursus.linters.markdown import MarkdownExternalLinksLinter
import logging
import requests


class RedirectsLinter(LineLinter):
    file_suffixes = (".map",)

    def lint_line(self, file_path: Path, line: str) -> LineLinterResult:
        if line.startswith("#") or not line.strip():
            return

        line = line.strip().rstrip(";")

        if '"' in line:
            src, dest = [
                url.strip('"') for part in line.split('"') if (url := part.strip())
            ]
        else:
            src, dest = [part for part in line.split()]

        position = line.index(dest), len(dest)
        if dest.startswith(("http://", "https://")):
            try:
                response = requests.get(
                    dest,
                    timeout=5,
                    headers={"User-Agent": MarkdownExternalLinksLinter.user_agent},
                )
                status_code = response.status_code
            except ConnectionError:
                yield position, f"Connection error: {dest}", logging.ERROR
            except requests.exceptions.RequestException as exc:
                yield position, f"URL {type(exc).__name__}: {dest}", logging.ERROR
            else:
                if status_code in (404, 410):
                    yield (
                        position,
                        f"URL returns HTTP {status_code}: {dest}",
                        logging.ERROR,
                    )
                elif status_code >= 400:
                    level = (
                        logging.WARNING if status_code in (403, 503) else logging.ERROR
                    )
                    yield position, f"URL returns HTTP {status_code}: {dest}", level
                elif response.history and response.history[-1].status_code == 301:
                    yield (
                        position,
                        f"URL redirects to {response.url}: {dest}",
                        logging.INFO,
                    )
