# 🚗 DriveMatrix

Plataforma moderna de comercio electrónico para vehículos con frontend en Angular y backend en Flask, persistencia en MongoDB y orquestación opcional con Docker Compose. Este README explica la arquitectura, requisitos, configuración de variables de entorno y cómo poner todo en marcha sin exponer ninguna clave privada.

---

## Índice

- Descripción general
- Características
- Arquitectura
- Tecnologías
- Requisitos
- Configuración y variables
- Puesta en marcha (Docker y local)
- Estructura del proyecto
- API (resumen práctico)
- Seguridad y buenas prácticas
- Problemas comunes (Troubleshooting)

---

## Descripción general

DriveMatrix es una plataforma de e‑commerce orientada a catálogo de vehículos: búsqueda y filtrado, ficha de vehículo, carrito, lista de deseos, compras, perfil de usuario y valoraciones. El frontend consume una API REST en Flask que gestiona autenticación JWT, compras y operaciones con MongoDB.

### Características

- Autenticación JWT y validación de sesión.
- Catálogo y ficha de vehículos con imágenes y mapas.
- Carrito y lista de deseos por usuario.
- Historial de compras.
- Valoraciones por usuario y por vehículo (índice único).
- Integraciones externas: Mapbox (geocodificación inversa) y Pixabay (imágenes).

---

## Arquitectura

Frontend Angular (puerto 4200) ↔ API Flask (puerto 5000) ↔ MongoDB (puerto 27017)

- CORS del backend permite origen `http://localhost:4200`.
- Mongo Express opcional para administración en `http://localhost:8081`.

---

## Tecnologías

- Frontend: Angular 20, TypeScript, RxJS, TailwindCSS, Mapbox GL, Swiper, FontAwesome.
- Backend: Flask, PyMongo, PyJWT, bcrypt, Flask‑CORS.
- Base de datos: MongoDB.
- DevOps: Docker y Docker Compose (servicios: mongo, mongo‑express, backend).

---

## Requisitos

- Node.js 18+ y npm.
- Python 3.11+ y pip.
- Docker y Docker Compose (opcional, recomendado para backend y DB).

---

## Configuración y variables

Nunca incluyas claves privadas en el repositorio. Define las variables de entorno de forma local o en tu sistema CI/CD.

### Backend (Flask)

Variables usadas por [backend-python/main.py](backend-python/main.py):

- `MONGO_URI`: cadena de conexión a MongoDB. Ejemplo en Docker: `mongodb://admin:1234@mongo:27017/`.
- `JWT_SECRET`: clave para firmar tokens JWT.
- `AUTODEV_API_KEY` (opcional, si aplicase).
- `PIXABAY_API_KEY` (si el backend la necesitara).
- `MAPBOX_API_KEY` (si el backend la necesitara).

En Docker, el servicio `backend` hereda variables desde el archivo `.env` del directorio [docker](docker/docker-compose.yml). Puedes definir:

```env
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=1234
MONGO_URI=mongodb://admin:1234@mongo:27017/
JWT_SECRET=una_clave_muy_segura_y_larga
```

### Frontend (Angular)

Los servicios consumen claves mediante `process.env`:

- `MAPBOX_API_KEY` en [frontend-angular/src/app/core/services/mapBox.service.ts](frontend-angular/src/app/core/services/mapBox.service.ts).
- `PIXABAY_API_KEY` en [frontend-angular/src/app/core/services/pixabay.service.ts](frontend-angular/src/app/core/services/pixabay.service.ts).

Para desarrollo en Windows (PowerShell), define las variables en la misma sesión antes de arrancar Angular:

```powershell
$env:MAPBOX_API_KEY="TU_MAPBOX_KEY"; $env:PIXABAY_API_KEY="TU_PIXABAY_KEY"; npm start
```

En Linux/macOS (bash):

```bash
MAPBOX_API_KEY=TU_MAPBOX_KEY PIXABAY_API_KEY=TU_PIXABAY_KEY npm start
```

Si deseas fijarlas permanentemente, usa un gestor seguro de secretos o un `.env` fuera del control de versiones y configura tu entorno para inyectarlas al proceso de build.

---

## Puesta en marcha

### Opción A: Con Docker (recomendado para backend y DB)

1) Arranca la base de datos y el backend:

