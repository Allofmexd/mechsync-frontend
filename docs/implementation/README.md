# Guía de implementación de vistas

Antes de codificar una vista basada en Figma se debe:

1. Revisar el SVG correspondiente en `docs/figma/views/`.
2. Identificar el layout, los componentes reutilizables y los estados de interfaz.
3. Revisar los endpoints del backend necesarios y sus requisitos de autorización.
4. Implementar componentes React reutilizables dentro de la feature apropiada.
5. Conectar la vista con servicios de API, manteniendo separada la lógica HTTP.
6. Validar la experiencia responsive, los estados de carga y error, y ejecutar el build.

## Reglas técnicas

La implementación debe respetar:

- React + Vite + JavaScript.
- Arquitectura organizada por features.
- El cliente centralizado `src/shared/api/apiClient.js`.
- La variable de entorno `VITE_API_BASE_URL`.
- JWT Bearer Token mediante el header `Authorization` cuando el endpoint lo requiera.

El SVG define una referencia visual, no la estructura técnica final. Antes de replicarlo se deben evaluar accesibilidad, responsive design, reutilización y consistencia con el código existente.

Usar `docs/implementation/view-mapping.md` para identificar la ruta, feature y endpoints relacionados con cada diseño.
