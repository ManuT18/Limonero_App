# Release Funcional v1.1 🚀

Esta versión marca un hito importante en la funcionalidad y usabilidad de **El Limonero**. Se han integrado todas las herramientas principales (Calculadora, Inventario, Caja) y se ha renovado la interfaz visual.

## ✨ Novedades Principales

### 🌗 Modo Oscuro (Dark Mode)

- **Tema Integrado**: Ahora puedes cambiar entre modo claro y oscuro desde la barra de navegación.
- **Persistencia**: La aplicación recuerda tu preferencia automáticamente.
- **Paleta de Colores**: Diseño optimizado con colores de alto contraste (Lima/Gris Oscuro) para trabajar cómodamente de noche.

### 🖨️ Flujo de Impresión (Print Workflow)

- **Integración Total**: Al finalizar un cálculo, el botón **"Imprimir"** conecta todo el sistema.
- **Modal de Confirmación**:
  - Selecciona el material utilizado directamente desde tu **Inventario**.
  - **Descuento Automático**: Resta el peso (gr) del stock de inventario al confirmar.
  - **Registro en Caja**: Crea automáticamente un ingreso en el **Libro de Caja** con el monto de la venta.

### 🧠 Redondeo Inteligente (Smart Rounding)

- Nueva herramienta en el modal de impresión para ajustar precios rápidamente.
- Botones `▲` y `▼` para redondear al centenar más cercano (ej: $1.234 → $1.300) y luego saltar de a $100.

### 📦 Portabilidad (Offline First)

- **Single File Build**: La aplicación ahora se compila en un **único archivo HTML** (`index.html`).
- **Sin Servidor**: Puedes ejecutar la app haciendo doble clic en el archivo, sin necesidad de instalar nada ni tener internet.

---

## 🛠️ Mejoras Técnicas

- Refactorización de la `Navbar` y componentes UI.
- Corrección de estilos en tarjetas de resultados.
- Optimización de dependencias (`lucide-react`, `vite-plugin-singlefile`).

> **Instalación**: Simplemente descarga el archivo `index.html` de los _assets_ y ábrelo en tu navegador favorito.
