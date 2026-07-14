# MechSync Frontend

Frontend de MechSync, la aplicación web para la gestión de talleres especializados en transmisiones automáticas.

## Stack

- React 19
- Vite 6
- JavaScript
- HTML y CSS
- Fetch API para comunicación HTTP

## Requisitos

- Node.js 20 o superior
- npm 10 o superior
- Backend de MechSync disponible de forma local o remota

## Instalación

```bash
npm install
```

## Comandos

```bash
# Servidor de desarrollo
npm run dev

# Build de producción
npm run build

# Vista previa del build
npm run preview
```

Vite sirve el entorno de desarrollo normalmente en `http://localhost:5173` y la vista previa en `http://localhost:4173`.

## Variables de entorno

Copia `.env.example` como `.env` y configura la URL base de la API:

```dotenv
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

Para conectarte con el backend desplegado en EC2:

```dotenv
VITE_API_BASE_URL=http://3.212.179.142:8080/api/v1
```

La API EC2 actual está disponible en `http://3.212.179.142:8080/api/v1`.

El archivo `.env` es local y está ignorado por Git. No debe subirse al repositorio ni contener tokens, contraseñas o secretos. `.env.example` sí se conserva como plantilla rastreable.

Después de cambiar una variable de entorno, reinicia el servidor de Vite.

## Estructura inicial

```text
mechsync-frontend/
├── .env.example
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── App.jsx
    ├── index.css
    ├── main.jsx
    ├── features/
    │   └── health/
    │       └── healthService.js
    └── shared/
        └── api/
            └── apiClient.js
```

`apiClient.js` centraliza la URL base, encabezados JSON, respuestas sin contenido, errores de API y soporte opcional para tokens Bearer. La pantalla inicial solo consume los endpoints públicos de health; la autenticación y los módulos de negocio se incorporarán en fases posteriores.
