/*
Copyright (C) 2025 Manuel Tauro

This work is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License.
To view a copy of this license, visit http://creativecommons.org/licenses/by-nc/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/

/*
  -------------------------------------------------------------------------
  SUB-COMPONENTE: PieceInputs
  Formulario simple para ingresar los datos variables de la pieza (Tiempo y Peso).
  -------------------------------------------------------------------------
*/
import React from "react";
import { RefreshCw, Eraser, Clock, Scale, DollarSign } from "lucide-react";

export function PieceInputs({ inputs, setInputs, handleResetInputs }) {
  return (
    <div className="card">
      <div
        className="section-title"
        style={{ justifyContent: "space-between" }}
      >
        <span>
          <RefreshCw size={20} /> Datos de la Pieza
        </span>
        <button
          className="btn btn-ghost"
          onClick={handleResetInputs}
          title="Limpiar datos"
          style={{ color: "var(--danger)" }}
        >
          <Eraser size={18} />
        </button>
      </div>

      <div className="input-group">
        <label className="label">
          <Clock size={16} /> Tiempo de Impresión
        </label>
        <div style={{ display: "flex", gap: "1rem" }}>
          <div style={{ flex: 1 }}>
            <input
              type="number"
              className="input"
              placeholder="Horas"
              value={inputs.tiempo_horas}
              onChange={(e) =>
                setInputs({ ...inputs, tiempo_horas: e.target.value })
              }
            />
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
              }}
            >
              Horas
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <input
              type="number"
              className="input"
              placeholder="Minutos"
              value={inputs.tiempo_minutos}
              onChange={(e) =>
                setInputs({ ...inputs, tiempo_minutos: e.target.value })
              }
            />
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
              }}
            >
              Minutos
            </span>
          </div>
        </div>
      </div>

      <div className="input-group">
        <label className="label">
          <Scale size={16} /> Peso (Gramos)
        </label>
        <input
          type="number"
          className="input"
          placeholder="Ej: 150"
          value={inputs.peso}
          onChange={(e) => setInputs({ ...inputs, peso: e.target.value })}
        />
      </div>

      <div className="input-group">
        <label className="label">
          <DollarSign size={16} /> Costo Extra (Insumos)
        </label>
        <input
          type="number"
          className="input"
          placeholder="Ej: 500"
          value={inputs.costo_insumos}
          onChange={(e) =>
            setInputs({ ...inputs, costo_insumos: e.target.value })
          }
        />
      </div>
    </div>
  );
}
