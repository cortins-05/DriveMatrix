from flask import Flask, request, jsonify, send_from_directory
from pymongo import MongoClient
from datetime import datetime
from interfaces import *
import bcrypt
from bson import ObjectId
import os
import requests

app = Flask(__name__)

# ----------------------------
# VARIABLES GENERALES
# ----------------------------
MONGO_URI = os.getenv("MONGO_URI", "mongodb://admin:1234@mongo:27017/")
DB_NAME = "DriveMatrix"
API_KEY = "sk_ad_YCDC78ICh3FxEstsjmxrnxAx"

# ----------------------------
# CONEXIÓN A MONGO
# ----------------------------
try:
    client = MongoClient(MONGO_URI)
    conn = client[DB_NAME]
    print(f"Conectado a MongoDB en {MONGO_URI}")
except Exception as e:
    print(f"Error conectando a MongoDB: {e}")
    raise

# ----------------------------
# COLECCIONES
# ----------------------------
users_collection = conn["users"]
SUB_wishList = conn["wishList"]
SUB_wishListItem = conn["WishListItem"]

purchases_collection = conn["purchases"]

vehicles_collection = conn["vehicles"]

# ----------------------------
# DOCUMENTACIÓN
# ----------------------------
@app.route("/api")
def index():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    return send_from_directory(base_dir, "DriveMatrix API v1 – Documentación para Developers.html")

# ----------------------------
# CRUD USUARIOS
# ----------------------------

# CREATE
@app.route("/api/user/create", methods=["POST"])
def add_user():
    data = request.get_json()
    nombre = data.get("nombre")
    email = data.get("email")
    password = data.get("password")

    if not nombre or not email or not password:
        return jsonify({"error": "nombre, email y contraseña son requeridos"}), 400

    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    user_doc: User = {
        "nombre": nombre,
        "email": email,
        "password": password_hash,
        "purchases_history": [],
        "wishlist": [],
        "created_at": datetime.now()
    }

    result = users_collection.insert_one(user_doc)
    return jsonify({"message": "Usuario creado", "user_id": str(result.inserted_id)}), 201

# READ
@app.route("/api/user/show", methods=["POST"])
def see_user():
    query = request.get_json()
    value = query.get("emailOrId")
    
    if not value:
        return jsonify({"error": "Falta el campo emailOrId"}), 400

    user = None

    # Buscar por ID
    try:
        obj_id = ObjectId(value)
        user = users_collection.find_one({"_id": obj_id})
    except:
        pass

    # Buscar por email
    if not user:
        user = users_collection.find_one({"email": value})

    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    # Convertir ObjectId
    user["_id"] = str(user["_id"])

    # ELIMINAR password (bytes) antes de responder
    if "password" in user:
        del user["password"]

    return jsonify(user), 200

# UPDATE
@app.route("/api/user/update/<user_id>", methods=["PATCH"])
def update_user(user_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No se proporcionaron datos para actualizar"}), 400

    update_fields = {}

    if "nombre" in data:
        update_fields["nombre"] = data["nombre"]

    if "password" in data:
        update_fields["password"] = bcrypt.hashpw(data["password"].encode("utf-8"), bcrypt.gensalt())

    if "wishlist_items" in data and isinstance(data["wishlist_items"], list):
        for item in data["wishlist_items"]:
            if "vehicle_vin" in item:
                item.setdefault("added_at", datetime.now())
        update_fields.setdefault("wishlist", {"$each": []})
        update_fields["wishlist"]["$each"].extend(data["wishlist_items"])

    if not update_fields:
        return jsonify({"error": "No hay campos válidos para actualizar"}), 400

    try:
        obj_id = ObjectId(user_id)
    except:
        return jsonify({"error": "ID de usuario inválido"}), 400

    result = users_collection.update_one({"_id": obj_id}, {"$set": update_fields})
    if result.matched_count == 0:
        return jsonify({"error": "Usuario no encontrado"}), 404

    return jsonify({"message": "Usuario actualizado correctamente"}), 200

# DELETE
@app.route("/api/user/delete", methods=["POST"])
def delete_user():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"error": "email y contraseña son requeridos"}), 400

    user = users_collection.find_one({"email": email})
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    if not bcrypt.checkpw(password.encode("utf-8"), user["password"]):
        return jsonify({"error": "Contraseña incorrecta"}), 401

    result = users_collection.delete_one({"_id": user["_id"]})
    if result.deleted_count == 0:
        return jsonify({"error": "No se pudo eliminar el usuario"}), 500

    return jsonify({"message": "Usuario eliminado correctamente"}), 200


