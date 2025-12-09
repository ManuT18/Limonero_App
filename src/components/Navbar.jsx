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
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export function Navbar({ currentTab, onTabChange }) {
  const { theme, toggleTheme } = useTheme();

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "calculator", label: "Calculadora", icon: Calculator },
    { id: "inventory", label: "Inventario", icon: Package },
    { id: "cashbook", label: "Libro de Caja", icon: BookOpen },
    { id: "settings", label: "Configuración", icon: Settings },
  ];

  return (
    <nav className="navbar">
      <div className="container navbar-container">
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

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              background:
                "var(--surface)" /* Changed to surface for better contrast */,
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
        </div>
      </div>
    </nav>
  );
}
