#!/usr/bin/env python3
from markdown.extensions.toc import slugify
from pathlib import Path
import googlemaps
import os
import re

place_template = """---
Name: {name}
Description:
Website: {website}
Email:
Address: {address}
Latitude: {latitude}
Longitude: {longitude}
Google_Place_ID: {place_id}
---
"""

red = "\033[91m"
yellow = "\033[93m"
reset = "\033[0m"

gmaps = googlemaps.Client(key=os.environ['GOOGLEMAPS_API_KEY'])

while True:
    print("Place name or address:")
    query = input(">")

    print("Results:")

    search_results = gmaps.find_place(
        input=query,
        input_type="textquery",
        location_bias=f"circle:2000@{52.5200, 13.4050}",
        language="en",
    )['candidates'][:10]

    places = [
        gmaps.place(result['place_id'], language="en")['result']
        for result in search_results
    ]

    for index, place in enumerate(places):
        print(f"{yellow}[{index + 1}]{reset} {place['name']}")
        print(f"\t{place['formatted_address']}")

    print("Choose a result (default is 1, 0 to cancel):")
    selected_index = input(">") or '1'
    try:
        google_place = places[int(selected_index) - 1]
    except IndexError:
        continue

    file_content = place_template.format(
        name=google_place['name'],
        latitude=round(google_place['geometry']['location']['lat'], 6),
        longitude=round(google_place['geometry']['location']['lng'], 6),
        address=re.sub(r",? \d{5} Berlin, Germany$", "", google_place['formatted_address']).strip(),
        place_id=google_place['place_id'],
        website=google_place.get('website', ''),
    )

    file_slug = slugify(google_place['name'], '-')
    print(f'Choose a slug for the file name (default is "{file_slug}"):')
    file_slug = input('>') or file_slug

    place_path = Path(f'content/places/{file_slug}.md')
    print(f"Saving to {str(place_path)}")
    with place_path.open('w') as place_file:
        place_file.writelines(file_content)
    print("---")
