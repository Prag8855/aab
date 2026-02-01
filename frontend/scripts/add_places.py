#!/usr/bin/env python3
from markdown.extensions.toc import slugify
from pathlib import Path
from ursus.config import config
from ursus.utils import import_module_or_path
import googlemaps
import re

place_template = """---
Name: {name}
Description: {description}
Website: {website}
Email: {email}
Address: {address}
Latitude: {latitude}
Longitude: {longitude}
Google_Place_ID: {place_id}
---
"""

red = "\033[91m"
yellow = "\033[93m"
reset = "\033[0m"


def query_places(gmaps, query: str):
    search_results = gmaps.find_place(
        input=query,
        input_type="textquery",
        location_bias=f"circle:2000@{52.5200, 13.4050}",
        language="en",
    )["candidates"][:10]
    return [gmaps.place(result["place_id"], language="en")["result"] for result in search_results]


def print_places(places: list):
    for index, place in enumerate(places):
        print(f"{yellow}[{index + 1}]{reset} {place['name']}")
        print(f"\t{place['formatted_address']}")


def get_user_input(title: str):
    print(f"\033[1m{title}:\033[0m")
    return input("> \033[0m")


def add_place():
    gmaps = googlemaps.Client(key=config.google_maps_places_api_key)

    name_query = get_user_input("Place name")

    print("\033[1mResults:\033[0m")
    places = query_places(gmaps, name_query)
    print_places(places)

    choice_or_address = get_user_input("Choose a result, or type an address manually")
    try:
        google_place = places[int(choice_or_address) - 1]
    except (IndexError, ValueError):
        print("\033[1mResults:\033[0m")
        places = query_places(gmaps, choice_or_address)
        print_places(places)

        selected_index = int(get_user_input("Choose an address"))
        google_place = places[selected_index - 1]
        google_place["name"] = name_query

    file_content = place_template.format(
        name=google_place["name"],
        latitude=round(google_place["geometry"]["location"]["lat"], 6),
        longitude=round(google_place["geometry"]["location"]["lng"], 6),
        address=re.sub(r"(, (\d{5} )?Berlin)?, Germany$", "", google_place["formatted_address"]).strip(),
        place_id=google_place["place_id"],
        website=google_place.get("website") or get_user_input("Website"),
        email=get_user_input("Contact email"),
        description=get_user_input("Description"),
    )

    file_slug = slugify(google_place["name"], "-")
    print(f'Choose a slug for the file name (default is "{file_slug}"):')
    file_slug = input(">") or file_slug

    place_path = config.content_path / f"places/{file_slug}.md"
    print(f"Saving to {str(place_path)}")
    with place_path.open("w") as place_file:
        place_file.writelines(file_content)
    print("\n---\n")


if __name__ == "__main__":
    import_module_or_path(Path(__file__).parent.parent / "ursus_config.py")

    while True:
        add_place()
