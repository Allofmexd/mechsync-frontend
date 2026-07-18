# Mapeo de vistas

Esta tabla relaciona cada referencia visual con su implementación React y con servicios reales del backend. Debe actualizarse cuando se agregue un SVG o cambie el estado de una vista.

| Orden | Vista | Archivo SVG | Ruta frontend sugerida | Feature sugerida | Endpoint backend relacionado | Estado |
| ----: | ----- | ----------- | ---------------------- | ---------------- | ---------------------------- | ------ |
| 1 | Landing Page | `docs/figma/seccion-general/Landing Page.svg` | `/` | `landing` | Opcional: `GET /health` | Implementada |
| 2 | Iniciar Sesión | `docs/figma/seccion-general/Iniciar Sesion.svg` | `/login` | `auth` | `POST /auth/login` | Implementada |
| 3 | Registrarse | `docs/figma/seccion-general/Registrarse.svg` | `/register` | `auth` | No disponible actualmente | UI implementada sin integración backend |
| 4 | Registro clientes | `docs/figma/seccion-administrador/Registro clientes.svg` | `/admin/customers` | `customers` | `GET /customers` | Implementada |
| 5 | Registrar cliente | `docs/figma/seccion-administrador/Registrar cliente.svg` | `/admin/customers/new` | `customers/users` | `POST /users`, `POST /customers` | Implementada |
| 6 | Detalle de cliente | `docs/figma/seccion-administrador/Registro cliente.svg` | `/admin/customers/:id` | `customers/users` | `GET /customers/{id}`, `GET /users/{id}` | Implementada; métricas e historial pendientes de endpoint |
| 7 | Vehículos | `docs/figma/seccion-administrador/Vehiculos.svg` | `/admin/vehicles` | `vehicles` | `GET /vehicles` | Implementada con datos reales disponibles |
| 8 | Registrar vehículo | Sin SVG específico | `/admin/vehicles/new` | `vehicles/customers` | `GET /customers`, `POST /vehicles` | Implementada |
| 9 | Detalle de vehículo | Sin SVG específico | `/admin/vehicles/:id` | `vehicles` | `GET /vehicles/{id}` | Implementada |
| 10 | Nuevo ingreso de vehículo | `docs/figma/seccion-administrador/Nuevo ingreso de vehiculo.svg` | `/admin/vehicle-intakes/new` | `vehicleIntakes/vehicles/catalogs/technicians` | `GET /vehicles`, `GET /catalogs/statuses?context=VEHICLE_INTAKES`, `GET /technicians`, `POST /vehicle-intakes` | Implementada con integración backend; técnico opcional |
| 11 | Gestión de ingresos de vehículos | `docs/figma/seccion-administrador/Gestion de ingresos de vehiculos.svg` | `/admin/vehicle-intakes` | `vehicleIntakes` | `GET /vehicle-intakes`, `GET /vehicle-intakes/{id}`, `GET /catalogs/statuses?context=VEHICLE_INTAKES`, `GET /vehicles/{id}`, `GET /technicians` | Implementada |
| 12 | Detalle de ingreso | Referencia derivada de gestión | `/admin/vehicle-intakes/:id` | `vehicleIntakes` | `GET /vehicle-intakes/{id}`, `GET /vehicles/{id}` | Implementada |
| 13 | Órdenes de servicio | `docs/figma/seccion-administrador/Ordenes De Servicio.svg` | `/admin/work-orders` | `workOrders` | `GET /work-orders`, catálogos y enlaces a revisiones | Listado implementado con acceso a historial y nueva cotización |
| 14 | Detalle de orden de servicio | `docs/figma/seccion-administrador/Ordenes De Servicio.svg` | `/admin/work-orders/:id` | `workOrders` | `GET /work-orders/{id}`, relaciones y endpoints de Work Order Revisions | Implementada con revisión vigente, aprobación final, historial y workflow |
| 15 | Crear orden de trabajo | `docs/figma/seccion-administrador/Crear Orden De trabajo.svg` | `/admin/work-orders/new` | `workOrders` | `GET /vehicle-intakes`, `GET /technicians`, `GET /catalogs/statuses?context=WORK_ORDERS`, `POST /work-orders` | Implementada; servicios y piezas pendientes de API |
| 16 | Nueva cotización | `docs/figma/seccion-administrador/Nueva cotizacion.svg` | `/admin/quotations/new` | `quotations/workOrders` | `GET /work-orders`, `GET /technicians`, `GET /work-orders/{id}/revisions`, `POST /work-orders/{id}/revisions` | Implementada con snapshots personalizados y cálculo visual |
| 17 | Gestión de trabajos realizados | `docs/figma/seccion-administrador/Gestion de trabajos realizados.svg` | `/admin/jobs` | `jobs/serviceReports` | Jobs y Service Reports no disponibles | Placeholder: pendiente de API |
| 18 | Panel Técnico | `docs/figma/seccion-tecnico/Panel Tecnico.svg` | `/technician` | `technician` | `GET /auth/me`, `GET /technicians`, `GET /work-orders`, `GET /catalogs/statuses?context=WORK_ORDERS` | Implementada con métricas reales de Work Orders |
| 19 | Mis órdenes | `docs/figma/seccion-tecnico/Mis ordenes.svg` | `/technician/work-orders` | `technician/workOrders` | `GET /work-orders`, `GET /vehicle-intakes/{id}`, `GET /vehicles/{id}`, `GET /customers/{id}` | Implementada; filtrado temporal client-side |
| 20 | Detalle técnico de orden | `docs/figma/seccion-tecnico/Mis ordenes.svg` | `/technician/work-orders/:id` | `technician/workOrders` | `GET /work-orders/{id}` y relaciones existentes | Implementada; acciones de ejecución pendientes de API |
| 21 | Mis órdenes asignadas | `docs/figma/seccion-tecnico/Mis ordenes asignadas.svg` | `/technician/assigned-work-orders` | `technician/workOrders` | `GET /auth/me`, `GET /technicians`, `GET /work-orders`, catálogo y relaciones existentes | Implementada; asignación validada en cliente |
| 22 | Historial de cotizaciones | Sin SVG específico | `/admin/work-orders/:workOrderId/revisions` | `workOrders` | Lista, revisión vigente, aprobación final y acciones de workflow | Implementada |
| 23 | Detalle de revisión | Derivada de Nueva cotización | `/admin/work-orders/:workOrderId/revisions/:revisionId` | `workOrders` | `GET /work-orders/{workOrderId}/revisions/{revisionId}` | Implementada con importes, aceptación y líneas snapshot |

