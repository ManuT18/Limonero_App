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

/*
  -------------------------------------------------------------------------
  SUB-COMPONENTE: ConfigSection
  Maneja la configuración de costos fijos (energía, desgaste, precios)
  y la gestión de Presets (guardar/cargar configuraciones).
  -------------------------------------------------------------------------
*/
import React from "react";
import {
  Settings,
  RefreshCw,
  Save,
  X,
  GripVertical,
  Pencil,
  Trash2,
  Zap,
  DollarSign,
  AlertCircle,
  Scale,
} from "lucide-react";
import "../CalculatorCompact.css";

export function ConfigSection({
  config,
  setConfig,
  showPresetsManager,
  setShowPresetsManager,
  presets,
  presetName,
  setPresetName,
  editingPresetId,
  handleSavePreset,
  handleEditPreset,
  handleCancelEditPreset,
  handleDeletePreset,
  handleLoadPreset,
  handleDragStart,
  handleDragOver,
  handleDrop,
  inventory,
  selectedMaterialId,
  setSelectedMaterialId,
}) {
  return (
    <div className="card">
      <div
        className="section-title"
        style={{ justifyContent: "space-between" }}
      >
        <span>
          <Settings size={20} /> Configuración / Gastos Fijos
        </span>
        <button
          className="btn btn-ghost"
          onClick={() => setShowPresetsManager(!showPresetsManager)}
          style={{ fontSize: "0.875rem" }}
        >
          {showPresetsManager ? "Ocultar Presets" : "Editar Presets"}
        </button>
      </div>

      {/* PRESET MANAGER */}
      {showPresetsManager && (
        <div
          style={{
            marginBottom: "1.5rem",
            borderBottom: "1px solid var(--border)",
            paddingBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            <input
              className="input"
              placeholder="Nombre nuevo preset"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleSavePreset}>
              {editingPresetId ? <RefreshCw size={18} /> : <Save size={18} />}
            </button>
            {editingPresetId && (
              <button
                className="btn btn-secondary"
                onClick={handleCancelEditPreset}
              >
                <X size={18} />
              </button>
            )}
          </div>

          {presets.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <label className="label">Presets Guardados:</label>
              {presets.map((p, index) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "var(--background)",
                    padding: "0.5rem",
                    borderRadius: "var(--radius)",
                    cursor: "move",
                    border: "1px solid transparent",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <GripVertical size={16} className="text-secondary" />
                    <span style={{ fontSize: "0.9rem" }}>{p.name}</span>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      className="btn-icon"
                      onClick={() => handleEditPreset(p)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="btn-icon"
                      style={{ color: "var(--danger)" }}
                      onClick={() => handleDeletePreset(p.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PRESET LOADER */}
      {!showPresetsManager && (
        <div style={{ marginBottom: "1rem" }}>
          <select
            className="input"
            onChange={(e) => handleLoadPreset(e.target.value)}
            style={{ width: "100%", cursor: "pointer" }}
            defaultValue=""
          >
            <option value="" disabled>
              -- Cargar Preset Rápido --
            </option>
            {presets.length === 0 ? (
              <option disabled>No hay presets guardados</option>
            ) : (
              presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))
            )}
          </select>
        </div>
      )}

      {/* CONFIG GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "0.5rem",
        }}
      >
        <div
          style={{
            gridColumn: "1 / -1",
            background: "var(--surface-hover)",
            padding: "0.75rem",
            borderRadius: "var(--radius)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            <label className="label" style={{ margin: 0 }}>
              Filamento / Material
            </label>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.5rem",
            }}
          >
            <select
              className="input"
              value={selectedMaterialId}
              style={{ fontSize: "0.9rem", padding: "0.35rem" }}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedMaterialId(id);
                if (id) {
                  const mat = inventory.find((i) => i.id === id);
                  if (mat)
                    setConfig({ ...config, precio_filamento: mat.precio });
                }
              }}
            >
              <option value="">-- Personalizado --</option>
              {inventory.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.tipo} {i.marca} ({i.color}) - {i.stock}g
                </option>
              ))}
            </select>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "0.5rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-secondary)",
                  fontSize: "0.8rem",
                  pointerEvents: "none",
                }}
              >
                $
              </span>
              <input
                type="number"
                className="input"
                style={{
                  paddingLeft: "1.5rem",
                  paddingRight: "2rem",
                  fontSize: "0.9rem",
                  paddingBlock: "0.35rem",
                }}
                value={config.precio_filamento}
                onChange={(e) => {
                  setConfig({
                    ...config,
                    precio_filamento: parseFloat(e.target.value),
                  });
                  setSelectedMaterialId("");
                }}
              />
              <span
                style={{
                  position: "absolute",
                  right: "0.5rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-secondary)",
                  fontSize: "0.7rem",
                  pointerEvents: "none",
                }}
              >
                /kg
              </span>
            </div>
          </div>
        </div>

        {[
          {
            label: "Energía ($/kWh)",
            icon: <Zap size={14} />,
            key: "precio_kwh",
          },
          {
            label: "Consumo (W)",
            icon: <DollarSign size={14} />,
            key: "consumo_watts",
          },
          {
            label: "Desgaste ($/h)",
            icon: <AlertCircle size={14} />,
            key: "desgaste_hora",
          },
          {
            label: "Margen Error (%)",
            icon: <Scale size={14} />,
            key: "margen_error",
          },
          {
            label: "Multiplicador (x)",
            icon: null,
            key: "multiplicador_ganancia",
            step: 0.1,
          },
        ].map((item) => (
          <div className="input-card-compact" key={item.key}>
            <span className="label-compact">
              {item.icon} {item.label}
            </span>
            <input
              type="number"
              className="input-compact-transparent"
              step={item.step || 1}
              value={config[item.key]}
              onChange={(e) =>
                setConfig({
                  ...config,
                  [item.key]: parseFloat(e.target.value),
                })
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
