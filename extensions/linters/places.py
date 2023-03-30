#!/usr/bin/env python3
from pathlib import Path
from ursus.config import config
from ursus.linters import Linter
import googlemaps
import logging
import re


class PlacesLinter(Linter):
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

    def lint(self, file_path: Path):
        if file_path.is_relative_to(Path('places')):
            place = self.parse_place(file_path)

            if not place.get('Google_Place_ID'):
                return None, "Place has no place ID", logging.WARNING

            google_place = self.google_maps.place(place['Google_Place_ID'], language="en")['result']

            if google_place.get('website') and place.get('Website') != google_place.get('website'):
                yield (
                    None,
                    f"Website does not match with Google: {place.get('Website')} -> {google_place.get('website')}",
                    logging.WARNING
                )

            google_address = re.sub(r"(, (\d{5} )?Berlin)?, Germany$", "", google_place['formatted_address']).strip()
            if place.get('Address') != google_address:
                yield (
                    None,
                    "Address does not match with Google: {place.get('Address')} -> {google_address}",
                    logging.ERROR
                )

            business_status = google_place.get('business_status')
            if business_status and business_status != 'OPERATIONAL':
                yield None, f"Business is {google_place.get('business_status')}", logging.ERROR

            lat = float(place['Latitude'])
            lng = float(place['Longitude'])
            g_lat = round(google_place['geometry']['location']['lat'], 6)
            g_lng = round(google_place['geometry']['location']['lng'], 6)
            if lat != g_lat or lng != g_lng:
                yield None, "Coordinates do not match with Google: {lat}, {lng} -> {g_lat}, {g_lng}", logging.ERROR
