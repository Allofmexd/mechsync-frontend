# MechSync Frontend

Aplicación React/Vite para la operación administrativa y técnica de MechSync.

## Stack y comandos

- React 19, Vite 6 y React Router.
- Fetch API con JWT Bearer.
- Node.js 20+ y npm 10+.

```bash
npm install
npm run dev
npm run build
npm run preview
```

El proyecto no tiene scripts `lint` ni `test` configurados actualmente.

## Configuración

La única URL base se obtiene de `VITE_API_BASE_URL`. En producción se usa el proxy `/api/v1`; no
se hardcodean IPs ni se consume `/api/v2`.

```dotenv
VITE_API_BASE_URL=/api/v1
```

Los archivos `.env` y `.env.local` son locales y no deben versionarse.

## Rutas públicas

- `/`: presentación del producto; la tabla de seguimiento está etiquetada como ejemplo ilustrativo.
- `/login`: autenticación real mediante `POST /auth/login`.
- `/register`: información para solicitar una cuenta. No contiene un formulario de registro porque
  no existe un endpoint público para esa operación.

No existe tracking público, recuperación de contraseña ni portal CLIENTE en este MVP.

## Administración

Todas estas rutas requieren rol `ADMINISTRADOR`:

- Usuarios: `/admin/users`, `/admin/users/new`, `/admin/users/:id`.
- Clientes: `/admin/customers`, `/admin/customers/new`, `/admin/customers/:id`.
- Vehículos: `/admin/vehicles`, `/admin/vehicles/new`, `/admin/vehicles/:id`.
- Técnicos: `/admin/technicians`, `/admin/technicians/new`, `/admin/technicians/:id`.
- Ingresos: `/admin/vehicle-intakes`, `/admin/vehicle-intakes/new`, `/admin/vehicle-intakes/:id`.
- Work Orders: `/admin/work-orders`, `/admin/work-orders/new`, `/admin/work-orders/:id`.
- Cotizaciones versionadas: historial, detalle y `/admin/quotations/new`.
- Jobs: listado, creación, detalle, workflow y líneas reales.
- Service Reports: listado, creación desde Job completado, detalle y descarga PDF.
- Catálogos: `/admin/catalogs`, lectura de servicios, piezas, unidades asociadas y estados.

`/admin` redirige a `/admin/users`. Los catálogos son de solo lectura porque el backend no expone
operaciones de administración. La creación y edición de perfiles Technician usan usuarios reales y
el catálogo read-only `GET /specialties`; no se capturan IDs manualmente.

Las cotizaciones permiten seleccionar servicios y piezas reales o capturar un concepto personalizado.
El backend conserva el snapshot, recalcula importes y controla el workflow inmutable. El PDF de
cotización no forma parte de esta versión.

## Portal técnico

Estas rutas requieren rol `TECNICO`:

- `/technician`: dashboard con datos autorizados.
- `/technician/work-orders` y `/technician/work-orders/:id`.
- `/technician/jobs` y `/technician/jobs/:id`.
- `/technician/service-reports` y `/technician/service-reports/:id`.

Los listados consumen exclusivamente `/assigned-to-me`. Los detalles, líneas reales y PDF validan
pertenencia en backend. El frontend no envía `technicianId`, no descarga listados globales y no
expone mutaciones administrativas.

Los alias `/technician/dashboard` y `/technician/assigned-work-orders` redirigen a sus rutas vigentes.

## Seguridad y errores

- `ProtectedRoute` valida identidad con `GET /auth/me`.
- Una respuesta `401` a una llamada autenticada limpia la sesión y vuelve a login.
- `403`, `404`, `409` y `500` se presentan con mensajes controlados.
- No se almacenan contraseñas, hashes ni datos simulados en el navegador.
- La autorización y el aislamiento IDOR siempre pertenecen al backend.

## Fuera de esta versión

Portal CLIENTE, registro público, tracking público, recuperación de contraseña, PDF de cotización,
adjuntos, inventario, proveedores, pagos, correo, S3, firma digital y analítica avanzada.

Consulta [docs/implementation/view-mapping.md](docs/implementation/view-mapping.md) para el inventario
de vistas y endpoints.
