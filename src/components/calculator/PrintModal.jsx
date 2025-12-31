/*
  -------------------------------------------------------------------------
  SUB-COMPONENTE: PrintModal
  Modal de confirmación final antes de registrar una venta/impresión.
  Permite seleccionar material real, ajustar precio y agregar cliente/descripción.
  -------------------------------------------------------------------------
*/
import React from "react";
import { User, FileText } from "lucide-react";

export function PrintModal({
  show,
  onClose,
  onConfirm,
  printConfig,
  setPrintConfig,
  inputs,
  inventory,
  handleSmartRound,
}) {
  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "450px",
          margin: "1rem",
          background: "var(--surface)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h3 className="section-title">Confirmar Impresión</h3>

        <div style={{ marginBottom: "1.5rem" }}>
          <label className="label">1. Seleccionar Material (Inventario)</label>
          <select
            className="input"
            value={printConfig.materialId}
            onChange={(e) =>
              setPrintConfig({ ...printConfig, materialId: e.target.value })
            }
          >
            <option value="">-- Selecciona un filamento --</option>
            {inventory.map((item) => (
              <option key={item.id} value={item.id}>
                {item.tipo} {item.marca} - {item.color} ({item.stock}g disp.)
              </option>
            ))}
          </select>
          {inputs.peso && (
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--text-secondary)",
                marginTop: "0.5rem",
              }}
            >
              Se descontarán <strong>{inputs.peso}g</strong> del stock
              seleccionado.
            </div>
          )}
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <div className="input-group" style={{ margin: 0 }}>
            <label className="label">
              {" "}
              <User size={14} /> Cliente{" "}
            </label>
            <input
              className="input"
              placeholder="Opcional"
              value={printConfig.clientName}
              onChange={(e) =>
                setPrintConfig({
                  ...printConfig,
                  clientName: e.target.value,
                })
              }
            />
          </div>
          <div className="input-group" style={{ marginTop: "1rem" }}>
            <label className="label">
              {" "}
              <FileText size={14} /> Descripción{" "}
            </label>
            <input
              className="input"
              placeholder="Ej: Pieza decorativa"
              value={printConfig.description}
              onChange={(e) =>
                setPrintConfig({
                  ...printConfig,
                  description: e.target.value,
                })
              }
            />
          </div>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <label className="label">
            2. Ajustar Precio Final (Smart Rounding)
          </label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "var(--background)",
              padding: "1rem",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                flex: 1,
                fontSize: "2rem",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              ${printConfig.adjustedPrice.toFixed(0)}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => handleSmartRound("up")}
                style={{ padding: "0.25rem 0.5rem" }}
              >
                ▲
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleSmartRound("down")}
                style={{ padding: "0.25rem 0.5rem" }}
              >
                ▼
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "flex-end",
          }}
        >
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={onConfirm}>
            Aceptar y Registrar
          </button>
        </div>
      </div>
    </div>
  );
}
