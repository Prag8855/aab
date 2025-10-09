from pathlib import Path
from ursus.config import config
from ursus.renderers.static import StaticFileRenderer
from ursus.utils import get_files_in_path


class NginxMapRenderer(StaticFileRenderer):
    """
    Copies nginx maps (for site redirects) to `output_path`.
    """

    def get_files_to_copy(self, changed_files: set[Path] | None = None) -> list[tuple[Path, Path]]:
        return [
            ((config.content_path / f), f)
            for f in get_files_in_path(config.content_path, suffix='.map')
        ]
