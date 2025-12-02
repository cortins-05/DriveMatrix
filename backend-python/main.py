from flask import Flask, request, jsonify, send_from_directory
from pymongo import MongoClient
from datetime import datetime
from interfaces import *
import bcrypt
from bson import ObjectId
import os

app = Flask(__name__)

# ----------------------------
# VARIABLES GENERALES
# ----------------------------
# Toma la URI de MongoDB de la variable de entorno
MONGO_URI = os.getenv("MONGO_URI", "mongodb://admin:1234@mongo:27017/")
DB_NAME = "DriveMatrix"

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
SUB_retailListing_collection = conn["retailListing"]

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
# INICIALIZACIÓN
# ----------------------------
if __name__ == "__main__":
    print("Backend corriendo en puerto 5000.")
    app.run(debug=True, host="0.0.0.0", port=5000)