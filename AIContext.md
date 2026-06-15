# Contexto del Proyecto

## Estado General
"El Limonero" es una aplicación web moderna orientada a la gestión integral de un emprendimiento de impresión 3D. Funciona como una Single-Page Application (SPA) 100% offline y local en el navegador, utilizando `localStorage` para la persistencia de datos y posibilitando el empaquetado en un único archivo `index.html`. Actualmente la versión es 1.2.0 y se encuentra en estado estable y funcional.

## Arquitectura y Decisiones
- **Frontend**: React (v18) y Vite con estilos CSS3 nativos estructurados en Variables CSS para una fácil personalización visual.
- **Estructura de Carpetas**:
  - `src/`: Lógica de componentes React, estilos, layouts y utilidades de cálculo.
- **Librerías principales**:
  - `lucide-react` para iconos.
  - `react-toastify` para notificaciones dinámicas en vivo.
  - `recharts` para gráficos de rendimiento financiero e inventario.
  - `vite-plugin-singlefile` para compilar todo el build de distribución en un único archivo HTML offline.
  - `@supabase/supabase-js` (opcional, en dependencias para posibles sincronizaciones).
- **Persistencia**: LocalStorage API de forma síncrona en el cliente.

## Tareas Completadas (Recientes)
- [x] Calculadora de Costos avanzada (horas, material, desgaste, energía).
- [x] Configuración de Presets de materiales reordenables.
- [x] Gestión de inventario de filamentos con alertas visuales de stock bajo (<200g).
- [x] Registro del Libro de Caja en tiempo real (ingresos/egresos, balance general).
- [x] Sistema de importación/exportación de copias de seguridad en formato JSON.
- [x] Configuración de compilación local en un archivo único (`App-Limonero.html`).

## Próximos Pasos (TODO)
- [ ] Implementar sincronización en la nube (ej. con Supabase o Google Drive) como opción para no depender únicamente de localStorage.
- [ ] Optimizar interfaz en pantallas pequeñas (mobile responsiveness refinado).
- [ ] Agregar soporte para múltiples impresoras 3D y colas de trabajo activas.
- [ ] Diseñar un catálogo de piezas frecuentes pre-calculadas.

## Problemas Abiertos o Notas
- **Compatibilidad**: Cualquier cambio en el esquema de datos del estado debe mantener la retrocompatibilidad con las copias de seguridad de versiones anteriores (Importar/Exportar JSON).
