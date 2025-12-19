from flask import Flask, request, jsonify, send_from_directory, redirect, url_for
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime, timedelta
from interfaces import *
import bcrypt
from bson import ObjectId
from bson.errors import InvalidId
import os
import requests
import re
import jwt
from functools import wraps
import logging

app = Flask(__name__)
CORS(app,resources={r"/api/*": {"origins": "http://localhost:4200"}})

# Logger básico
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("drivematrix")

# ----------------------------
# VARIABLES GENERALES
# ----------------------------
MONGO_URI = os.getenv("MONGO_URI", "mongodb://admin:1234@mongo:27017/")
DB_NAME = "DriveMatrix"
API_KEY = "sk_ad_YCDC78ICh3FxEstsjmxrnxAx"
app.config["SECRET_KEY"] = os.getenv("JWT_SECRET", "una_clave_muy_segura_y_larga")

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

purchases_collection = conn["purchases"]

vehicles_collection = conn["vehicles"]

valorations_user_product_collection = conn["valorations_user_product"]

# Índices útiles (idempotente)
try:
    users_collection.create_index("email", unique=True)
    vehicles_collection.create_index("vehiculos.vin")
    # Índice único: un usuario solo puede valorar una vez por producto (vin)
    valorations_user_product_collection.create_index(
        [("user_id", 1), ("vehicle_vin", 1)],
        unique=True
    )
except Exception:
    logger.exception("No se pudieron crear índices")


# ----------------------------
# HELPERS
# ----------------------------
def serialize(obj):
    """Convierte tipos de Mongo a tipos serializables JSON."""
    if isinstance(obj, dict):
        return {k: serialize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [serialize(v) for v in obj]
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, bytes):
        try:
            return obj.decode("utf-8")
        except Exception:
            return str(obj)
    return obj


def error_response(message, code=400):
    return jsonify({"error": message}), code


# ----------------------------
# AUTH / TOKEN
# ----------------------------
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")
        if not token:
            return error_response("Token requerido", 401)

        if token.startswith("Bearer "):
            token = token.split(" ", 1)[1]

        try:
            data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
            current_user = users_collection.find_one({"_id": ObjectId(data["user_id"])})
            if current_user is None:
                return error_response("Usuario no encontrado", 401)
        except jwt.ExpiredSignatureError:
            return error_response("Token expirado", 401)
        except Exception:
            return error_response("Token inválido", 401)

        return f(current_user, *args, **kwargs)

    return decorated

@app.route("/api/user/checkToken", methods=["GET"])
def checkToken():
    token = request.headers.get("Authorization")
    if not token:
        return error_response("Token requerido", 401)

    if token.startswith("Bearer "):
        token = token.split(" ", 1)[1]

    try:
        data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        user = users_collection.find_one({"_id": ObjectId(data["user_id"])})
        
        if user is None:
            return error_response("Usuario no encontrado", 401)
        
        # Remover información sensible
        user.pop("password", None)
        
        return jsonify({
            "valid": True,
            "user": serialize(user)
        }), 200
        
    except jwt.ExpiredSignatureError:
        return error_response("Token expirado", 401)
    except jwt.InvalidTokenError:
        return error_response("Token inválido", 401)
    except Exception:
        logger.exception("Error verificando token")
        return error_response("Error al verificar token", 401)

# ----------------------------
# DOCUMENTACIÓN
# ----------------------------
@app.route("/")
def check_api():
    return "API WORKS!!!"

# ----------------------------
# DOCUMENTACIÓN
# ----------------------------
@app.route("/api")
def index():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    return send_from_directory(base_dir, "Guía Rápida para Developers – Backend Flask.html")

# ----------------------------
# CRUD USUARIOS
# ----------------------------

# CREATE
@app.route("/api/user/create", methods=["POST"])
def add_user():
    if not request.is_json:
        return error_response("Content-Type application/json requerido", 415)
    data = request.get_json(silent=True) or {}
    nombre = data.get("nombre")
    email = data.get("email")
    password = data.get("password")

    if not nombre or not email or not password:
        return jsonify({"error": "nombre, email y contraseña son requeridos"}), 400

    if users_collection.find_one({"email": email}):
        return error_response("El email ya está registrado", 409)

    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    user_doc = {
        "nombre": nombre,
        "email": email,
        "password": password_hash,
        "purchases_history": [],
        "wishlist": [],
        "created_at": datetime.now()
    }

    result = users_collection.insert_one(user_doc)
    return jsonify({"message": "Usuario creado", "user_id": str(result.inserted_id)}), 201


