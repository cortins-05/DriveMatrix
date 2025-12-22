# 🚗 DriveMatrix

<div align="center">

**Plataforma moderna de comercio electrónico para vehículos**

![Angular](https://img.shields.io/badge/Angular-20.3-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=for-the-badge&logo=flask&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8.2-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)

</div>

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características](#-características)
- [Tecnologías](#️-tecnologías)
- [Arquitectura](#-arquitectura)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#️-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Endpoints](#-api-endpoints)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## 🎯 Descripción

**DriveMatrix** es una plataforma completa de comercio electrónico especializada en la compra y venta de vehículos. Ofrece una experiencia de usuario moderna e intuitiva con funcionalidades avanzadas como búsqueda inteligente, carrito de compras, lista de deseos, sistema de valoraciones y visualización geográfica mediante mapas interactivos.

### ✨ Características Principales

- 🔐 **Autenticación y Autorización**: Sistema completo de registro, login y gestión de sesiones con JWT
- 🚙 **Catálogo de Vehículos**: Búsqueda y filtrado avanzado de vehículos con múltiples criterios
- 🛒 **Carrito de Compras**: Gestión de vehículos seleccionados para compra
- ❤️ **Lista de Deseos**: Guarda tus vehículos favoritos para consultarlos después
- ⭐ **Sistema de Valoraciones**: Califica y revisa vehículos (un voto por usuario por vehículo)
- 📍 **Mapas Interactivos**: Visualización de ubicación de vehículos con MapBox
- 📱 **Diseño Responsive**: Interfaz adaptativa con TailwindCSS
- 🖼️ **Galería de Imágenes**: Integración con Pixabay para imágenes de vehículos
- 📊 **Panel de Usuario**: Gestión de perfil, historial de compras y más
- 🎨 **UI Moderna**: Componentes reutilizables con Swiper para carruseles

---

## 🛠️ Tecnologías

### Frontend
- **Framework**: Angular 20.3
- **Lenguaje**: TypeScript 5.0
- **Estilos**: TailwindCSS 4.1
- **Mapas**: MapBox GL 3.17
- **Carruseles**: Swiper 12.0
- **Iconos**: FontAwesome 7.1
- **Gestión de Estado**: RxJS 7.8

### Backend
- **Framework**: Flask (Python)
- **Base de Datos**: MongoDB 8.2
- **Autenticación**: JWT (PyJWT)
- **Hashing**: bcrypt
- **CORS**: Flask-CORS

### DevOps & Herramientas
- **Containerización**: Docker & Docker Compose
- **Gestión de Paquetes**: npm, pip
- **Administración BD**: Mongo Express

---

## 🏗️ Arquitectura

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  Angular App    │────────▶│   Flask API     │────────▶│    MongoDB      │
│  (Puerto 4200)  │  HTTP   │  (Puerto 5000)  │   DB    │  (Puerto 27017) │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
        │                            │                           │
        │                            │                           │
        ▼                            ▼                           ▼
  TailwindCSS              JWT Auth + CORS            Mongo Express (8081)
  MapBox GL                  bcrypt                    
  Swiper                   PyMongo                    
```

**Flujo de Datos:**
1. El usuario interactúa con la interfaz Angular
2. Las peticiones HTTP se envían al backend Flask
3. Flask valida tokens JWT y procesa la lógica de negocio
4. MongoDB almacena y recupera datos
5. Las respuestas JSON se devuelven al frontend
6. Angular actualiza la UI de forma reactiva

---

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (v18 o superior) y **npm**
- **Python** (v3.11 o superior) y **pip**
- **Docker** y **Docker Compose**
- **Git**

---

## 🚀 Instalación

### Opción 1: Usando Docker (Recomendado)

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/DriveMatrix.git
cd DriveMatrix
```

2. **Iniciar los servicios con Docker Compose**
```bash
cd docker
docker-compose up -d
```

Esto iniciará:
- MongoDB en `localhost:27017`
- Mongo Express en `localhost:8081`
- Backend Flask en `localhost:5000`

3. **Instalar dependencias del frontend**
```bash
cd ../frontend-angular
npm install
```

4. **Iniciar el servidor de desarrollo de Angular**
```bash
npm start
```

La aplicación estará disponible en `http://localhost:4200`

### Opción 2: Instalación Manual

#### Backend

1. **Navegar al directorio del backend**
```bash
cd backend-python
```

2. **Crear entorno virtual** (opcional pero recomendado)
```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

3. **Instalar dependencias**
```bash
pip install -r requirements.txt
```

4. **Configurar variables de entorno**
```bash
# Crear archivo .env
MONGO_URI=mongodb://admin:1234@localhost:27017/
JWT_SECRET=tu_clave_secreta_super_segura
```

5. **Ejecutar el servidor**
```bash
python main.py
```

#### Frontend

1. **Navegar al directorio del frontend**
```bash
cd frontend-angular
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Iniciar servidor de desarrollo**
```bash
npm start
```

---

## ⚙️ Configuración

### Variables de Entorno

**Backend** (`backend-python/.env`):
```env
MONGO_URI=mongodb://admin:1234@mongo:27017/
JWT_SECRET=una_clave_muy_segura_y_larga
```

**MongoDB** (docker-compose.yml):
```yaml
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=1234
```

### Puertos por Defecto

| Servicio | Puerto | URL |
|----------|--------|-----|
| Frontend (Angular) | 4200 | http://localhost:4200 |
| Backend (Flask) | 5000 | http://localhost:5000 |
| MongoDB | 27017 | mongodb://localhost:27017 |
| Mongo Express | 8081 | http://localhost:8081 |

---

## 💻 Uso

### Comandos Disponibles

#### Frontend
```bash
npm start          # Inicia el servidor de desarrollo
npm run build      # Compila la aplicación para producción
npm run watch      # Compila en modo desarrollo con hot-reload
npm test           # Ejecuta las pruebas unitarias
```

#### Backend
```bash
python main.py     # Inicia el servidor Flask
```

#### Docker
```bash
docker-compose up -d              # Inicia todos los servicios en segundo plano
docker-compose down               # Detiene todos los servicios
docker-compose logs -f backend    # Ver logs del backend
docker-compose restart backend    # Reinicia el backend
```

### Flujo de Usuario Típico

1. **Registro/Login**: Accede a `/login` para crear una cuenta o iniciar sesión
2. **Explorar Catálogo**: Navega a `/catalog` para ver todos los vehículos disponibles
3. **Buscar Vehículo**: Usa `/search` para filtrar por criterios específicos
4. **Ver Detalles**: Haz clic en un vehículo para ver su página detallada en `/vehicle`
5. **Agregar a Carrito/Wishlist**: Guarda vehículos de interés
6. **Realizar Compra**: Finaliza la compra desde `/cart`
7. **Revisar Compras**: Ve tu historial en `/purchases`
8. **Gestionar Perfil**: Actualiza tu información en `/profile`

---

## 📁 Estructura del Proyecto

```
DriveMatrix/
│
├── backend-python/                 # Backend Flask API
│   ├── main.py                     # Punto de entrada del servidor
│   ├── interfaces.py               # Definiciones de tipos y mapeos
│   ├── requirements.txt            # Dependencias Python
│   ├── dockerfile                  # Configuración Docker del backend
│   └── __pycache__/                # Caché de Python
│
├── docker/                         # Configuración Docker
│   └── docker-compose.yml          # Orquestación de servicios
│
├── frontend-angular/               # Aplicación Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/               # Módulo de autenticación
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth-page/
│   │   │   │   ├── guards/         # Guards de rutas
│   │   │   │   └── interfaces/
│   │   │   │
│   │   │   ├── core/               # Servicios y funcionalidades core
│   │   │   │   ├── interfaces/
│   │   │   │   ├── layout/         # Componentes de layout (navbar)
│   │   │   │   └── services/       # Servicios globales
│   │   │   │       ├── cart.service.ts
│   │   │   │       ├── mapBox.service.ts
│   │   │   │       ├── pixabay.service.ts
│   │   │   │       ├── valoration.service.ts
│   │   │   │       └── wishList.service.ts
│   │   │   │
│   │   │   ├── pages/              # Páginas/Vistas principales
│   │   │   │   ├── main-page/
│   │   │   │   ├── catalog-page/
│   │   │   │   ├── search-page/
│   │   │   │   ├── vehicle-page/
│   │   │   │   ├── cart-page/
│   │   │   │   ├── wishlist-page/
│   │   │   │   ├── purchases-page/
│   │   │   │   ├── profile-page/
│   │   │   │   └── about-page/
│   │   │   │
│   │   │   ├── shared/             # Componentes compartidos
│   │   │   │   └── components/
│   │   │   │       ├── carsTable/
│   │   │   │       ├── enlaceHover/
│   │   │   │       ├── mapBox/
│   │   │   │       ├── swiperCarousel/
│   │   │   │       └── valoration/
│   │   │   │
│   │   │   ├── app.config.ts       # Configuración de la app
│   │   │   ├── app.routes.ts       # Definición de rutas
│   │   │   └── app.ts              # Componente raíz
│   │   │
│   │   ├── index.html              # HTML principal
│   │   ├── main.ts                 # Bootstrap de Angular
│   │   └── styles.css              # Estilos globales
│   │
│   ├── public/                     # Recursos estáticos
│   │   ├── assets/
│   │   └── fonts/
│   │
│   ├── angular.json                # Configuración de Angular CLI
│   ├── package.json                # Dependencias frontend
│   ├── tsconfig.json               # Configuración TypeScript
│   └── tsconfig.app.json
│
├── package.json                    # Dependencias del proyecto raíz
└── README.md                       # Este archivo
```

---

## 🌐 API Endpoints

### Autenticación

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/user/create` | Registrar nuevo usuario | No |
| POST | `/api/user/login` | Iniciar sesión | No |
| GET | `/api/user/checkToken` | Validar token JWT | Sí |

### Usuarios

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/user/:id` | Obtener usuario por ID | Sí |
| PUT | `/api/user/:id` | Actualizar usuario | Sí |
| DELETE | `/api/user/:id` | Eliminar usuario | Sí |

### Vehículos

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/vehicles` | Listar todos los vehículos | No |
| GET | `/api/vehicles/:vin` | Obtener vehículo por VIN | No |
| POST | `/api/vehicles` | Crear nuevo vehículo | Sí |
| PUT | `/api/vehicles/:vin` | Actualizar vehículo | Sí |
| DELETE | `/api/vehicles/:vin` | Eliminar vehículo | Sí |

### Valoraciones

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/valorations` | Crear valoración | Sí |
| GET | `/api/valorations/:vin` | Obtener valoraciones de un vehículo | No |

### Compras

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/purchases` | Registrar compra | Sí |
| GET | `/api/purchases/user/:userId` | Historial de compras del usuario | Sí |

### Lista de Deseos

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/wishlist/add` | Agregar a lista de deseos | Sí |
| DELETE | `/api/wishlist/remove` | Quitar de lista de deseos | Sí |
| GET | `/api/wishlist` | Obtener lista de deseos | Sí |

### Carrito

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/cart/add` | Agregar al carrito | Sí |
| DELETE | `/api/cart/remove` | Quitar del carrito | Sí |
| GET | `/api/cart` | Obtener carrito | Sí |

**Ejemplo de Request:**
```bash
# Login
curl -X POST http://localhost:5000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Obtener vehículos (con token)
curl -X GET http://localhost:5000/api/vehicles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔒 Seguridad

- **Autenticación JWT**: Tokens con expiración configurable
- **Bcrypt**: Hash seguro de contraseñas
- **CORS**: Configurado para permitir solo orígenes autorizados
- **Guards de Ruta**: Protección de rutas sensibles en Angular
- **Validación**: Validación de datos tanto en frontend como backend
- **MongoDB**: Índices únicos para prevenir duplicados (email, user-vehicle ratings)

---

## 🧪 Testing

```bash
# Frontend
cd frontend-angular
npm test

# Backend
cd backend-python
pytest  # (si se configuran tests)
```

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. **Fork** el proyecto
2. Crea una **rama** para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. Abre un **Pull Request**

### Guía de Estilo

- **Frontend**: Seguir las convenciones de Angular y usar Prettier
- **Backend**: Seguir PEP 8 para Python
- **Commits**: Usar mensajes descriptivos en español o inglés

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 👥 Autores

- **Tu Nombre** - *Desarrollo Inicial* - [GitHub](https://github.com/tu-usuario)

---

## 🙏 Agradecimientos

- Angular Team por el excelente framework
- Flask & MongoDB por una combinación robusta de backend
- MapBox por las herramientas de mapeo
- Pixabay por el servicio de imágenes
- TailwindCSS por el sistema de diseño

---

## 📞 Contacto

¿Preguntas o sugerencias? Abre un [issue](https://github.com/tu-usuario/DriveMatrix/issues) o contáctanos en contacto@drivematrix.com

---

<div align="center">

**⭐ Si te gusta este proyecto, ¡dale una estrella en GitHub! ⭐**

Hecho con ❤️ por el equipo de DriveMatrix

</div>

Guía de despliegue de la app.

## **Necesario**

* Docker Instalado
* Angular + Dependencias Instaladas

## Pasos

### FrontEnd

1. Acceder a la carpeta `frontend-angular`
2. Ejecutar `npm install`
3. `ng serve -o`

### Backend/Docker

1. Acceder a la carpeta `docker`
2. Ejecutar `docker compose -d`
