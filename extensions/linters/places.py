#!/usr/bin/env python3
from pathlib import Path
from ursus.config import config
from ursus.linters import Linter
import googlemaps
import logging
import re


class PlaceLinter(Linter):
    fields_to_verify = (
        ('name', 'name'),
        ('address', 'formatted_address'),
        ('website', 'website'),
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.google_maps = googlemaps.Client(key=config.google_maps_api_key)

    def parse_place(self, place_path: Path):
        place = {}
        with (config.content_path / place_path).open() as place_file:
            for line in place_file.readlines():
                if line.strip() and line.strip() != '---':
                    field, value = line.split(':', 1)
                    place[field.strip()] = value.strip()
        return place

    def save_place(self, place: dict, place_path):
        with (config.content_path / place_path).open('w') as place_file:
            place_file.write('---\n')
            for field, value in place.items():
                place_file.write(f"{field}: {(value or '').strip()}\n")
            place_file.write('---\n')

    def lint(self, file: Path, fix_errors: bool = False):
        if file.is_relative_to(Path('places')):
            place = self.parse_place(file)
            has_changes = False

            if not place.get('Google_Place_ID'):
                self.log_error(file, None, f"Place has no place ID", logging.WARNING)
                return

            google_place = self.google_maps.place(place['Google_Place_ID'], language="en")['result']

            if google_place.get('website') and place.get('Website') != google_place.get('website'):
                self.log_error(file, None, "Website does not match with Google.", logging.WARNING)
                self.log_substitution(file, None, place.get('Website'), google_place.get('website'))
                if not place.get('Website'):
                    place['Website'] = google_place.get('website')
                    has_changes = True

            google_address = re.sub(r"(, (\d{5} )?Berlin)?, Germany$", "", google_place['formatted_address']).strip()
            if place.get('Address') != google_address:
                self.log_error(file, None, "Address does not match with Google.", logging.ERROR)
                self.log_substitution(file, None, place.get('Address'), google_address)
                place['Address'] = google_address
                has_changes = True

            business_status = google_place.get('business_status')
            if business_status and business_status != 'OPERATIONAL':
                self.log_error(file, None, f"Business is {google_place.get('business_status')}", logging.ERROR)

            lat = float(place['Latitude'])
            lng = float(place['Longitude'])
            g_lat = round(google_place['geometry']['location']['lat'], 6)
            g_lng = round(google_place['geometry']['location']['lng'], 6)
            if lat != g_lat or lng != g_lng:
                self.log_error(file, None, "Coordinates do not match with Google.", logging.ERROR)
                self.log_substitution(file, None, f"{lat}, {lng}", f"{g_lat}, {g_lng}")
                place['Latitude'] = str(g_lat)
                place['Longitude'] = str(g_lng)
                has_changes = True

            if has_changes:
                self.save_place(place, file)
