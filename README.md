# 🍋 El Limonero - Manager App

Una aplicación web moderna y eficiente para la gestión de emprendimientos de Impresión 3D. Diseñada para simplificar el cálculo de costos, gestionar inventario y llevar un libro de caja ordenado.

![El Limonero Badge](https://img.shields.io/badge/Estado-Desarrollo-success)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![License](https://img.shields.io/badge/Licencia-CC%20BY--NC%204.0-red)

---

## ⚠️ Licencia y Derechos de Autor (Uso No Comercial)

Este proyecto es de **código abierto**, pero está protegido bajo la licencia **[Creative Commons](LICENSE)**.

#### Por favor, leer el archivo LICENSE para conocer los términos de uso y contribución

#### Mas detalles se encuentran al final de este README

---

## ✨ Características Principales

### 🖩 Calculadora de Costos

- **Cálculo Preciso**: Estimá el costo real de tus impresiones basándote en material, energía, desgaste de máquina y horas de trabajo.
- **Configuración Persistente**: Guardá tus valores de costos fijos (precio del kWh, filamento, etc.) para no ingresarlos cada vez.
- **Gestión Avanzada de Presets**:
  - **Guardar**: Creá perfiles para distintos materiales.
  - **Editar**: Modificá valores existentes fácilmente.
  - **Reordenar**: Organizá tus presets favoritos arrastrando y soltando (Drag & Drop).
- **Multiplicador Editable**: Ajustá tu ganancia deseada al vuelo con un campo siempre visible.
- **Precio Sugerido**: Obtené una recomendación de venta clara con desglose de ganancia neta.

### 📦 Gestión de Inventario

- **Control de Stock**: Registrá tus rollos de filamento por marca, tipo y color.
- **Edición en Línea**: Modificá stock, precios o detalles directamente desde la tabla, sin abrir menús extra.
- **Acciones Rápidas**: Duplicá items para cargas masivas y eliminá con seguridad.
- **Ordenamiento Inteligente**: Tu inventario se mantiene organizado automáticamente (Tipo > Marca > Color).
- **Alertas Visuales**: Indicadores automáticos cuando el stock es bajo (< 200g).

### 📒 Libro de Caja

- **Registro de Movimientos**: Asentá ingresos y egresos de dinero.
- **Balance en Tiempo Real**: Visualizá tu saldo actual, total de ingresos y gastos de un vistazo.

### 💾 Respaldo de Datos (Backup)

- **Importar/Exportar**: Descargá toda tu base de datos en un archivo JSON seguro.
- **Restauración Fácil**: Recuperá tu información en segundos cargando tu archivo de backup.
- **Privacidad**: Todos los datos se guardan localmente en tu navegador (`localStorage`), nada se sube a servidores externos.

### 🔔 Notificaciones Inteligentes

El sistema cuenta con alertas modernas (Toasts) que te informan del estado de tus acciones:

- ✅ **Confirmaciones**: Al guardar o editar con éxito.
- ℹ️ **Información**: Detalles sobre duplicados o exportaciones.
- 🗑️ **Seguridad**: Confirmación interactiva antes de eliminar datos importantes.

---

## 🚀 Uso e Instalación

### 👤 Para Usuarios Finales (Recomendado)

Si solo querés usar la aplicación para gestionar tu emprendimiento, **no necesitás instalar nada**.

1.  Ve a la sección de **[Releases](https://github.com/ManuT18/Limonero_App/releases)** de este repositorio.
2.  Busca la versión más reciente.
3.  Debajo del todo descargá el archivo `App-Limonero.html`.
4.  **¡Listo!** Hacé doble clic en el archivo descargado para abrir la app en tu navegador. Funciona 100% offline.

### 💻 Para Desarrolladores y Contribuidores

Si querés modificar el código, probar nuevas funciones o aportar al proyecto, por favor realiza un **Fork** de este repositorio y sigue estos pasos:

**Requisitos previos:**

- Tener instalado **[Node.js](https://nodejs.org/)** (versión LTS recomendada).
- Tener instalado **Git**.

---

## 🛠️ Tecnologías

- **ReactJS**: Librería principal para la interfaz de usuario.
- **Vite**: Build tool y servidor de desarrollo.
- **Lucide React**: Iconografía moderna y ligera.
- **CSS3**: Estilos personalizados con variables CSS y diseño responsivo.
- **LocalStorage API**: Persistencia de datos del lado del cliente.

---

## ⚖️ Detalles de Licencia y Derechos de Autor

Este proyecto es de código abierto, pero está protegido bajo la licencia [Creative Commons](LICENSE).

### Lo que esto significa:

- **No Comercial**: Está estrictamente **prohibido** utilizar este código, modificarlo o distribuirlo con fines comerciales o lucrativos. No está permitido utilizar partes de esta aplicación en plataformas web de pago, membresías cerradas, o para obtener beneficio económico directo o indirecto sin el consentimiento explícito del autor original.
- **Atribución**: Se debe dar crédito de manera clara al autor original (Manuel Tauro) y enlazar a este repositorio si se decide compartir o adaptar el proyecto.

### 🍴 Por favor, realiza un Fork

Si se desea experimentar con el código, añadir mejoras o adaptarlo a necesidades personales:

- **No clonar el repositorio "como si nada"** en un repositorio limpio.
- En su lugar, **utilizar la función de Fork** de GitHub. Esto ayuda a mantener la trazabilidad del código original, respeta la autoría del trabajo y permite que otros makers sepan de dónde proviene la herramienta.
