from typing import TypedDict, List, Optional
from datetime import date
import random

""" MAPEAR """

#listing (all)
def mapearListing(json):
    return {
        "titulo": json["api"]["description"],
        "vehiculos":[mapearVehiculo(i) for i in json["data"]]
    }
    
#vehiculo
def mapearVehiculo(json):
    vehicle = json.get("vehicle", {})

    def to_int(val, default=None):
        try:
            return int(val)
        except (TypeError, ValueError):
            return default

    return{
        "vin": json.get("vin"),
        "location": json.get("location"),
        "doors": to_int(vehicle.get("doors")),
        "drivetrain":   vehicle.get("drivetrain"),
        "engine":       vehicle.get("engine"),
        "fuel":         vehicle.get("fuel"),
        "make":         vehicle.get("make"),
        "model":        vehicle.get("model"),
        "seats":        to_int(vehicle.get("seats")),
        "transmission": vehicle.get("transmission"),
        "price": round(random.uniform(10000, 65000), 2),
    }