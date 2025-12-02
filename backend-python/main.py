from flask import Flask, request, jsonify, send_from_directory
from pymongo import MongoClient
from datetime import datetime
from interfaces import *
import bcrypt
from bson import ObjectId
import os


app = Flask(__name__)

#VARIABLES GENERALES
MONGO_URI = "mongodb://admin:1234@localhost:27017/"
DB_NAME = "DriveMatrix"

#Conexion a Mongo
client = MongoClient(MONGO_URI)
conn = client[DB_NAME]

#COLECCIONES
users_collection = conn["users"]
SUB_wishList = conn["wishList"]
SUB_WishListItem = conn["WishListItem"]

purchases_collection = conn["purchases"]

vehicles_collection = conn["vehicles"]
SUB_retailListing_collection = conn["retailListing"]

#DOCUMENTACION
@app.route("/")
def index():
    # Carpeta actual del script
    base_dir = os.path.dirname(os.path.abspath(__file__))
    # Devuelve el archivo HTML
    return send_from_directory(base_dir, "DriveMatrix API v1 – Documentación para Developers.html")

#USUARIOS(CRUD) -> Usaremos POST
# ----------------------
# CREATE USER
# ----------------------
@app.route("/user/create",methods=["POST"])
def add_user():
    data = request.get_json()
    
    # Validamos campos mínimos
    nombre = data.get("nombre")
    email = data.get("email")
    password = data.get("password")
    if not nombre or not email or not password:
        return jsonify({"error": "nombre, email y contraseña son requeridos"}), 400
    
    #Encriptamos la contraseña
    password_hash = bcrypt.hashpw(password.encode("utf-8"),bcrypt.gensalt())
    
    # Creamos el documento según tu esquema
    user_doc:User = {
        "nombre": nombre,
        "email": email,
        "password": password_hash,
        "purchases_history": [],
        "wishlist": [],
        "created_at": datetime.now()
    }
    
    # Insertamos en MongoDB
    result = users_collection.insert_one(user_doc)
    return jsonify({"message": "Usuario creado", "user_id": str(result.inserted_id)}), 201
# ----------------------
# READ
# ----------------------
@app.route("/user/show", methods=["POST"])
def see_user():
    query = request.get_json()
    
    try:
        query["_id"] = ObjectId(query.get("emailOrId")) #Ya que en mongo el id lleva ese tipo de expresion
    except:
        query["email"] = query.get("emailOrId")
    
    user = conn.users.find_one(query)
    
    if not user:
        return jsonify({"error":"Usuario no encontrado"}),404
    
    return jsonify(user)
# ----------------------
# UPDATE USER
# ----------------------
@app.route("/user/update/<user_id>", methods=["PATCH"])
def update_user(user_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No se proporcionaron datos para actualizar"}), 400

    update_fields = {}

    # Actualizar nombre
    if "nombre" in data:
        update_fields["nombre"] = data["nombre"]

    # Actualizar contraseña
    if "password" in data:
        hashed = bcrypt.hashpw(data["password"].encode("utf-8"), bcrypt.gensalt())
        update_fields["password"] = hashed

    # Agregar items a wishlist (si vienen)
    if "wishlist_items" in data and isinstance(data["wishlist_items"], list):
        # Cada item debe tener vehicle_vin y added_at (opcional: notes)
        for item in data["wishlist_items"]:
            if "vehicle_vin" in item:
                item.setdefault("added_at", datetime.now())
        # Se hace push a array wishlist
        update_fields.setdefault("wishlist", {"$each": []})
        update_fields["wishlist"]["$each"].extend(data["wishlist_items"])

    if not update_fields:
        return jsonify({"error": "No hay campos válidos para actualizar"}), 400

    # Convertir ObjectId
    try:
        obj_id = ObjectId(user_id)
    except:
        return jsonify({"error": "ID de usuario inválido"}), 400

    # Ejecutar update
    result = users_collection.update_one({"_id": obj_id}, {"$set": update_fields})

    if result.matched_count == 0:
        return jsonify({"error": "Usuario no encontrado"}), 404

    return jsonify({"message": "Usuario actualizado correctamente"}), 200
# ----------------------
# DELETE USER
# ----------------------
@app.route("/user/delete", methods=["POST"])
def delete_user():
    data = request.get_json()
    
    # Validamos campos mínimos
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"error": "nombre,  y contraseña son requeridos"}), 400
    
    user = users_collection.find_one({"email":email})
    if not user:
        return jsonify({"error":"Usuario no encontrado"}),404
    
    #Validar password
    if not bcrypt.checkpw(password.encode("utf-8"),user["password"]):
        return jsonify({"error": "Contraseña incorrecta"}), 401
    
    #Eliminamos de MongoDB
    result = conn.users.delete_one({"_id": user["_id"]})
    if result.deleted_count == 0:
        return jsonify({"error": "No se pudo eliminar el usuario"}), 500

    return jsonify({"message": "Usuario eliminado correctamente"}), 200

#INICIALIZACIÓN
if __name__ == "__main__":
    print("Backend corriendo en puerto 5000.")
    app.run(debug=True, port=5000)
