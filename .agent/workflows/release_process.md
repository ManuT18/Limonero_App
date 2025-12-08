---
description: Guía paso a paso para publicar una nueva versión (Release) de la aplicación.
---

# 🚀 Cómo crear una Release en GitHub

Sigue estos pasos para publicar oficialemente una versión de **El Limonero**.

## 1. Generar la Aplicación (Build)

Primero, asegúrate de tener la versión más reciente del código compilada y lista para usar.

```bash
# Genera la carpeta 'dist' con el index.html portable
npm run build
```

> **Tip**: Comprueba que el archivo `dist/index.html` funciona dándole doble clic.
> **Opcional**: Comprime el archivo `index.html` en un ZIP llamado `Limonero_App_v1.0.zip` para que sea más fácil de descargar para los usuarios.

## 2. Etiquetar la Versión (Tag)

En Git, las "tags" son marcas que indican puntos importantes en la historia (como v1.0, v1.1).

```bash
# 1. Crear el tag localmente
git tag v1.0

# 2. Subir el tag a GitHub (esto no se sube con un push normal)
git push origin v1.0
```

## 3. Crear la Release en GitHub Web

1.  Abre tu repositorio en GitHub.
2.  En el menú lateral derecho, busca la sección **"Releases"** y haz click en **"Create a new release"**.
3.  **Choose a tag**: selecciona `v1.0`.
4.  **Release title**: Escribe un título llamativo, ej: `v1.0 - Lanzamiento Oficial`.
5.  **Describe this release**: Puedes usar el botón "Generate release notes" para que GitHub escriba automático los cambios, o pegar tu propia lista.
6.  **Attach binaries** (¡Importante!): Arrastra aquí tu archivo `index.html` (o el `.zip` que creaste). Así los usuarios podrán descargar la app directamente sin saber programar.
7.  Haz click en **Publish release**.

¡Listo! Tu aplicación ahora tiene una versión oficial descargable.
