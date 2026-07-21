# Mapeo de vistas del MVP

Estado verificado contra el router, los servicios frontend y los controllers backend disponibles.

| Ruta | Rol | Vista | API principal | Estado |
|---|---|---|---|---|
| `/` | Pública | Landing | Ninguna; contenido informativo | Completa |
| `/login` | Pública | Login | `POST /auth/login` | Completa |
| `/register` | Pública | Solicitud de acceso | Sin API pública | Informativa, no interactiva |
| `/admin` | ADMINISTRADOR | Entrada administrativa | Redirección a `/admin/users` | Completa |
| `/admin/users` | ADMINISTRADOR | Usuarios | `GET /users` | Completa |
| `/admin/users/new` | ADMINISTRADOR | Crear usuario | `POST /users` | Completa |
| `/admin/users/:id` | ADMINISTRADOR | Administrar usuario | GET/PUT, password y rol | Completa |
| `/admin/customers` | ADMINISTRADOR | Clientes | `GET /customers` | Completa |
| `/admin/customers/new` | ADMINISTRADOR | Crear cliente | `POST /users`, `POST /customers` | Completa |
| `/admin/customers/:id` | ADMINISTRADOR | Detalle de cliente | GET/PUT/DELETE Customer, GET User | Completa con relaciones disponibles |
| `/admin/vehicles` | ADMINISTRADOR | Vehículos | `GET /vehicles` | Completa |
| `/admin/vehicles/new` | ADMINISTRADOR | Crear vehículo | `POST /vehicles` | Completa |
| `/admin/vehicles/:id` | ADMINISTRADOR | Detalle de vehículo | GET/PUT/DELETE Vehicle | Completa |
| `/admin/technicians` | ADMINISTRADOR | Técnicos | `GET /technicians` | Completa |
| `/admin/technicians/new` | ADMINISTRADOR | Crear perfil | `GET /users`, `GET /specialties`, `GET/POST /technicians` | Completa |
| `/admin/technicians/:id` | ADMINISTRADOR | Detalle técnico | GET/PUT Technician y `GET /specialties` | Completa |
| `/admin/vehicle-intakes` | ADMINISTRADOR | Ingresos | `GET /vehicle-intakes` | Completa |
| `/admin/vehicle-intakes/new` | ADMINISTRADOR | Crear ingreso | Catálogos y `POST /vehicle-intakes` | Completa |
| `/admin/vehicle-intakes/:id` | ADMINISTRADOR | Detalle de ingreso | GET/PUT/DELETE Intake | Completa |
| `/admin/work-orders` | ADMINISTRADOR | Work Orders | `GET /work-orders` | Completa |
| `/admin/work-orders/new` | ADMINISTRADOR | Crear Work Order | Catálogos y `POST /work-orders` | Completa |
| `/admin/work-orders/:id` | ADMINISTRADOR | Detalle de Work Order | GET/PUT/DELETE y revisiones | Completa |
| `/admin/work-orders/:id/revisions` | ADMINISTRADOR | Historial de cotizaciones | Lista/current/final-approved | Completa |
| `/admin/work-orders/:id/revisions/:revisionId` | ADMINISTRADOR | Detalle de cotización | GET revisión | Completa; PDF de cotización fuera de versión |
| `/admin/quotations/new` | ADMINISTRADOR | Nueva cotización | Catálogos y POST revisión | Completa |
| `/admin/jobs` | ADMINISTRADOR | Jobs | `GET /jobs` | Completa |
| `/admin/jobs/new` | ADMINISTRADOR | Crear Job | Work Orders, revisión y `POST /jobs` | Completa |
| `/admin/jobs/:id` | ADMINISTRADOR | Detalle Job | Workflow, líneas y reporte | Completa |
| `/admin/service-reports` | ADMINISTRADOR | Reportes | `GET /service-reports` | Completa |
| `/admin/service-reports/:id` | ADMINISTRADOR | Detalle reporte | GET reporte y PDF | Completa |
| `/admin/catalogs` | ADMINISTRADOR | Catálogos | Services, Parts y Statuses | Completa, solo lectura |
| `/technician` | TECNICO | Dashboard | Perfil y listados `assigned-to-me` | Completa |
| `/technician/work-orders` | TECNICO | Mis órdenes | `GET /work-orders/assigned-to-me` | Completa |
| `/technician/work-orders/:id` | TECNICO | Orden propia | `GET /work-orders/{id}` y relaciones | Completa, solo lectura |
| `/technician/jobs` | TECNICO | Mis Jobs | `GET /jobs/assigned-to-me` | Completa |
| `/technician/jobs/:id` | TECNICO | Job propio | Job, servicios, piezas y reporte | Completa, solo lectura |
| `/technician/service-reports` | TECNICO | Mis reportes | `GET /service-reports/assigned-to-me` | Completa |
| `/technician/service-reports/:id` | TECNICO | Reporte propio | GET reporte y PDF | Completa, solo lectura |

## Redirecciones compatibles

- `/technician/dashboard` → `/technician`.
- `/technician/assigned-work-orders` → `/technician/work-orders`.

## Límites confirmados del backend

- No hay CRUD de servicios, piezas, estados, unidades o especialidades; especialidades dispone de lectura administrativa.
- No hay PDF de cotización ni adjuntos.
- No hay registro público, tracking público, recuperación de contraseña o portal CLIENTE.
- No hay inventario, proveedores, pagos, correo, S3, firma digital o analítica avanzada.

Estas funciones no se simulan. Se presentan como información no interactiva o quedan fuera de la
navegación del MVP.
