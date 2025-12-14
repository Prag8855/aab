#!/usr/bin/env python

from shapely import set_precision, centroid
from shapely.geometry import shape, mapping
from statistics import median
import csv
import json
import logging
import urllib.request


def to_float(value: str) -> float | None:
    return float(value.replace(",", "")) if value else None


def get_plz_shapes():
    # Get the shape of each PLZ as a dict of PLZ: geometry
    with urllib.request.urlopen("https://tsb-opendata.s3.eu-central-1.amazonaws.com/plz/plz.geojson") as response:
        geojson = json.load(response)
    return {f["properties"]["plz"]: set_precision(shape(f["geometry"]), 1e-4) for f in geojson["features"]}


def parse_homeboy_data(path):
    median_rent_by_plz = {}

    with open(path, newline="", encoding="iso-8859-1") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            # Skip completely empty rows
            if not any(row.values()):
                continue

            try:
                plz = int(row.get("Zip"))  # type: ignore
            except ValueError:
                logging.error(f"Invalid PLZ: {row.get('Zip')}")
                plz = None

            try:
                price = float(row.get("Price/qm", "").replace(",", "."))
            except ValueError:
                price = None

            if not plz or not price:
                continue

            median_rent_by_plz.setdefault(str(plz), []).append(price)

    return median_rent_by_plz


def parse_housing_data(path):
    plz_shapes = get_plz_shapes()

    homeboy_prices = parse_homeboy_data("data/berlin_apartment_listings.csv")

    with open(path, newline="", encoding="utf-8") as f:
        return {
            "type": "FeatureCollection",
            "features": [
                {
                    "id": row["location_identifier"],
                    "type": "Feature",
                    "geometry": mapping(plz_shapes[row["location_identifier"]]),
                    "properties": {
                        "median": median(homeboy_prices[row["location_identifier"]]),
                        "count": len(homeboy_prices[row["location_identifier"]]),
                        "center": mapping(centroid(plz_shapes.get(row["location_identifier"])))["coordinates"],  # type: ignore
                    },
                }
                for row in csv.DictReader(f)
                if plz_shapes.get(row["location_identifier"]) and row["location_identifier"] in homeboy_prices
            ],
        }


print(json.dumps(parse_housing_data("data/berlin_price_m2.csv")))
