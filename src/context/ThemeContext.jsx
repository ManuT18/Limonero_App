/*
Copyright (C) 2025 Manuel Tauro

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <https://gnu.org>.
*/

import React, { createContext, useContext, useEffect, useState } from "react";

/*
  -------------------------------------------------------------------------
  CREACIÓN DEL CONTEXTO
  Crea el contexto 'ThemeContext' para compartir el estado del tema
  (light/dark) a cualquier componente que lo necesite (ej: Navbar para el toggle).
  -------------------------------------------------------------------------
*/
const ThemeContext = createContext();

/*
  -------------------------------------------------------------------------
  COMPONENTE PROVIDER (ThemeProvider)
  Este componente gestiona la lógica de:
  A) Detectar la preferencia del usuario al iniciar.
  B) Cambiar las clases CSS en el documento HTML.
  C) Guardar la preferencia en localStorage.
  -------------------------------------------------------------------------
*/
export function ThemeProvider({ children }) {

  /*
    ESTADO INICIAL (LAZY INITIALIZATION)
    Usa una función para el valor inicial de useState. Se ejecuta solo una vez.
    Prioridad de carga:
    1. Si ya existe un valor guardado en localStorage ('limonero_theme'), úsalo.
    2. Si no, detecta la preferencia del sistema operativo (prefers-color-scheme).
  */
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("limonero_theme");
    if (savedTheme) {
      return savedTheme;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  /*
    EFECTO DE APLICACIÓN (useEffect)
    Cada vez que cambia el estado 'theme':
    A) Actualiza la clase en la etiqueta <html> (documentElement). Esto permite
       que las variables CSS (var(--background), etc.) cambien globalmente.
    B) Guarda la selección en localStorage para futuras visitas.
  */
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("limonero_theme", theme);
  }, [theme]);

  /*
    FUNCIÓN TOGGLE
    Función helper para alternar entre los dos estados.
  */
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  /*
    RENDERIZADO
    Provee el tema actual y la función para cambiarlo.
  */
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/*
  -------------------------------------------------------------------------
  CUSTOM HOOK (useTheme)
  Facilita el acceso al contexto desde cualquier componente.
  Uso: const { theme, toggleTheme } = useTheme();
  -------------------------------------------------------------------------
*/
export function useTheme() {
  return useContext(ThemeContext);
}
