#!/usr/bin/env python

import csv
import json
from shapely import set_precision
from shapely.geometry import shape, mapping
import urllib.request


def to_float(value: str) -> float | None:
    return float(value.replace(",", "")) if value else None


def get_berlin_shape():
    # Get the shape of each PLZ as a dict of PLZ: geometry
    with urllib.request.urlopen(
        "https://gdi.berlin.de/services/wfs/alkis_land?service=WFS&version=1.1.0&request=GetFeature&typeName=alkis_land:landesgrenze&outputFormat=application/json&srsName=EPSG:4326"
    ) as response:
        geojson = json.load(response)
    return mapping(set_precision(shape(geojson["features"][0]["geometry"]), 1e-4))


def get_plz_shapes():
    # Get the shape of each PLZ as a dict of PLZ: geometry
    with urllib.request.urlopen("https://tsb-opendata.s3.eu-central-1.amazonaws.com/plz/plz.geojson") as response:
        geojson = json.load(response)
    return {f["properties"]["plz"]: mapping(set_precision(shape(f["geometry"]), 1e-4)) for f in geojson["features"]}


def parse_housing_data(path):
    plz_shapes = get_plz_shapes()
    with open(path, newline="", encoding="utf-8") as f:
        return {
            "type": "FeatureCollection",
            "features": [
                {
                    "id": row["location_identifier"],
                    "type": "Feature",
                    "geometry": plz_shapes.get(row["location_identifier"]),
                    "properties": {
                        "median": to_float(row["median_all_12m_price_per_m2"]),
                        "count": int(row["count_all_12m"].replace(",", "") or 0),
                    },
                }
                for row in csv.DictReader(f)
                if plz_shapes.get(row["location_identifier"])
            ],
        }


print(json.dumps(parse_housing_data("data/berlin_price_m2.csv")))
