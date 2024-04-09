#!/usr/bin/env python3
from pathlib import Path
import argparse
import sys

sys.path.append(str(Path(__file__).parent.parent / 'extensions/renderers'))

from entry_images import make_cover_image


parser = argparse.ArgumentParser()
parser.add_argument(
    'text',
    help='Image text to use',
    type=str
)
parser.add_argument(
    'path',
    help='Path to the output image',
    type=Path
)
args = parser.parse_args()
templates_path = Path(__file__).parent.parent / 'templates'
image = make_cover_image(args.text, templates_path)
image.save(args.path, optimize=True)