# LOGIN
@app.route("/api/user/login", methods=["POST"])
def login_user():
    if not request.is_json:
        return error_response("Content-Type application/json requerido", 415)
    query = request.get_json(silent=True) or {}
    email = query.get("email")
    password = query.get("password")
    if not email or not password:
        return error_response("Faltan campos", 400)

    user = users_collection.find_one({"email": email})
    if not user or not bcrypt.checkpw(password.encode("utf-8"), user["password"]):
        return error_response("Credenciales inválidas", 401)

    payload = {
        "user_id": str(user["_id"]),
        "exp": datetime.utcnow() + timedelta(hours=2)
    }
    token = jwt.encode(payload, app.config["SECRET_KEY"], algorithm="HS256")
    return jsonify({"token": token}), 200

# READ
@app.route("/api/user/show", methods=["POST"])
def see_user():
    if not request.is_json:
        return error_response("Content-Type application/json requerido", 415)
    query = request.get_json(silent=True) or {}
    value = query.get("emailOrId")
    
    if not value:
        return jsonify({"error": "Falta el campo emailOrId"}), 400

    user = None

    # Buscar por ID
    try:
        obj_id = ObjectId(value)
        user = users_collection.find_one({"_id": obj_id})
    except (InvalidId, TypeError):
        pass

    # Buscar por email
    if not user:
        user = users_collection.find_one({"email": value})

    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    user.pop("password", None)
    return jsonify(serialize(user)), 200

# UPDATE
@app.route("/api/user/update/<user_id>", methods=["PATCH"])
@token_required
def update_user(current_user, user_id):
    if not request.is_json:
        return error_response("Content-Type application/json requerido", 415)
    data = request.get_json(silent=True) or {}
    if not data:
        return error_response("No se proporcionaron datos para actualizar", 400)

    set_fields = {}
    push_fields = {}

    if "nombre" in data:
        set_fields["nombre"] = data["nombre"]

    if "password" in data:
        set_fields["password"] = bcrypt.hashpw(data["password"].encode("utf-8"), bcrypt.gensalt())

    wishlist_items = data.get("wishlist_items")
    if isinstance(wishlist_items, list) and wishlist_items:
        normalized_items = []
        for item in wishlist_items:
            if not isinstance(item, dict) or "vehicle_vin" not in item:
                continue
            item.setdefault("added_at", datetime.now())
            normalized_items.append(item)
        if normalized_items:
            push_fields["wishlist"] = {"$each": normalized_items}

    if not set_fields and not push_fields:
        return jsonify({"error": "No hay campos válidos para actualizar"}), 400

    try:
        obj_id = ObjectId(user_id)
    except (InvalidId, TypeError):
        return error_response("ID de usuario inválido", 400)

    if str(current_user.get("_id")) != str(obj_id):
        return error_response("No autorizado para actualizar este usuario", 403)

    update_ops = {}
    if set_fields:
        update_ops["$set"] = set_fields
    if push_fields:
        update_ops["$push"] = push_fields

    try:
        result = users_collection.update_one({"_id": obj_id}, update_ops)
    except Exception:
        logger.exception("Error actualizando usuario")
        return error_response("Error al actualizar usuario", 500)

    if result.matched_count == 0:
        return error_response("Usuario no encontrado", 404)

    return jsonify({"message": "Usuario actualizado correctamente"}), 200

# DELETE
@app.route("/api/user/delete", methods=["DELETE"])
@token_required
def delete_user(current_user):
    try:
        result = users_collection.delete_one({"_id": current_user["_id"]})
    except Exception:
        logger.exception("Error eliminando usuario")
        return error_response("No se pudo eliminar el usuario", 500)

    if result.deleted_count == 0:
        return error_response("No se pudo eliminar el usuario", 500)

    return jsonify({"message": "Usuario eliminado correctamente"}), 200