## Brechas de API

### Cotizaciones versionadas — integradas

Se consumen los endpoints `/api/v1` de lista, vigente, aprobación final, detalle, creación, envío,
aprobación, rechazo y cancelación. Las líneas se envían embebidas como snapshots. No se usa ni se
propone `/api/v2`.

La disponibilidad por entorno depende de las migraciones database/v2 `001`–`005` y sus seeds. Un
error `5xx` durante estas operaciones se presenta como migración/API pendiente; nunca como éxito.

### Trabajos ejecutados y reportes

- `GET /jobs`, `GET /jobs/{id}`, `POST /jobs`, `PUT /jobs/{id}`, `PATCH /jobs/{id}/status`
- `GET /service-reports`, `GET /service-reports/{id}`, `POST /service-reports`

### Sección técnico

- `GET /technicians/me`
- `GET /work-orders/assigned-to-me`
- `GET /technician/dashboard`
- `PATCH /work-orders/{id}/status`
- `PATCH /work-orders/{id}/start`
- `PATCH /work-orders/{id}/complete`
- `GET /jobs/assigned-to-me`
- `GET /service-reports/technician/me`

El mapeo actual `auth userId → technician.userId → workOrder.technicianId` es determinista, pero se
ejecuta en el navegador. La solución backend recomendada debe filtrar antes de devolver datos.
Work Orders no se interpretan como Jobs; iniciar, completar y reportar trabajo continúa bloqueado.

Los elementos que permanecen bajo “Trabajos ejecutados y reportes” y “Sección técnico” son brechas
de coordinación. Jobs, Service Reports, PDF y acciones de ejecución no se consumen ni se simulan.
