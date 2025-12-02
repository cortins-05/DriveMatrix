from typing import TypedDict, List, Optional
from datetime import date

""" Vehículo """
class RetailListing(TypedDict):
    price: float
    dealer: str #Nombre del concesionario

class Vehicle(TypedDict): #https://api.auto.dev/listings/{vin}
    vin: str
    location: List[float]
    year: int
    make: str
    model: str
    trim: str
    driveTrain: str
    engine: str
    fuel: str
    transmission: str
    doors: int
    seats: int
    retailListing: Optional[RetailListing]
    photos: Optional[List[str]] #https://api.auto.dev/photos/{vin}

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