# ----------------------------
# CRUD VEHÍCULOS (STORE)
# ----------------------------
""" CREATE PURCHASE """
@app.route("/api/purchase/create", methods=["POST"])
@token_required
def add_purchase(current_user):
    if not request.is_json:
        return error_response("Content-Type application/json requerido", 415)
    data = request.get_json(silent=True) or {}
    vehicle_vin = data.get("vehicle_vin")
    if not vehicle_vin:
        return error_response("Falta vehicle_vin", 400)
    vehicle_vin = str(vehicle_vin)

    vehiculo_doc = vehicles_collection.find_one({
        "vehiculos": {"$elemMatch": {"vin": vehicle_vin}}
    })
    if not vehiculo_doc:
        return error_response("Vehiculo no encontrado", 404)

    vehiculo = next(
        (v for v in vehiculo_doc["vehiculos"] if str(v.get("vin")) == vehicle_vin),
        None
    )
    if not vehiculo:
        return error_response("Vehiculo no encontrado", 404)

    venta = {
        "ref_user_id": str(current_user["_id"]),
        "ref_vehicle_vin": str(vehiculo.get("vin")),
        "date": datetime.now()
    }

    try:
        result = purchases_collection.insert_one(venta)
    except Exception:
        logger.exception("Error creando compra")
        return error_response("Error creando compra", 500)

    venta["_id"] = str(result.inserted_id)
    return jsonify({"venta": venta}), 201
    
    
    

# ----------------------------
# WISHLIST
# ----------------------------
@app.route("/api/user/wishlist/add", methods=["POST"])
@token_required
def add_wishlist_item(current_user):
    if not request.is_json:
        return error_response("Content-Type application/json requerido", 415)
    data = request.get_json(silent=True) or {}
    vehicle_vin = data.get("vehicle_vin")
    if not vehicle_vin:
        return error_response("Falta vehicle_vin", 400)
    vehicle_vin = str(vehicle_vin)

    item = {"vehicle_vin": vehicle_vin, "added_at": datetime.now()}
    try:
        res = users_collection.update_one(
            {"_id": current_user["_id"], "wishlist.vehicle_vin": {"$ne": vehicle_vin}},
            {"$push": {"wishlist": item}}
        )
    except Exception:
        logger.exception("Error agregando a wishlist")
        return error_response("Error agregando a wishlist", 500)

    if res.modified_count == 0:
        return error_response("Vehículo ya en wishlist", 400)

    return jsonify({"message": "Vehículo agregado a wishlist", "item": serialize(item)}), 200


@app.route("/api/user/wishlist/remove", methods=["POST"])
@token_required
def remove_wishlist_item(current_user):
    if not request.is_json:
        return error_response("Content-Type application/json requerido", 415)
    data = request.get_json(silent=True) or {}
    vehicle_vin = data.get("vehicle_vin")
    if not vehicle_vin:
        return error_response("Falta vehicle_vin", 400)
    vehicle_vin = str(vehicle_vin)

    try:
        result = users_collection.update_one(
            {"_id": current_user["_id"]},
            {"$pull": {"wishlist": {"vehicle_vin": vehicle_vin}}}
        )
    except Exception:
        logger.exception("Error eliminando de wishlist")
        return error_response("Error eliminando de wishlist", 500)

    if result.modified_count == 0:
        return error_response("Vehículo no encontrado en wishlist", 404)

    return jsonify({"message": "Vehículo eliminado de wishlist"}), 200


@app.route("/api/user/wishlist", methods=["GET"])
@token_required
def get_wishlist(current_user):
    wishlist = current_user.get("wishlist", [])
    return jsonify({"wishlist": serialize(wishlist)}), 200


# ----------------------------
# VALORACIONES (RATINGS)
# ----------------------------

# CREATE - Crear una nueva valoración
@app.route("/api/valoration/create", methods=["POST"])
@token_required
def create_valoration(current_user):
    if not request.is_json:
        return error_response("Content-Type application/json requerido", 415)
    data = request.get_json(silent=True) or {}
    vehicle_vin = data.get("vehicle_vin")
    rating = data.get("rating")
    comment = data.get("comment", "")

    if not vehicle_vin:
        return error_response("Falta vehicle_vin", 400)
    if rating is None:
        return error_response("Falta rating", 400)

    # Validar que rating esté entre 1 y 5
    try:
        rating = int(rating)
        if rating < 1 or rating > 5:
            return error_response("Rating debe ser entre 1 y 5", 400)
    except (ValueError, TypeError):
        return error_response("Rating debe ser un número entero", 400)

    # Verificar que el vehículo existe
    vehicle_exists = vehicles_collection.find_one({
        "vehiculos": {"$elemMatch": {"vin": str(vehicle_vin)}}
    })
    if not vehicle_exists:
        return error_response("Vehículo no encontrado", 404)

    # Verificar que el usuario no ha valorado ya este producto
    existing = valorations_user_product_collection.find_one({
        "user_id": str(current_user["_id"]),
        "vehicle_vin": str(vehicle_vin)
    })
    if existing:
        return error_response("Ya has valorado este vehículo", 409)

    valoration_doc = {
        "user_id": str(current_user["_id"]),
        "vehicle_vin": str(vehicle_vin),
        "rating": rating,
        "comment": comment,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }

    try:
        result = valorations_user_product_collection.insert_one(valoration_doc)
        valoration_doc["_id"] = str(result.inserted_id)
        return jsonify({"message": "Valoración creada", "valoration": serialize(valoration_doc)}), 201
    except Exception:
        logger.exception("Error creando valoración")
        return error_response("Error al crear valoración", 500)


