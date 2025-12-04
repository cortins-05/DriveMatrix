from typing import TypedDict, List, Optional
from datetime import date

""" MAPEAR """

#listing (all)
def mapearListing(json):
    return {
        "titulo": json["api"]["description"],
        "vehiculos":[mapearVehiculo(i) for i in json["data"]]
    }
    
#vehiculo
def mapearVehiculo(json):
    return{
        "vin": json["vin"],
        "location": json["location"],
        "doors": json["vehicle"].get("doors","none"),
        "drivetrain":   json["vehicle"].get("drivetrain", "none"),
        "engine":       json["vehicle"].get("engine", "none"),
        "fuel":         json["vehicle"].get("fuel", "none"),
        "make":         json["vehicle"].get("make", "none"),
        "model":        json["vehicle"].get("model", "none"),
        "seats":        json["vehicle"].get("seats", 0),
        "transmission": json["vehicle"].get("transmission", "none"),
    }