/*
  -------------------------------------------------------------------------
  SUB-COMPONENTE: ResultsSection
  Panel derecho que muestra el desglose de costos calculados y el PRECIO FINAL.
  -------------------------------------------------------------------------
*/
import React from "react";
import {
  Package,
  Zap,
  Settings,
  DollarSign,
  AlertCircle,
  Calculator as CalculatorIcon,
} from "lucide-react";

const ResultRow = ({ label, value, icon, color }) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          color: color || "var(--text-secondary)",
        }}
      >
        {icon}
        <span>{label}</span>
      </div>
      <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
        ${value.toFixed(2)}
      </span>
    </div>
  );
};

export function ResultsSection({ result, config, handleOpenPrint }) {
  if (!result) {
    return (
      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: "3rem 1rem",
          color: "var(--text-light)",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <CalculatorIcon size={48} opacity={0.2} />
        <p>Ingresa los datos para ver el presupuesto</p>
      </div>
    );
  }

  return (
    <div
      className="card card-result"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "1rem",
      }}
    >
      <div
        className="section-title"
        style={{ color: "var(--primary)", marginBottom: 0 }}
      >
        Resumen de Costos
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        <ResultRow
          label="Material"
          value={result.costo_material}
          icon={<Package size={16} />}
        />
        <ResultRow
          label="Energía"
          value={result.costo_energia}
          icon={<Zap size={16} />}
        />
        <ResultRow
          label="Desgaste Máquina"
          value={result.costo_desgaste}
          icon={<Settings size={16} />}
        />
        <ResultRow
          label="Insumos Extra"
          value={result.insumos}
          icon={<DollarSign size={16} />}
        />
        <ResultRow
          label={`Margen Error (${config.margen_error}%)`}
          value={result.costo_error}
          icon={<AlertCircle size={16} />}
          color="var(--danger)"
        />
        <div
          style={{
            height: "1px",
            background: "var(--border)",
            margin: "0.5rem 0",
          }}
        ></div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
            Costo Total Real
          </span>
          <span style={{ fontWeight: 700, fontSize: "1.25rem" }}>
            ${result.costo_total.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="price-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "0.5rem",
          }}
        >
          <span style={{ opacity: 0.9 }}>Precio Sugerido</span>
          <span className="price-badge">
            {" "}
            x{config.multiplicador_ganancia}{" "}
          </span>
        </div>
        <div style={{ fontSize: "2.5rem", fontWeight: 800, lineHeight: 1 }}>
          ${result.precio_venta.toFixed(2)}
        </div>
        <div
          style={{
            marginTop: "0.5rem",
            opacity: 0.9,
            fontSize: "0.875rem",
          }}
        >
          Ganancia Neta: ${result.ganancia_neta.toFixed(2)}
        </div>
      </div>

      <button
        style={{
          background:
            "linear-gradient(135deg, var(--success) 0%, var(--success-hover) 100%)",
          borderRadius: "var(--radius)",
          border: "none",
          cursor: "pointer",
          padding: "1rem",
          fontSize: "1.75rem",
          fontWeight: 600,
          color: "white",
          boxShadow: "0 10px 15px -3px rgba(70, 229, 123, 0.3)",
          width: "100%",
        }}
        onClick={handleOpenPrint}
      >
        Imprimir
      </button>
    </div>
  );
}
