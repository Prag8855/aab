#!/usr/bin/env python3
from pathlib import Path


weird_chars = (
    ('\uFEFF', ''),
    ('\u200B', ''),
)

for char, replacement in weird_chars:
    paths_with_bom = list(Path('.').rglob(f'*{char}*'))
    for old_path in paths_with_bom:
        new_path = Path(str(old_path).replace(char, replacement))
        print(f"Fixing {repr(str(old_path))}\n\t -> {repr(str(new_path))}")
        old_path.rename(new_path)
