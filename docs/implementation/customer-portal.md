# Portal CLIENTE

## Alcance implementado

El portal read-only usa rutas lazy para:

* `/customer`: resumen de perfil y vehículos.
* `/customer/profile`: información propia.
* `/customer/vehicles` y `/customer/vehicles/:vehicleId`: vehículos propios.
* `/customer/service-history`: timeline operativo paginado y filtrable por vehículo propio.
* `/customer/service-history/:intakeId`: detalle visible del ingreso.
* `/customer/work-orders/:workOrderId`: detalle visible de la orden.
* `/customer/quotations` y `/customer/quotations/:workOrderId`: revisiones SENT o APPROVED.
* `/customer/jobs/:jobId`: estado, técnico y líneas reales sin importes provisionales.

`ProtectedRoute` exige `CLIENTE`; el login redirige a `/customer`. La navegación solo presenta
Inicio, Mi perfil, Mis vehículos, Historial de servicio, Cotizaciones y Cerrar sesión.

## Datos y requests

La feature consume exclusivamente `/customer-portal`. Nunca envía `customerId`/`userId`, llama a
endpoints ADMINISTRADOR o TECNICO, ni filtra ownership en React. Los listados solicitan una página
por vez, usan metadata real, corrigen páginas fuera de rango y cancelan requests obsoletas con
`AbortController`.

El timeline ya viene unificado y paginado desde backend. El detalle del vehículo reutiliza
`history?vehicleId=...&page=0&size=5`; no consulta detalles por fila. Los snapshots y totales de la
cotización llegan calculados por backend.

## Seguridad y presentación

Recursos ajenos o inexistentes comparten el mismo 404. El frontend maneja 400, 401, 403, 404 y 500
sin exponer detalles internos. Las vistas incluyen loading, vacío, reintento, tablas con scroll
interno, timeline semántico, regiones live, navegación etiquetada y foco visible.

## Pendiente

Service Reports y PDF se reservan para Fase D. No existen aceptación directa, pagos, edición,
chat, notificaciones o seguimiento público. El Job no se presenta como cierre económico: el total
final dependerá del Service Report.
