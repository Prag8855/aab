from ursus.config import config
from ursus.renderers import Renderer
import base64
import logging
import requests


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
            audio_path = config.output_path / 'glossary' / 'audio' / f'{german_term}.mp3'
            files_to_keep.add(audio_path.relative_to(config.output_path))

            if audio_path.exists():
                continue

            logger.info(f"Rendering audio for {german_term}")
            response = requests.post(
                url="https://texttospeech.googleapis.com/v1beta1/text:synthesize",
                json={
                    "input": {
                        "text": german_term
                    },
                    "voice": {
                        "name": "de-DE-Neural2-B",
                        "languageCode": "de-DE"
                    },
                    "audioConfig": {
                        "audioEncoding": "MP3"
                    },
                },
                headers={
                    "content-type": "application/json",
                    "X-Goog-Api-Key": config.google_tts_api_key,
                },
            ).json()

            with audio_path.open('wb') as audio_file:
                audio_file.write(base64.b64decode(response['audioContent']))

        return files_to_keep
