# DriveMatrix

## Descripción General del Proyecto

DriveMatrix es una plataforma integral de comercio electrónico especializada en la venta de vehículos. Implementa un frontend moderno en Angular con un backend robusto en Flask y persistencia de datos en MongoDB. La aplicación proporciona funcionalidades completas de e-commerce incluyendo catálogo de vehículos, gestión de carrito, lista de deseos, historial de compras y sistema de valoraciones.

![COLOR1](/photos/image.png)
![COLOR2](/photos/image2.png)

![LIST](/photos/image3.png)
![PER_VEHICLE](/photos/image4.png)
![SEARCH_VEHICLE](/photos/image6.png)

![About](/photos/image5.png)



### Características Principales

- Autenticación y autorización mediante JWT.
- Catálogo dinámico de vehículos con búsqueda y filtrado avanzado.
- Gestión de carrito de compras persistente.
- Lista de deseos por usuario.
- Historial de compras y seguimiento de pedidos.
- Sistema de valoraciones y reseñas de usuarios.
- Integración con Mapbox para geolocalización.
- Integración con Pixabay para obtención de imágenes de vehículos.
- Interfaz responsiva y profesional.

---

## Requisitos Previos

Antes de comenzar la instalación y despliegue del proyecto, asegúrate de contar con:

### Software Requerido

- **Docker**: versión 20.10 o superior con Docker Compose 1.29+.
- **Node.js**: versión 18.x o superior.
- **npm**: versión 9.x o superior (incluido con Node.js).
- **Angular CLI**: versión 17.x o superior (se instala con `npm install -g @angular/cli`).

### Credenciales de APIs Externas

Para el funcionamiento completo del proyecto se requieren las siguientes claves de API:

- **Mapbox**: Clave de acceso para servicios de geolocalización y mapas.
- **Pixabay**: Token de API para obtención de imágenes.

> **Nota**: Estas credenciales deben ser solicitadas en los portales oficiales de cada servicio y configuradas en el archivo `.env` del proyecto.

---

## Instalación y Despliegue

### Paso 1: Configuración del Archivo de Entorno

1. En la raíz del proyecto, localiza el archivo `.env-example`.
2. Crea una copia de este archivo y nómbralo `.env`:

```bash
cp .env-example .env
```

3. Abre el archivo `.env` con tu editor de texto preferido y completa todas las claves de las APIs:

```
MAPBOX_API_KEY=tu_clave_mapbox_aqui
PIXABAY_API_KEY=tu_clave_pixabay_aqui
MONGODB_URI=mongodb://usuario:contraseña@localhost:27017/driveMatrix
JWT_SECRET=tu_secreto_jwt_aqui
```

⚠️ **ADVERTENCIA CRÍTICA**: Si el archivo `.env` no está configurado correctamente con todas las claves de API requeridas, la aplicación no funcionará de manera óptima. Algunos servicios se desactivarán silenciosamente.

⚠️ **ADVERTENCIA DE SEGURIDAD**: Nunca subas el archivo `.env` a control de versiones (Git). Este archivo contiene información sensible y credenciales privadas.

### Paso 2: Despliegue de Servicios con Docker Compose

1. Accede al directorio de configuración de Docker:

```bash
cd ./docker
```

2. Inicia todos los servicios en modo desatendido (background):

```bash
docker-compose up -d
```

Este comando iniciará:

- **MongoDB**: Base de datos principal (puerto 27017).
- **Mongo Express**: Interfaz web para administración de MongoDB (puerto 8081).
- **Backend Flask**: API REST (puerto 5000).

### Paso 3: Instalación de Dependencias del Frontend

1. Accede al directorio del frontend Angular:

```bash
cd ./frontend-angular
```

2. Instala todas las dependencias del proyecto:

```bash
npm install
```

Este proceso descargará e instalará todos los paquetes necesarios definidos en `package.json`.

### Paso 4: Ejecución del Proyecto

Una vez completados los pasos anteriores, inicia el servidor de desarrollo de Angular:

