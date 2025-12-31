/*
  -------------------------------------------------------------------------
  1. IMPORTACIONES
  - Iconos de 'lucide-react' para ilustrar las pestañas y acciones.
  - Hooks de contexto (Theme, Auth) para manejar el modo oscuro y el logout.
  -------------------------------------------------------------------------
*/
import React from "react";
import {
  Calculator,
  Package,
  BookOpen,
  Citrus,
  Settings,
  Sun,
  Moon,
  Activity,
  LogOut,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

/*
  -------------------------------------------------------------------------
  2. COMPONENTE NAVBAR
  Barra de navegación principal superior.
  Recibe 'currentTab' y 'onTabChange' desde App.jsx para controlar qué módulo se muestra.
  -------------------------------------------------------------------------
*/
export function Navbar({ currentTab, onTabChange }) {
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth(); // Función para cerrar sesión en Supabase

  /*
    A. CONFIGURACIÓN DE PESTAÑAS
    Array constante que define las secciones de la app.
    Facilita agregar nuevas secciones en el futuro solo añadiendo un objeto aquí.
  */
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "calculator", label: "Calculadora", icon: Calculator },
    { id: "inventory", label: "Inventario", icon: Package },
    { id: "cashbook", label: "Libro de Caja", icon: BookOpen },
    { id: "settings", label: "Configuración", icon: Settings },
  ];

  /*
    B. RENDERIZADO
    Estructura Flexbox con:
    - Izquierda: Logo y Título.
    - Derecha: Botones de navegación (Tabs), Toggle de Tema y Logout.
  */
  return (
    <nav className="navbar">
      <div className="container navbar-container">
        {/* LOGO E IDENTIDAD */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div className="navbar-logo-bg">
            <Citrus size={24} />
          </div>
          <div>
            <h1
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                color: "var(--text-main)",
                margin: 0,
                letterSpacing: "-0.025em",
              }}
            >
              El Limonero
            </h1>
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                fontWeight: 500,
              }}
            >
              Manager App
            </span>
          </div>
        </div>

        {/* ACCIONES Y NAVEGACIÓN */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {/* GRUPO DE PESTAÑAS */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              background: "var(--surface)", 
              padding: "0.25rem",
              borderRadius: "1rem",
              border: "1px solid var(--border)",
            }}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`btn btn-nav ${isActive ? "active" : ""}`}
                >
                  <Icon size={18} />
                  <span style={{ marginLeft: "0.5rem" }}>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TOGGLE MODO OSCURO */}
          <button
            onClick={toggleTheme}
            className="btn btn-ghost"
            style={{
              padding: "0.5rem",
              borderRadius: "50%",
              color: theme === "dark" ? "#fbbf24" : "var(--text-secondary)",
            }}
            title={
              theme === "dark"
                ? "Cambiar a Modo Claro"
                : "Cambiar a Modo Oscuro"
            }
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* CERRAR SESIÓN */}
          <button
            onClick={signOut}
            className="btn btn-ghost"
            style={{
              padding: "0.5rem",
              borderRadius: "50%",
              color: "var(--danger)",
            }}
            title="Cerrar Sesión"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
}
