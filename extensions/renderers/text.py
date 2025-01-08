from ursus.config import config
from ursus.renderers.static import StaticFileRenderer
from ursus.utils import get_files_in_path


class TextFileRenderer(StaticFileRenderer):
    """
    Copies text files to `output_path`.
    """
    def get_files_to_copy(self, changed_files: set = None):
        return [
            ((config.content_path / f), f)
            for f in get_files_in_path(config.content_path, suffix='.txt')
        ]
