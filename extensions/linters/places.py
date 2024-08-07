#!/usr/bin/env python3
from markdown.extensions.meta import BEGIN_RE, META_RE, META_MORE_RE, END_RE
from pathlib import Path
from ursus.config import config
from ursus.linters import Linter
from ursus.utils import get_files_in_path
import googlemaps
import logging
import re


class PlacesLinter(Linter):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.google_maps = googlemaps.Client(key=config.google_maps_api_key)

    def parse_place(self, place_path: Path):
        place = {}
        field_positions = {}
        with (config.content_path / place_path).open() as place_file:
            for line_no, line in enumerate(place_file.readlines()):
                if line.strip() and line.strip() != '---':
                    field, value = line.split(':', 1)
                    place[field.strip()] = value.strip()
                    field_positions[field] = (line_no, 0, len(line) - 1)
        return place, field_positions

    def lint(self, file_path: Path):
        if file_path.is_relative_to(Path('places')):
            place, field_positions = self.parse_place(file_path)

            if 'Google_Place_ID' not in place:
                yield (0, 0, 3), "Place has no place ID", logging.ERROR
                return

            try:
                google_place = self.google_maps.place(place['Google_Place_ID'], language="en")['result']
            except googlemaps.exceptions.ApiError:
                yield (0, 0, 3), "Place error", logging.ERROR
                return

            if google_place.get('website') and place.get('Website') != google_place.get('website'):
                yield (
                    field_positions.get('Website'),
                    f"Website does not match with Google: {place.get('Website')} -> {google_place.get('website')}",
                    logging.WARNING
                )

            google_address = re.sub(r"(, (\d{5} )?Berlin)?, Germany$", "", google_place['formatted_address']).strip()
            if place.get('Address') != google_address:
                yield (
                    field_positions.get('Address'),
                    f"Address does not match with Google: {place.get('Address')} -> {google_address}",
                    logging.ERROR
                )

            business_status = google_place.get('business_status')
            if business_status and business_status != 'OPERATIONAL':
                yield None, f"Business is {google_place.get('business_status')}", logging.ERROR

            lat = float(place['Latitude'])
            lng = float(place['Longitude'])
            g_lat = round(google_place['geometry']['location']['lat'], 6)
            g_lng = round(google_place['geometry']['location']['lng'], 6)
            if str(lat) != str(g_lat):
                yield field_positions.get('Latitude'), f"Latitude does not match with Google: {lat} -> {g_lat}", logging.ERROR
            if str(lng) != str(g_lng):
                yield field_positions.get('Longitude'), f"Longitude does not match with Google: {lng} -> {g_lng}", logging.ERROR


class UnusedPlacesLinter(Linter):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.mentioned_places = set()
        for place_path in get_files_in_path(config.content_path, None, '.md'):
            with (config.content_path / place_path).open() as place_file:
                metadata = self.parse_metadata(place_file.readlines())
                related_places = [
                    value
                    for key, values in metadata.items()
                    for value in values
                    if key.startswith('related_')
                    and value.startswith('places/')
                ]
                self.mentioned_places.update(related_places)

    def parse_metadata(self, lines):
        meta = {}
        key = None
        if lines and BEGIN_RE.match(lines[0]):
            lines.pop(0)
        while lines:
            line = lines.pop(0)
            m1 = META_RE.match(line)
            if line.strip() == '' or END_RE.match(line):
                break  # blank line or end of YAML header - done
            if m1:
                key = m1.group('key').lower().strip()
                value = m1.group('value').strip()
                try:
                    meta[key].append(value)
                except KeyError:
                    meta[key] = [value]
            else:
                m2 = META_MORE_RE.match(line)
                if m2 and key:
                    # Add another line to existing key
                    meta[key].append(m2.group('value').strip())
                else:
                    lines.insert(0, line)
                    break  # no meta data - done
        return meta

    def lint(self, file_path: Path):
        if file_path.is_relative_to(Path('places')) and str(file_path) not in self.mentioned_places:
            yield None, "Place is not used anywhere", logging.ERROR
