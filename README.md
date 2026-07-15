# MechSync Frontend

Frontend de MechSync, la aplicación web para la gestión de talleres especializados en transmisiones automáticas.

## Stack

- React 19
- Vite 6
- React Router
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

## Rutas públicas disponibles

- `/`: landing pública de MechSync.
- `/login`: inicio de sesión conectado a `POST /auth/login`.
- `/register`: formulario visual de registro.

El backend todavía no ofrece un endpoint público de registro. La ruta `/register` no realiza
peticiones y muestra una indicación para solicitar la cuenta a un administrador. No debe
conectarse a `POST /users`, porque ese endpoint es administrativo y requiere autorización.

## Rutas administrativas disponibles

- `/admin/customers`: listado paginado conectado a `GET /customers`.
- `/admin/customers/new`: alta administrativa mediante `POST /users` y después `POST /customers`.
- `/admin/customers/:id`: ficha de Customer enriquecida con su User asociado.
- `/admin/vehicles`: listado paginado conectado a `GET /vehicles`.
- `/admin/vehicles/new`: alta mediante `POST /vehicles` para un Customer existente.
- `/admin/vehicles/:id`: detalle conectado a `GET /vehicles/{id}`.
- `/admin/vehicle-intakes/new`: alta conectada a vehículos, estados, técnicos y `POST /vehicle-intakes`.

Ambas rutas requieren una sesión con JWT. Si no existe token local, la navegación redirige a
`/login`. Los endpoints de Users y Customers requieren un usuario con rol `ADMINISTRADOR`; la
autorización definitiva siempre la aplica Spring Security en el backend.

La contraseña temporal del formulario de alta se envía únicamente durante `POST /users`: no se
guarda en `localStorage`, no se registra en consola y no forma parte de la tabla de clientes.

El alta de Vehicle Intake obtiene `statusId` desde
`GET /catalogs/statuses?context=VEHICLE_INTAKES` y nunca hardcodea identificadores. El selector de
técnicos consume `GET /technicians`; si la respuesta está vacía, el ingreso puede registrarse sin
asignación y `technicianId` se omite del request.

`/admin/vehicle-intakes/new` representa exclusivamente el formulario de **Nuevo ingreso**. Todavía
no existe una ruta frontend `/admin/vehicle-intakes` para gestión, listado o edición de ingresos;
esa vista se implementará posteriormente como una funcionalidad independiente.

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