# ----------------------------
# CRUD VEHÍCULOS (STORE)
# ----------------------------
""" CREATE PURCHASE """
@app.route("/api/purchase/create", methods=["POST"])
def add_purchase():
    data = request.get_json()
    
    email = data.get("email")
    password = data.get("password")
    vehicle_vin = data.get("vehicle_vin")
    
    if not email or not password or not vehicle_vin:
        return jsonify({"error": "email, contraseña y numero de vehiculo son requeridos"}), 400

    user = users_collection.find_one({"email": email})
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    if not bcrypt.checkpw(password.encode("utf-8"), user["password"]):
        return jsonify({"error": "Contraseña incorrecta"}), 401
    
    # Busca el documento que contiene el vehículo con el VIN
    vehiculo_doc = vehicles_collection.find_one({
        "vehiculos": {"$elemMatch": {"vin": str(vehicle_vin)}}
    })
    if not vehiculo_doc:
        return jsonify({"error": "Vehiculo no encontrado"}), 403

    # Extrae solo el vehículo que coincide
    vehiculo = next(
        (v for v in vehiculo_doc["vehiculos"] if v["vin"] == vehicle_vin),
        None
    )
    if not vehiculo:
        return jsonify({"error": "Vehiculo no encontrado"}), 403

    venta = {
        "ref_user_id": str(user["_id"]),
        "ref_vehicle_vin": vehiculo["vin"],
        "date": datetime.now()
    }

    result = purchases_collection.insert_one(venta)
    venta["_id"] = str(result.inserted_id)
    
    return jsonify({"Venta Creada:": venta})
    
    
    


# ----------------------------
# VEHÍCULOS BD
# ----------------------------

#VER TODOS
@app.route("/api/auto/listings")
def show_all():
    docs = list(vehicles_collection.find())
    for doc in docs:
        doc["_id"] = str(doc["_id"])  # convertir ObjectId a string
    return jsonify(docs)

#BÚSQUEDA CON FILTROS
@app.route("/api/auto/listings/filter")
def filter_listings():
    # Recoge parámetros opcionales
    doors = request.args.get("doors")
    drivetrain = request.args.get("drivetrain")
    engine = request.args.get("engine")
    fuel = request.args.get("fuel")
    make = request.args.get("make")
    model = request.args.get("model")
    seats = request.args.get("seats")
    transmission = request.args.get("transmission")

    # Construye filtro dinámico
    filtros = {}
    if doors: filtros["doors"] = int(doors)
    if drivetrain: filtros["drivetrain"] = drivetrain
    if engine: filtros["engine"] = engine
    if fuel: filtros["fuel"] = fuel
    if make: filtros["make"] = make
    if model: filtros["model"] = model
    if seats: filtros["seats"] = int(seats)
    if transmission: filtros["transmission"] = transmission

    # Aggregation pipeline: extrae solo los vehículos que cumplan los filtros
    pipeline = [
        {
            "$project": {
                "vehiculos": {
                    "$filter": {
                        "input": "$vehiculos",
                        "as": "v",
                        "cond": {
                            "$and": [
                                {"$eq": ["$$v." + k, v]} for k, v in filtros.items()
                            ]
                        } if filtros else True
                    }
                }
            }
        },
        # Elimina documentos cuyo array filtrado esté vacío
        {
            "$match": {
                "vehiculos.0": {"$exists": True}
            }
        },
        # Desenrolla el array para que cada vehículo sea un documento independiente
        {
            "$unwind": "$vehiculos"
        },
        # Reemplaza la raíz con el vehículo para devolverlo directamente
        {
            "$replaceRoot": {"newRoot": "$vehiculos"}
        }
    ]

    docs = list(vehicles_collection.aggregate(pipeline))

    return jsonify(docs)


# ----------------------------
# COMUNICACIÓN CON AUTO.DEV
# ----------------------------

#GUARDAR TODOS LOS VEHICULOS EN MONGO
@app.route("/auto/actualizarMongo")
def listings_vehicles():
    
    vehicles_collection.delete_many({})
    
    url = "https://api.auto.dev/listings?limit=9999"
    
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }
    
    response = requests.get(url,headers=headers)
    
    result = mapearListing(response.json())
    
    inserted = vehicles_collection.insert_one(result)
    result["_id"] = str(inserted.inserted_id)
    return jsonify(result)

#EN FUNCION DEL VIN VER IMÁGENES
@app.route("/auto/image/<vin>")
def show_auto_image(vin):
    
    url = f"https://api.auto.dev/photos/{vin}"
    
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }
    
    response = requests.get(url,headers=headers)
    
    return response.json()["data"].get("retail",[]) 

# ----------------------------
# INICIALIZACIÓN
# ----------------------------
if __name__ == "__main__":
    print("Backend corriendo en puerto 5000.")
    app.run(debug=True, host="0.0.0.0", port=5000)