```bash
ng serve -o
```

**Desglose de la instrucción**:

- `ng serve`: Inicia el servidor de desarrollo de Angular.
- `-o` (u `--open`): Abre automáticamente la aplicación en tu navegador predeterminado en `http://localhost:4200`.

---

## Configuración de Entorno

### Variables de Entorno Obligatorias

El archivo `.env` debe contener las siguientes variables mínimas:


| Variable          | Descripción                         | Ejemplo                                 |
| ----------------- | ------------------------------------ | --------------------------------------- |
| `MAPBOX_API_KEY`  | Clave de acceso a la API de Mapbox   | `pk.eyJ1...`                            |
| `PIXABAY_API_KEY` | Token de autenticación de Pixabay   | `xxxxxxxxxxxxx`                         |
| `MONGODB_URI`     | Cadena de conexión a MongoDB        | `mongodb://localhost:27017/driveMatrix` |
| `JWT_SECRET`      | Clave secreta para firmar tokens JWT | `tu_secreto_muy_seguro`                 |

### Verificación de Configuración

Después de configurar el archivo `.env`, verifica que:

1. El archivo está en la raíz del proyecto.
2. Todas las variables obligatorias contienen valores válidos.
3. Las claves de API están activas y no expiradas.
4. La configuración de MongoDB sea accesible en la red del contenedor.

---

## Ejecución del Proyecto

### Ejecución Completa

Para ejecutar el proyecto de forma completa y correcta, sigue estos pasos en orden:

1. **Iniciar contenedores Docker**:

   ```bash
   cd ./docker
   docker-compose up -d
   ```
2. **Instalar dependencias del frontend**:

   ```bash
   cd ./frontend-angular
   npm install
   ```
3. **Iniciar servidor de desarrollo**:

   ```bash
   ng serve -o
   ```
4. **Acceso a la aplicación**:

   - Frontend: `http://localhost:4200`
   - Backend API: `http://localhost:5000`
   - Mongo Express: `http://localhost:8081`

### Detener la Aplicación

Para detener completamente el proyecto:

```bash
# Detener los contenedores Docker
cd ./docker
docker-compose down

# Detener el servidor Angular (Ctrl + C en la terminal)
```

---

## Notas Importantes

### Requisitos Críticos

- ⚠️ El archivo `.env` **DEBE** estar completamente configurado antes de ejecutar cualquier comando Docker.
- ⚠️ Las claves de API de Mapbox y Pixabay son **OBLIGATORIAS** para el funcionamiento correcto de ciertas funcionalidades.
- ⚠️ Docker y Docker Compose deben estar en ejecución en tu máquina.

### Puntos de Integración

- El frontend Angular se conecta al backend Flask a través de la URL configurada en los servicios de Angular.
- Todos los servicios (Frontend, Backend, Database) deben estar activos simultáneamente para funcionamiento óptimo.
- MongoDB almacena todos los datos de usuarios, vehículos, compras y valoraciones.

### Solución de Problemas Comunes

**Problema**: "No se puede conectar a MongoDB"

- **Solución**: Verifica que Docker Compose está ejecutándose: `docker-compose ps`

**Problema**: "API key de Mapbox no válida"

- **Solución**: Revisa que la clave en `.env` sea correcta y esté activa en tu cuenta de Mapbox.

**Problema**: "CORS error en el navegador"

- **Solución**: Asegúrate de que el backend está ejecutándose en `http://localhost:5000`

**Problema**: "ng: comando no encontrado"

- **Solución**: Instala Angular CLI globalmente: `npm install -g @angular/cli`

### Seguridad

- Nunca compartas tu archivo `.env` o sus credenciales.
- Mantén actualizadas las dependencias: `npm update`
- Utiliza contraseñas seguras para las credenciales de API.
- En producción, utiliza un gestor de secretos (p. ej., AWS Secrets Manager, HashiCorp Vault).

### Información de Contacto y Soporte

Para reportar problemas o sugerencias sobre el proyecto, contacta al equipo de desarrollo.

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
