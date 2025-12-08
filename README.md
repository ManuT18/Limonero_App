# 🍋 El Limonero - Manager App

Una aplicación web moderna y eficiente para la gestión de emprendimientos de Impresión 3D. Diseñada para simplificar el cálculo de costos, gestionar inventario y llevar un libro de caja ordenado.

![El Limonero Badge](https://img.shields.io/badge/Estado-Desarrollo-success)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)

## ✨ Características Principales

### 🖩 Calculadora de Costos

- **Cálculo Preciso**: Estima el costo real de tus impresiones basándose en material, energía, desgaste de máquina y horas de trabajo.
- **Configuración Persistente**: Guarda tus valores de costos fijos (precio del kWh, filamento, etc.) para no ingresarlos cada vez.
- **Multiplicador Editable**: Ajusta tu ganancia deseada al vuelo con un campo siempre visible.
- **Precio Sugerido**: Obtén una recomendación de venta clara con desglose de ganancia neta.

### 📦 Gestión de Inventario

- **Control de Stock**: Registra tus rollos de filamento por marca, tipo y color.
- **Alertas Visuales**: Indicadores automáticos cuando el stock es bajo (< 200g).
- **Seguridad**: Confirmación pop-up anties de eliminar cualquier item para evitar accidentes.

### 📒 Libro de Caja

- **Registro de Movimientos**: Asienta ingresos y egresos de dinero.
- **Balance en Tiempo Real**: Visualiza tu saldo actual, total de ingresos y gastos de un vistazo.

### 💾 Respaldo de Datos (Backup)

- **Importar/Exportar**: Descarga toda tu base de datos en un archivo JSON seguro.
- **Restauración Fácil**: Recupera tu información en segundos cargando tu archivo de backup.
- **Privacidad**: Todos los datos se guardan localmente en tu navegador (`localStorage`), nada sube a servidores externos.

## 🚀 Uso e Instalación

### 👤 Para Usuarios Finales (Recomendado)

Si solo quieres usar la aplicación para gestionar tu emprendimiento, **no necesitas instalar nada**.

1.  Ve a la sección de **[Releases](https://github.com/ManuT18/Limonero_App/releases)** de este repositorio.
2.  Busca la versión más reciente.
3.  Descarga el archivo `index.html`.
4.  **¡Listo!** Haz doble clic en el archivo descargado para abrir la app en tu navegador. Funciona 100% offline.

### 💻 Para Desarrolladores y Contribuidores

Si quieres modificar el código, probar nuevas funciones o aportar al proyecto, sigue estos pasos:

> **Nota:** Para aportar cambios, por favor **crea una nueva rama** (branch) desde `master`.

**Requisitos previos:**

- Tener instalado **[Node.js](https://nodejs.org/)** (versión LTS recomendada).
- Tener instalado **Git**.

1.  **Clonar el repositorio**

    ```bash
    git clone https://github.com/ManuT18/Limonero_App.git
    cd Limonero_App
    ```

2.  **Crear tu rama de desarrollo**

    ```bash
    git checkout -b feature/nueva-funcionalidad
    ```

3.  **Instalar dependencias**

    ```bash
    npm install
    ```

4.  **Iniciar servidor de desarrollo**

    ```bash
    npm run dev
    ```

5.  **Compilar versión final (SingleFile)**
    ```bash
    npm run build
    ```
    El archivo resultante estará en `dist/index.html`.

## 🛠️ Tecnologías

- **ReactJS**: Librería principal para la interfaz de usuario.
- **Vite**: Build tool y servidor de desarrollo.
- **Lucide React**: Iconografía moderna y ligera.
- **CSS3**: Estilos personalizados con variables CSS y diseño responsivo.
- **LocalStorage API**: Persistencia de datos del lado del cliente.
