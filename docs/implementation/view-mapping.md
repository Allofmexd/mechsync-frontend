# Mapeo de vistas

Esta tabla relaciona cada referencia visual con su implementación React y con los servicios reales del backend. Debe actualizarse cuando se agregue un SVG o cambie el estado de una vista.

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
| 11 | Dashboard | `docs/figma/views/02_dashboard-admin.svg` | `/dashboard` | `dashboard` | `GET /health`, `GET /health/database` | Pendiente de SVG |
| 12 | Usuarios | `docs/figma/views/03_users-list.svg` | `/users` | `users` | `GET /users` | Pendiente de SVG |
| 13 | Órdenes de trabajo | `docs/figma/views/09_work-orders-list.svg` | `/work-orders` | `workOrders` | `GET /work-orders` | Pendiente de SVG |

> `/admin/vehicle-intakes/new` se reserva únicamente para crear un ingreso puntual. La gestión o
> listado de ingresos (`/admin/vehicle-intakes`) permanece pendiente y no tiene ruta ni componente
> frontend implementado todavía.
