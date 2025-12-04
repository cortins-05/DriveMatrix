from flask import Flask, request, jsonify, send_from_directory, redirect, url_for
from pymongo import MongoClient
from datetime import datetime, timedelta
from interfaces import *
import bcrypt
from bson import ObjectId
import os
import requests
import jwt
from functools import wraps
import logging

app = Flask(__name__)

# Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("drivematrix")

# ----------------------------
# VARIABLES GENERALES
# ----------------------------
MONGO_URI = os.getenv("MONGO_URI", "mongodb://admin:1234@mongo:27017/")
DB_NAME = "DriveMatrix"
API_KEY = "sk_ad_YCDC78ICh3FxEstsjmxrnxAx"
# Clave secreta para firmar el token
app.config["SECRET_KEY"] = os.getenv("JWT_SECRET", "una_clave_muy_segura_y_larga")

# ----------------------------
# CONEXIÓN A MONGO
# ----------------------------
try:
    client = MongoClient(MONGO_URI)
    conn = client[DB_NAME]
    print(f"Conectado a MongoDB en {MONGO_URI}")
except Exception as e:
    logger.exception("Error conectando a MongoDB")
    raise

# ----------------------------
# COLECCIONES
# ----------------------------
users_collection = conn["users"]
purchases_collection = conn["purchases"]
vehicles_collection = conn["vehicles"]

# Intentar crear índices importantes (idempotente)
try:
    users_collection.create_index("email", unique=True)
    vehicles_collection.create_index("vehiculos.vin")
except Exception:
    logger.exception("No se pudo crear índices (posible duplicado existente)")

# --- Helpers ---
def serialize(obj):
    """Recursively serialize Mongo types to JSON-serializable types."""
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
# TOKEN
# ----------------------------
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")
        if not token:
            return error_response("Token requerido", 401)

        if token.startswith("Bearer "):
            token = token.split(" ")[1]

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
    
    if users_collection.find_one({"email": email}):
        return error_response("Ya existe un usuario registrado con ese mail", 400)

    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    user_doc: User = {
        "nombre": nombre,
        "email": email,
        "password": password_hash,
        "purchases_history": [],
        "wishlist": [],
        "created_at": datetime.now()
    }

    try:
        result = users_collection.insert_one(user_doc)
    except Exception:
        logger.exception("Error insertando usuario")
        return error_response("Error creando usuario", 500)
    return jsonify({"message": "Usuario creado", "user_id": str(result.inserted_id)}), 201

# LOGIN
@app.route("/api/user/login", methods=["POST"])
def login_user():
    query = request.get_json()
    email = query.get("email")
    password = query.get("password")
    
    if not email or not password:
        return jsonify({"error": "Falta algun campo"}), 400

    user = users_collection.find_one({"email": email})

    # Mensaje genérico para evitar user enumeration
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user["password"]):
        return error_response("Credenciales inválidas", 401)
    
    # Payload del token
    payload = {
        "user_id": str(user["_id"]),
        "exp": datetime.utcnow() + timedelta(hours=2)  # Expira en 2h
    }

    token = jwt.encode(payload, app.config["SECRET_KEY"], algorithm="HS256")

    return jsonify({"token": token}), 200

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
        return error_response("Usuario no encontrado", 404)

    # ELIMINAR password antes de responder
    user.pop("password", None)

    return jsonify(serialize(user)), 200

