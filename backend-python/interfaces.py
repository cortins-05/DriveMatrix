from typing import TypedDict, List, Optional
from datetime import date

""" COMPRAS """
class Purchases(TypedDict):
    id: int
    ref_user_id: int
    ref_vehicle_vin: str
    total: float
    date: date

""" LISTA DE DESEOS """    
class WishListItem(TypedDict):
    vehicle_vin: str  # Referencia al VIN del vehículo
    added_at: date    # Fecha en que se agregó a la lista
    notes: Optional[str]  # Comentarios o recordatorios del usuario

class WishList(TypedDict):
    user_id: int             # Referencia al usuario
    items: List[WishListItem]

""" USUARIO """
class User(TypedDict):
    id: int
    nombre: str
    email: str
    password: str
    purchases_history: List[Purchases]
    wishList: WishList
    created_at: date

    
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