#!/usr/bin/env python3
from math import sin, cos, acos
from pathlib import Path
import argparse
import googlemaps
import os
import re


parser = argparse.ArgumentParser(description='Update places')
parser.add_argument('path', type=str, help='Path to the place files')
parser.add_argument('-s', '--start-at', type=str, help='Start at this file')
args = parser.parse_args()


def parse_place(place_path):
    place = {}
    with place_path.open() as place_file:
        for line in place_file.readlines():
            if line.strip() and line.strip() != '---':
                field, value = line.split(':', 1)
                place[field.strip()] = value.strip()
    return place


def save_place(place_path, place):
    with place_path.open('w') as place_file:
        place_file.write('---\n')
        for field, value in place.items():
            place_file.write(f"{field}: {value.strip()}\n")
        place_file.write('---\n')


def geo_distance(slat, slon, elat, elon):
    return round(6371.01 * acos(sin(slat)*sin(elat) + cos(slat)*cos(elat)*cos(slon - elon)))


fields_to_verify = (
    ('name', 'name'),
    ('address', 'formatted_address'),
    ('website', 'website'),
)

red = "\033[91m"
yellow = "\033[93m"
reset = "\033[0m"

gmaps = googlemaps.Client(key=os.environ['GOOGLEMAPS_API_KEY'])

started = False
for place_path in list(Path(args.path).rglob('*.md')):
    started = started or (not args.start_at) or (args.start_at == place_path.name)
    if not started and args.start_at != place_path.name:
        print(f"Skipping {place_path.name}")
        continue

    place = parse_place(place_path)
    print(f"\n\033[1m{place['Name']}{reset} ({place_path})")
    print(place_path.name)

    google_place_results = gmaps.find_place(
        input=place['Name'],
        input_type="textquery",
        location_bias=f"circle:200@{place['Latitude']},{place['Longitude']}",
        language="en",
    )

    if len(google_place_results['candidates']):
        google_place = gmaps.place(
            google_place_results['candidates'][0]['place_id'],
            language="en"
        )['result']
    else:
        print(f"{red}No place found{reset}")
        continue

    lat = float(place['Latitude'])
    lng = float(place['Longitude'])
    g_lat = round(google_place['geometry']['location']['lat'], 6)
    g_lng = round(google_place['geometry']['location']['lng'], 6)
    try:
        distance = geo_distance(lat, lng, g_lat, g_lng)
    except:
        distance = None

    has_changes = False

    # Closed place
    if google_place.get('business_status') != 'OPERATIONAL':
        print(f"\tStatus: {red}{google_place.get('business_status')}{reset}")
        has_changes = True

    # Coordinates
    if lat != g_lat or lng != g_lng:
        color = red if distance > 50 else yellow
        print(f"\t{color}[c]oordinates: {distance} m{reset} difference")
        print(f"\t\t- {lat}, {lng}")
        print(f"\t\t+ {g_lat}, {g_lng}")
        has_changes = True

    # Name
    if place['Name'] != google_place['name']:
        print("\t[n]ame:")
        print(f"\t\t- {place['Name']}")
        print(f"\t\t+ {google_place['name']}")
        has_changes = True

    # Street address
    google_address = re.sub(r",? \d{5} Berlin, Germany$", "", google_place['formatted_address']).strip()
    if place.get('Address') != google_address:
        print(f"\t{yellow}[a]ddress:{reset}")
        print(f"\t\t- {place.get('Address')}")
        print(f"\t\t+ {google_address}")
        has_changes = True

    # Place ID
    if place.get('Google_Place_ID') != google_place['place_id']:
        color = red if place.get('Google_Place_ID') else yellow
        print(f"\t{yellow}Google [p]lace ID:{reset}")
        print(f"\t\t- {place.get('Google_Place_ID')}")
        print(f"\t\t+ {google_place['place_id']}")
        has_changes = True

    # Website
    website = google_place.get('Website') or google_place.get('url', '')
    if place.get('Website') != website:
        print("\t[w]ebsite:")
        print(f"\t\t- {place.get('Website')}")
        print(f"\t\t+ {website}")
        has_changes = True

    if has_changes:
        if place.get('Google_Place_ID') == google_place['place_id']:
            if not place.get('Website') and website:
                print("\tUpdated website.")
                place['Website'] = website

            if not place['Address'] != google_address:
                print("\tUpdated address and coordinates.")
                place['Address'] = google_address
                place['Latitude'] = str(g_lat)
                place['Longitude'] = str(g_lng)
        elif not place.get('Google_Place_ID') and place['Name'] == google_place['name']:
            print("\tUpdated place ID.")
            place['Google_Place_ID'] = google_place['place_id']

            if not place['Address'] != google_address:
                print("\tUpdated address and coordinates.")
                place['Address'] = google_address
                place['Latitude'] = str(g_lat)
                place['Longitude'] = str(g_lng)

        print("Select changes to apply. [y] to apply all, [Enter] to skip.")
        actions = input(">")
        if 'y' in actions or 'a' in actions:
            place['Address'] = google_address

        if 'y' in actions or 'c' in actions:
            place['Latitude'] = str(g_lat)
            place['Longitude'] = str(g_lng)

        if 'y' in actions or 'n' in actions:
            place['Name'] = google_place['name']

        if 'y' in actions or 'p' in actions:
            place['Google_Place_ID'] = google_place['place_id']

        if 'y' in actions or 'w' in actions:
            place['Website'] = website

        if 'd' in actions:
            place_path.unlink()
        else:
            save_place(place_path, place)
