from ursus.config import config
from ursus.context_processors import Context
from ursus.renderers import Renderer
from pathlib import Path
import base64
import logging
import requests


logger = logging.getLogger(__name__)


class GlossaryAudioRenderer(Renderer):
    """
    Creates TTS files for glossary entries
    """

    def render(self, context: Context, changed_files: set[Path] | None = None) -> set[Path]:
        files_to_keep = set()

        german_terms_to_render = [
            (entry.get("ssml", entry["german_term"]), entry_uri)
            for (entry_uri, entry) in context["entries"].items()
            if entry_uri.startswith("glossary/") and entry.get("german_term")
        ]

        for text_to_pronounce, entry_uri in german_terms_to_render:
            file_name = Path(entry_uri).stem
            audio_path = config.output_path / "glossary" / "audio" / f"{file_name}.mp3"
            files_to_keep.add(audio_path.relative_to(config.output_path))

            if audio_path.exists():
                continue

            logger.info(f"Rendering pronounciation for {entry_uri}")
            response = requests.post(
                url="https://texttospeech.googleapis.com/v1beta1/text:synthesize",
                json={
                    "input": {
                        "ssml": "<speak>"
                        f"  <s>{text_to_pronounce}</s>"
                        '   <break time="1s"/><prosody rate="x-slow">'
                        '       <emphasis level="strong">'
                        f"          <s>{text_to_pronounce}</s>"
                        "       </emphasis>"
                        "   </prosody>"
                        "</speak>",
                    },
                    "voice": {"name": "de-DE-Neural2-C", "languageCode": "de-DE"},
                    "audioConfig": {"audioEncoding": "MP3"},
                },
                headers={
                    "content-type": "application/json",
                    "X-Goog-Api-Key": config.google_tts_api_key,
                },
            ).json()

            audio_path.parent.mkdir(parents=True, exist_ok=True)
            with audio_path.open("wb") as audio_file:
                audio_file.write(base64.b64decode(response["audioContent"]))

        return files_to_keep
