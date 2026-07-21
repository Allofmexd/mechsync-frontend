# Dashboard administrativo

## Ruta y permisos

El Dashboard se encuentra en `/admin/dashboard`; `/admin` redirige a esa ruta. La página se carga
mediante `React.lazy` dentro del guard `ADMINISTRADOR`, por lo que ni el componente ni Recharts
forman parte del entry inicial. El sidebar administrativo ofrece el enlace `Dashboard`.

## Datos

La vista consume exclusivamente endpoints agregados `/api/v1/dashboard/*`. No descarga listados de
clientes, vehículos, ingresos, Work Orders, Jobs, reportes, servicios o técnicos y no calcula
agregados a partir de entidades operativas en React.

Se solicitan en paralelo:

- resumen;
- Work Orders por estado;
- Jobs por estado;
- ingresos por mes;
- top 5 de servicios;
- carga de trabajo por técnico.

Los requests se cancelan al cambiar de periodo o desmontar la vista. Una secuencia local impide que
una respuesta anterior sustituya a una nueva.

## Periodos

Los presets son `Este mes`, `Últimos 3 meses`, `Últimos 6 meses` y `Año actual`. El modo
`Personalizado` no consulta durante la edición: requiere pulsar `Aplicar`. Las fechas se construyen
como fechas locales `YYYY-MM-DD`, sin convertirlas a UTC.

## Presentación y accesibilidad

La vista incluye seis cards y cinco gráficas responsivas implementadas con Recharts. Cada gráfica
cuenta con título, descripción, tooltip, leyenda cuando aplica y una tabla HTML alternativa. Los
estados vacíos no generan datos ficticios. El layout usa dos columnas en escritorio y una en móvil;
las gráficas y tablas extensas tienen scroll interno en lugar de provocar scroll global.

Los estados contemplados son carga inicial, actualización, error con reintento, métricas en cero y
colecciones vacías. Un `401` conserva el comportamiento global de cierre de sesión del cliente API.