# UPDATE
@app.route("/api/user/update/<user_id>", methods=["PATCH"])
@token_required
def update_user(current_user, user_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No se proporcionaron datos para actualizar"}), 400

    # Validar ID objetivo
    try:
        target_obj_id = ObjectId(user_id)
    except Exception:
        return jsonify({"error": "ID de usuario inválido"}), 400

    # Autorización: sólo el propio usuario puede actualizar su perfil
    if str(current_user["_id"]) != str(target_obj_id):
        return jsonify({"error": "No autorizado para actualizar este usuario"}), 403

    set_ops = {}
    push_ops = {}

    # Campos simples a setear
    if "nombre" in data:
        set_ops["nombre"] = data["nombre"]

    if "password" in data:
        set_ops["password"] = bcrypt.hashpw(data["password"].encode("utf-8"), bcrypt.gensalt())

    # Añadir items a wishlist (no sobrescribir)
    if "wishlist_items" in data:
        items = data["wishlist_items"]
        if not isinstance(items, list):
            return jsonify({"error": "wishlist_items debe ser una lista"}), 400
        processed = []
        for item in items:
            if not isinstance(item, dict):
                continue
            if "vehicle_vin" not in item:
                continue
            itm = dict(item)
            itm.setdefault("added_at", datetime.now())
            processed.append(itm)
        if processed:
            push_ops["wishlist"] = {"$each": processed}

    if not set_ops and not push_ops:
        return error_response("No hay campos válidos para actualizar", 400)

    update_doc = {}
    if set_ops:
        update_doc["$set"] = set_ops
    if push_ops:
        update_doc["$push"] = {k: v for k, v in push_ops.items()}

    try:
        result = users_collection.update_one({"_id": target_obj_id}, update_doc)
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
    data = request.get_json()
    vehicle_vin = data.get("vehicle_vin")
    if not vehicle_vin:
        return jsonify({"error": "Falta vehicle_vin"}), 400
    vehicle_vin = str(vehicle_vin)

    vehiculo_doc = vehicles_collection.find_one({
        "vehiculos": {"$elemMatch": {"vin": vehicle_vin}}
    })
    if not vehiculo_doc:
        return jsonify({"error": "Vehiculo no encontrado"}), 404

    vehiculo = next(
        (v for v in vehiculo_doc["vehiculos"] if str(v.get("vin")) == vehicle_vin),
        None
    )
    if not vehiculo:
        return jsonify({"error": "Vehiculo no encontrado"}), 404

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
    return jsonify(serialize({"Venta Creada": venta})), 201

""" NUEVO ITEM WISHLIST """
@app.route("/api/user/wishlist/add", methods=["POST"])
@token_required
def add_wishlist_item(current_user):
    data = request.get_json()
    vehicle_vin = data.get("vehicle_vin")
    if not vehicle_vin:
        return jsonify({"error": "Falta vehicle_vin"}), 400

    # Normalizar VIN a string
    vehicle_vin = str(vehicle_vin)

    # Crear item
    item = {"vehicle_vin": vehicle_vin, "added_at": datetime.now()}

    # Insertar de forma atómica: solo si no existe ya un item con ese vehicle_vin
    try:
        res = users_collection.update_one(
            {"_id": current_user["_id"], "wishlist.vehicle_vin": {"$ne": vehicle_vin}},
            {"$push": {"wishlist": item}}
        )
    except Exception:
        logger.exception("Error actualizando wishlist")
        return error_response("Error agregando a wishlist", 500)

    if res.modified_count == 0:
        return error_response("Vehículo ya en wishlist", 400)

    return jsonify(serialize({"message": "Vehículo agregado a wishlist", "item": item})), 200

""" Eliminar item de wishlist """
@app.route("/api/user/wishlist/remove", methods=["POST"])
@token_required
def remove_wishlist_item(current_user):
    data = request.get_json()
    vehicle_vin = data.get("vehicle_vin")
    if not vehicle_vin:
        return jsonify({"error": "Falta vehicle_vin"}), 400

    vehicle_vin = str(vehicle_vin)

    try:
        result = users_collection.update_one(
            {"_id": current_user["_id"]},
            {"$pull": {"wishlist": {"vehicle_vin": vehicle_vin}}}
        )
    except Exception:
        logger.exception("Error eliminando item de wishlist")
        return error_response("Error eliminando de wishlist", 500)

    if result.modified_count == 0:
        return error_response("Vehículo no encontrado en wishlist", 404)

    return jsonify({"message": "Vehículo eliminado de wishlist"}), 200

""" LISTAR WISHLIST """
@app.route("/api/user/wishlist", methods=["GET"])
@token_required
def get_wishlist(current_user):
    wishlist = current_user.get("wishlist", [])
    return jsonify(serialize({"wishlist": wishlist})), 200

# ----------------------------
# VEHÍCULOS BD
# ----------------------------

#VER TODOS
@app.route("/api/auto/listings")
def show_all():
    # Paginación ligera
    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 100))
    except Exception:
        return error_response("Parámetros de paginación inválidos", 400)

    skip = (page - 1) * per_page
    cursor = vehicles_collection.find().skip(skip).limit(per_page)
    docs = [serialize(d) for d in cursor]
    return jsonify({"page": page, "per_page": per_page, "data": docs}), 200

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

    # Construye filtro dinámico con validación
    filtros = {}
    try:
        if doors is not None:
            filtros["doors"] = int(doors)
        if drivetrain is not None:
            filtros["drivetrain"] = drivetrain
        if engine is not None:
            filtros["engine"] = engine
        if fuel is not None:
            filtros["fuel"] = fuel
        if make is not None:
            filtros["make"] = make
        if model is not None:
            filtros["model"] = model
        if seats is not None:
            filtros["seats"] = int(seats)
        if transmission is not None:
            filtros["transmission"] = transmission
    except ValueError:
        return error_response("Parámetros numéricos inválidos", 400)

    pipeline = []
    # Si hay filtros, usar $project + $filter; sino solo unwind/replaceRoot
    if filtros:
        conds = [{"$eq": [f"$$v.{k}", v]} for k, v in filtros.items()]
        pipeline.append({
            "$project": {
                "vehiculos": {
                    "$filter": {
                        "input": "$vehiculos",
                        "as": "v",
                        "cond": {"$and": conds}
                    }
                }
            }
        })
        pipeline.append({"$match": {"vehiculos.0": {"$exists": True}}})

    pipeline.extend([
        {"$unwind": "$vehiculos"},
        {"$replaceRoot": {"newRoot": "$vehiculos"}}
    ])

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
        mapped = mapearListing(response.json())

        if not mapped:
            return error_response("No se obtuvieron listings de AutoDev", 502)

        # Insertar según tipo
        try:
            if isinstance(mapped, list):
                vehicles_collection.delete_many({})
                inserted = vehicles_collection.insert_many(mapped)
                out = {"inserted_count": len(inserted.inserted_ids)}
            elif isinstance(mapped, dict):
                vehicles_collection.delete_many({})
                inserted = vehicles_collection.insert_one(mapped)
                mapped["_id"] = str(inserted.inserted_id)
                out = mapped
            else:
                return error_response("Formato inesperado de datos mapeados", 502)
        except Exception:
            logger.exception("Error insertando listings en Mongo")
            return error_response("Error guardando listings", 500)

        return jsonify(serialize(out)), 200
    except requests.RequestException:
        logger.exception("Fallo de comunicacion con AutoDev")
        return error_response("Fallo de comunicacion con AutoDev", 502)

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
        data = response.json().get("data", {})
        return jsonify(serialize(data.get("retail", []))), 200
    except requests.RequestException:
        logger.exception("Fallo de comunicacion con AutoDev (fotos)")
        return error_response("Fallo de comunicacion con AutoDev", 502)

# ----------------------------
# DOCUMENTACIÓN
# ----------------------------
@app.route("/api")
def index():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    return send_from_directory(base_dir, "DriveMatrix API v1 – Documentación para Developers.html")

# ----------------------------
# REDIRECCION
# ----------------------------
@app.route('/<path:any_path>')
def catch_all(any_path):
    return redirect(url_for('index'))

@app.route('/')
def root():
    return redirect(url_for('index'))

# ----------------------------
# INICIALIZACIÓN
# ----------------------------
if __name__ == "__main__":
    print("Backend corriendo en puerto 5000.")
    app.run(debug=True, host="0.0.0.0", port=5000)