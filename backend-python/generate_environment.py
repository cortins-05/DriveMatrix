import os
from pathlib import Path

ANGULAR_ENV_PATH = Path("/app/frontend-angular/src/environments/environment.ts")

# Leer variables de entorno
PIXABAY_API_KEY = os.getenv("PIXABAY_API_KEY", "")
MAPBOX_API_KEY = os.getenv("MAPBOX_API_KEY", "")

# Contenido que siempre vamos a escribir
content = f"""
export const environment = {{
  production: false,
  pixabayApiKey: '{PIXABAY_API_KEY}',
  mapboxApiKey: '{MAPBOX_API_KEY}'
}};
""".strip()

# Crear directorios si no existen
ANGULAR_ENV_PATH.parent.mkdir(parents=True, exist_ok=True)

# Sobrescribir siempre
ANGULAR_ENV_PATH.write_text(content, encoding="utf-8")
print("environment.ts generado correctamente")