# READ - Obtener valoraciones por VIN (público)
@app.route("/api/valorations/<vehicle_vin>", methods=["GET"])
def get_valorations(vehicle_vin):
    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 10))
    except Exception:
        return error_response("Parámetros de paginación inválidos", 400)

    skip = (page - 1) * per_page
    cursor = valorations_user_product_collection.find(
        {"vehicle_vin": str(vehicle_vin)}
    ).skip(skip).limit(per_page)
    
    valorations = [serialize(v) for v in cursor]
    total_count = valorations_user_product_collection.count_documents(
        {"vehicle_vin": str(vehicle_vin)}
    )

    # Calcular promedio de rating
    avg_rating = 0
    if valorations:
        avg_rating = sum(v.get("rating", 0) for v in valorations) / len(valorations)

    return jsonify({
        "vehicle_vin": vehicle_vin,
        "page": page,
        "per_page": per_page,
        "total": total_count,
        "average_rating": round(avg_rating, 2),
        "valorations": valorations
    }), 200


# UPDATE - Actualizar una valoración existente
@app.route("/api/valoration/update/<valoration_id>", methods=["PATCH"])
@token_required
def update_valoration(current_user, valoration_id):
    if not request.is_json:
        return error_response("Content-Type application/json requerido", 415)
    data = request.get_json(silent=True) or {}

    try:
        obj_id = ObjectId(valoration_id)
    except (InvalidId, TypeError):
        return error_response("ID de valoración inválido", 400)

    # Obtener valoración existente
    valoration = valorations_user_product_collection.find_one({"_id": obj_id})
    if not valoration:
        return error_response("Valoración no encontrada", 404)

    # Verificar que es el propietario
    if str(valoration["user_id"]) != str(current_user["_id"]):
        return error_response("No autorizado para actualizar esta valoración", 403)

    update_fields = {}

    if "rating" in data:
        try:
            rating = int(data["rating"])
            if rating < 1 or rating > 5:
                return error_response("Rating debe ser entre 1 y 5", 400)
            update_fields["rating"] = rating
        except (ValueError, TypeError):
            return error_response("Rating debe ser un número entero", 400)

    if "comment" in data:
        update_fields["comment"] = data["comment"]

    if not update_fields:
        return error_response("No hay campos válidos para actualizar", 400)

    update_fields["updated_at"] = datetime.now()

    try:
        result = valorations_user_product_collection.update_one(
            {"_id": obj_id},
            {"$set": update_fields}
        )
    except Exception:
        logger.exception("Error actualizando valoración")
        return error_response("Error al actualizar valoración", 500)

    if result.matched_count == 0:
        return error_response("Valoración no encontrada", 404)

    return jsonify({"message": "Valoración actualizada correctamente"}), 200


# DELETE - Eliminar una valoración
@app.route("/api/valoration/delete/<valoration_id>", methods=["DELETE"])
@token_required
def delete_valoration(current_user, valoration_id):
    try:
        obj_id = ObjectId(valoration_id)
    except (InvalidId, TypeError):
        return error_response("ID de valoración inválido", 400)

    # Obtener valoración existente
    valoration = valorations_user_product_collection.find_one({"_id": obj_id})
    if not valoration:
        return error_response("Valoración no encontrada", 404)

    # Verificar que es el propietario
    if str(valoration["user_id"]) != str(current_user["_id"]):
        return error_response("No autorizado para eliminar esta valoración", 403)

    try:
        result = valorations_user_product_collection.delete_one({"_id": obj_id})
    except Exception:
        logger.exception("Error eliminando valoración")
        return error_response("Error al eliminar valoración", 500)

    if result.deleted_count == 0:
        return error_response("Valoración no encontrada", 404)

    return jsonify({"message": "Valoración eliminada correctamente"}), 200




