#!/usr/bin/env python3

# Ü can be represented in two ways: Ü, or U + umlaut character. This website
# uses the first representation. # File operations (such as rsync) might convert
# file names to the second representation. This script reverts file names to the
# first representation.

from unicodedata import normalize
from ursus.config import config
from ursus.utils import get_files_in_path

files = get_files_in_path(config.content_path)
for file in files:
    current_form = str(file)
    normalized_form = normalize('NFC', str(file))
    if current_form != normalized_form:
        (config.content_path / file).rename(config.content_path / normalized_form)
