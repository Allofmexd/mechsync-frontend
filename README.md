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
- `/admin/vehicle-intakes`: gestión paginada conectada a `GET /vehicle-intakes`.
- `/admin/vehicle-intakes/new`: alta conectada a vehículos, estados, técnicos y `POST /vehicle-intakes`.
- `/admin/vehicle-intakes/:id`: detalle conectado a `GET /vehicle-intakes/{id}`.
- `/admin/work-orders`: listado de órdenes de servicio conectado a `GET /work-orders`.
- `/admin/work-orders/new`: creación conectada a `POST /work-orders`.
- `/admin/work-orders/:id`: detalle de Work Order e historial real de cotizaciones.
- `/admin/work-orders/:workOrderId/revisions`: revisión vigente, aprobación final e historial.
- `/admin/work-orders/:workOrderId/revisions/:revisionId`: detalle de snapshot versionado.
- `/admin/quotations/new`: creación real de Work Order Revision.
- `/admin/jobs`: placeholder de trabajos realizados, pendiente de API.

Todas las rutas administrativas requieren una sesión con JWT y rol `ADMINISTRADOR`. Si no existe token local, la navegación redirige a
`/login`. Los endpoints de Users y Customers requieren un usuario con ese rol; la
autorización definitiva siempre la aplica Spring Security en el backend.

La contraseña temporal del formulario de alta se envía únicamente durante `POST /users`: no se
guarda en `localStorage`, no se registra en consola y no forma parte de la tabla de clientes.

El alta de Vehicle Intake obtiene `statusId` desde
`GET /catalogs/statuses?context=VEHICLE_INTAKES` y nunca hardcodea identificadores. El selector de
técnicos consume `GET /technicians`; si la respuesta está vacía, el ingreso puede registrarse sin
asignación y `technicianId` se omite del request.

`/admin/vehicle-intakes/new` representa exclusivamente el formulario de **Nuevo ingreso** y
`/admin/vehicle-intakes` es la gestión/listado independiente. El listado usa los catálogos reales
para mostrar nombres de estado y enriquece vehículos y técnicos únicamente mediante endpoints
existentes.

La creación de Work Orders obtiene `vehicleIntakeId`, `technicianId` y `statusId` de respuestas
reales. El contrato actual exige que exista un técnico y que subtotal, IVA y total se capturen de
forma explícita; el frontend no hardcodea identificadores ni inventa reglas financieras.

## Cotizaciones versionadas

El frontend consume Work Order Revisions exclusivamente bajo `/api/v1`. No existe `/api/v2`:
“Work Orders v2” identifica el modelo interno de snapshots, no una versión pública de la API.

La vista `/admin/quotations/new` selecciona una Work Order y un técnico reales, permite capturar
líneas snapshot personalizadas sin `serviceId`/`partId`, calcula subtotal, IVA y total como ayuda
visual y envía los importes para que el backend los vuelva a calcular y validar. Los catálogos
productivos de servicios y piezas siguen pendientes; por ello no se inventan IDs y las listas pueden
quedar vacías conforme al contrato backend.

El detalle e historial permiten enviar, aprobar, rechazar y cancelar según el estado de la revisión.
La aprobación solicita nombre del aceptante y código de método; no hardcodea IDs ni simula éxito.
Los endpoints `current` y `final-approved` distinguen la revisión vigente de la aprobación final.

Esta integración requiere que el entorno backend tenga aplicadas las migraciones de database/v2
`001`–`005` y sus seeds. Mientras AWS u otro entorno no las tenga, los errores `5xx` de estos
endpoints se muestran como infraestructura pendiente y el formulario no informa éxito.

## Rutas del técnico

- `/technician`: panel con métricas derivadas de las Work Orders asignadas.
- `/technician/dashboard`: alias que redirige al panel técnico.
- `/technician/work-orders`: listado compacto de órdenes propias.
- `/technician/assigned-work-orders`: listado asignado con filtros por estado, fecha, placa o folio.
- `/technician/work-orders/:id`: detalle seguro de una orden asignada.

Estas rutas requieren JWT y rol `TECNICO`. El login utiliza los roles devueltos por `POST /auth/login`
para dirigir al usuario a su sección y `ProtectedRoute` confirma la identidad con `GET /auth/me`.

La asociación temporal se resuelve así:

1. `GET /auth/me` proporciona el `id` del usuario autenticado.
2. `GET /technicians` permite localizar el registro cuyo `userId` coincide.
3. `GET /work-orders` se pagina completamente y se filtra en cliente por `technicianId`.

Este filtrado evita presentar órdenes ajenas como propias, pero no sustituye autorización ni
filtrado backend. Es temporal hasta que exista `GET /work-orders/assigned-to-me`; el endpoint actual
todavía transmite al navegador del técnico el listado general autorizado por Spring Security.
Work Orders son planificación/cotización y no equivalen a Jobs o trabajo ejecutado.

## Endpoints pendientes

Estas rutas son contratos candidatos documentados como brecha. No se consumen desde el frontend
hasta que exista una implementación productiva en el backend.

### Trabajos realizados

- `GET /jobs`
- `GET /jobs/{id}`
- `POST /jobs`
- `PUT /jobs/{id}`
- `PATCH /jobs/{id}/status`

### Reportes de servicio

- `GET /service-reports`
- `GET /service-reports/{id}`
- `POST /service-reports`

### Experiencia del técnico

- `GET /technicians/me`
- `GET /work-orders/assigned-to-me`
- `GET /technician/dashboard`
- `PATCH /work-orders/{id}/status`
- `PATCH /work-orders/{id}/start`
- `PATCH /work-orders/{id}/complete`
- `GET /jobs/assigned-to-me`
- `GET /service-reports/technician/me`

Las acciones de iniciar trabajo, registrar diagnóstico, agregar observaciones, solicitar refacciones
y generar reportes permanecen deshabilitadas. No se simula éxito ni se reutiliza Work Orders como
si fuera un Job.

También permanecen pendientes catálogos productivos de servicios y piezas. Las cotizaciones usan el
payload embebido de snapshots ya soportado; Jobs, Service Reports y PDF continúan deshabilitados y
no simulan operaciones exitosas.

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

`apiClient.js` centraliza la URL base, encabezados JSON, respuestas sin contenido, errores de API y soporte para tokens Bearer. Los servicios de cada feature reutilizan este cliente y las rutas administrativas quedan protegidas por el mecanismo común de sesión.