```bash
cd docker
docker-compose up -d
```

Esto levanta:

- MongoDB en `localhost:27017`.
- Mongo Express en `http://localhost:8081`.
- Backend Flask en `http://localhost:5000`.

2) Instala y ejecuta el frontend:

```bash
cd ../frontend-angular
npm install
# Define tus variables (ver sección de frontend)
npm start
```

La app web estará en `http://localhost:4200`.

### Opción B: Local sin Docker

Backend:

```bash
cd backend-python
pip install -r requirements.txt
# Exporta variables de entorno, por ejemplo:
# Windows PowerShell
$env:MONGO_URI="mongodb://localhost:27017/"; $env:JWT_SECRET="clave_super_segura"; python main.py
```

Frontend:

```bash
cd frontend-angular
npm install
# Define MAPBOX_API_KEY y PIXABAY_API_KEY (ver arriba)

```

---

## Estructura del proyecto

Ver carpetas y archivos principales:

- Backend: [backend-python/main.py](backend-python/main.py), [backend-python/interfaces.py](backend-python/interfaces.py), [backend-python/requirements.txt](backend-python/requirements.txt), [backend-python/dockerfile](backend-python/dockerfile).
- Frontend: configuración en [frontend-angular/angular.json](frontend-angular/angular.json), scripts en [frontend-angular/package.json](frontend-angular/package.json) y bootstrap en [frontend-angular/src/main.ts](frontend-angular/src/main.ts).
- Docker: [docker/docker-compose.yml](docker/docker-compose.yml).

---

## API (resumen práctico)

El backend expone endpoints bajo `/api`. Algunos relevantes definidos en [backend-python/main.py](backend-python/main.py):

- Salud de la API: `GET /` → "API WORKS!!!".
- Documentación local: `GET /api` → sirve guía rápida HTML del backend.

Autenticación y usuarios:

- `POST /api/user/create` → registro (nombre, email, password).
- `POST /api/user/login` → login (email, password) y devuelve JWT.
- `GET /api/user/checkToken` → valida JWT (header `Authorization: Bearer <token>`).
- `POST /api/user/show` → muestra usuario por `emailOrId`.
- `PATCH /api/user/update/<user_id>` → actualiza usuario (requiere JWT).
- `DELETE /api/user/delete` → elimina usuario autenticado.

Compras:

- `POST /api/purchase/create` → crea compra (vehículo por VIN, requiere JWT).
- `GET /api/purchase/show` → lista compras del usuario (requiere JWT).

Wishlist (extracto):

- `POST /api/user/wishlist/add` → añade por VIN (requiere JWT).

Nota: hay más rutas relacionadas con vehículos y valoraciones; consulta `GET /api` para la guía HTML incluida.

Ejemplo de login:

```bash
curl -X POST http://localhost:5000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

---

## Seguridad y buenas prácticas

- No subir claves privadas al repositorio.
- Usar `JWT_SECRET` suficientemente largo, aleatorio y rotarlo periódicamente.
- Limitar CORS a orígenes necesarios (por defecto `http://localhost:4200`).
- Almacenar contraseñas con bcrypt (ya implementado).
- Índices únicos en Mongo para emails y valoraciones por usuario/vehículo (ya implementados).

---

## Problemas comunes (Troubleshooting)

- `process.env` en Angular: asegúrate de definir `MAPBOX_API_KEY` y `PIXABAY_API_KEY` en la misma sesión de terminal antes de `npm start`. Si no aparecen, verifica el shell que usas y vuelve a lanzar el comando de inicio.
- Conexión Mongo en Docker: confirma que `MONGO_URI` apunta a `mongo` (nombre del servicio) dentro de la red de Docker: `mongodb://admin:1234@mongo:27017/`.
- CORS: si cambias el puerto u origen del frontend, ajusta CORS en [backend-python/main.py](backend-python/main.py).

---

## Comandos útiles

Frontend:

```bash
npm start
npm run build
npm test
```

Backend:

```bash
python backend-python/main.py
```

Docker:

```bash
cd docker
docker-compose up -d
docker-compose down
docker-compose logs -f backend
```

---

Este README resume la configuración sin exponer secretos. Si quieres, puedo añadir plantillas `.env.example` separadas para frontend y backend.
### Flujo de Usuario Típico
