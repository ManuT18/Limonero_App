import React from "react";
import { Calculator, Package, BookOpen, Citrus, Settings } from "lucide-react";

export function Navbar({ currentTab, onTabChange }) {
  const tabs = [
    { id: "calculator", label: "Calculadora", icon: Calculator },
    { id: "inventory", label: "Inventario", icon: Package },
    { id: "cashbook", label: "Libro de Caja", icon: BookOpen },
    { id: "settings", label: "Configuración", icon: Settings },
  ];

  return (
    <nav
      style={{
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 2rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #facc15 0%, #a3e635 100%)",
              padding: "0.5rem",
              borderRadius: "0.75rem",
              color: "white",
              boxShadow: "0 4px 6px -1px rgba(163, 230, 53, 0.3)",
            }}
          >
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

        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            background: "var(--background)",
            padding: "0.25rem",
            borderRadius: "1rem",
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
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
