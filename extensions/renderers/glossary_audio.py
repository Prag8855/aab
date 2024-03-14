from ursus.config import config
from ursus.renderers import Renderer
import logging
import requests
import base64


logger = logging.getLogger(__name__)


class GlossaryAudioRenderer(Renderer):
    """
    Creates TTS files for glossary entries
    """
    def render(self, context: dict, changed_files: set = None) -> set:
        files_to_keep = set()

        german_terms_to_render = [
            entry['german_term'] for (entry_uri, entry) in context['entries'].items()
            if entry_uri.startswith('glossary/')
            and entry.get('german_term')
        ]

        for german_term in german_terms_to_render:
            audio_path = config.output_path / 'glossary' / 'audio' / (german_term + '.wav')
            files_to_keep.add(audio_path.relative_to(config.output_path))

            if audio_path.exists():
                continue

            logger.info(f"Rendering audio for {german_term}")
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0',
                'Accept': '*/*',
                'Accept-Language': 'en-GB,de-DE;q=0.7,fr-CA;q=0.3',
                'Accept-Encoding': 'gzip, deflate',
                'Referer': 'http://narvi.sysint.iisys.de/projects/tts/',
                'X-Requested-With': 'XMLHttpRequest',
                'Origin': 'http://narvi.sysint.iisys.de',
                'DNT': '1',
                'Connection': 'keep-alive',
            }

            files = {
                'model': (None, 'thorsten_mueller_tacotron2'),
                'text_input': (None, german_term),
            }

            try:
                response = requests.post(
                    'http://narvi.sysint.iisys.de/projects/tts/inferencetts',
                    headers=headers,
                    files=files
                )
                audio_path.parent.mkdir(parents=True, exist_ok=True)
                with audio_path.open('wb') as wav_file:
                    wav_file.write(response.content)
            except:
                raise

        return files_to_keep