# ----------------------------
# VEHÍCULOS BD
# ----------------------------

#VER TODOS
@app.route("/api/auto/listings")
def show_all():
    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 10))
    except Exception:
        return error_response("Parámetros de paginación inválidos", 400)
    
    skip = (page - 1) * per_page
    
    pipeline = [
        {"$unwind": "$vehiculos"}, 
    
        {"$replaceRoot": {"newRoot": "$vehiculos"}}, 
        
        {"$skip": skip},  
    
        {"$limit": per_page} 
    ]

    try:
    
        cursor = vehicles_collection.aggregate(pipeline)
        docs = [serialize(d) for d in cursor]
        
        count_pipeline = [
            {"$unwind": "$vehiculos"},
            {"$count": "total_count"}
        ]
        
        total_count_result = list(vehicles_collection.aggregate(count_pipeline))
        total_items = total_count_result[0]['total_count'] if total_count_result else 0

    except Exception as e:
    
        print(f"Error de base de datos: {e}")
        return error_response("Error al obtener los datos de vehículos", 500)

    return jsonify({
        "page": page,
        "per_page": per_page, 
        "total_items": total_items,
        "data": docs
    }), 200

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
    vin = request.args.get("vin")
    
    filtros = {}
    try:
        if doors:
            filtros["doors"] = int(doors)
        if seats:
            filtros["seats"] = int(seats)
    except ValueError:
        return jsonify({"error": "Parámetros numéricos inválidos"}), 400

    def ci(field_val):
        return {"$regex": f".*{re.escape(field_val)}.*", "$options": "i"}

    if drivetrain:
        filtros["drivetrain"] = ci(drivetrain)
    if engine:
        filtros["engine"] = ci(engine)
    if fuel:
        filtros["fuel"] = ci(fuel)
    if make:
        filtros["make"] = ci(make)
    if model:
        filtros["model"] = ci(model)
    if transmission:
        filtros["transmission"] = ci(transmission)
        
    if vin:
        filtros = {}
        filtros["vin"] = vin

    pipeline = [
        {"$unwind": "$vehiculos"},
        {"$replaceRoot": {"newRoot": "$vehiculos"}}
    ]

    if filtros:
        pipeline.append({"$match": filtros})

    docs = list(vehicles_collection.aggregate(pipeline))

    return jsonify(serialize(docs)), 200


# ----------------------------
# COMUNICACIÓN CON AUTO.DEV
# ----------------------------

#GUARDAR TODOS LOS VEHICULOS EN MONGO
@app.route("/auto/actualizarMongo")
def listings_vehicles():
    url = "https://api.auto.dev/listings?limit=9999"

    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        parsed = response.json()
    except requests.RequestException as exc:
        logger.exception("Fallo de comunicacion con auto.dev")
        return error_response("Fallo al contactar auto.dev", 502)
    except ValueError:
        return error_response("Respuesta de auto.dev no es JSON", 502)

    mapped = mapearListing(parsed)

    try:
        vehicles_collection.delete_many({})
        if isinstance(mapped, list):
            res = vehicles_collection.insert_many(mapped)
            out = {"inserted_count": len(res.inserted_ids)}
        else:
            res = vehicles_collection.insert_one(mapped)
            mapped["_id"] = str(res.inserted_id)
            out = mapped
    except Exception:
        logger.exception("Error guardando listings")
        return error_response("Error guardando listings", 500)

    return jsonify(serialize(out)), 200

#EN FUNCION DEL VIN VER IMÁGENES
@app.route("/auto/image/<vin>")
def show_auto_image(vin):
    url = f"https://api.auto.dev/photos/{vin}"

    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
    except requests.RequestException:
        logger.exception("Fallo de comunicacion con auto.dev (fotos)")
        return error_response("Fallo al contactar auto.dev", 502)
    except ValueError:
        return error_response("Respuesta de auto.dev no es JSON", 502)

    return jsonify(serialize(data.get("data", {}).get("retail", []))), 200

# ----------------------------
# REDIRECCIÓN
# ----------------------------
@app.route('/<path:todo>')
def catch_all(todo):
    return redirect(url_for("index"))

# ----------------------------
# INICIALIZACIÓN
# ----------------------------
if __name__ == "__main__":
    print("Backend corriendo en puerto 5000.")
    app.run(debug=True, host="0.0.0.0", port=5000)