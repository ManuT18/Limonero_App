import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useLocalStorage } from "../hooks/useLocalStorage";
import "./CalculatorCompact.css"; // We will create this file
import {
  Settings,
  RefreshCw,
  DollarSign,
  Zap,
  Clock,
  Scale,
  AlertCircle,
  Package,
  Calculator as CalculatorIcon,
  Save,
  Trash2,
  Pencil,
  X,
  GripVertical,
  Eraser,
  User,
  FileText,
} from "lucide-react";

const ConfirmToast = ({ closeToast, onConfirm, message }) => (
  <div>
    <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem" }}>{message}</p>
    <div
      style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}
    >
      <button
        onClick={closeToast}
        style={{
          background: "transparent",
          border: "1px solid currentColor",
          color: "inherit",
          padding: "0.25rem 0.5rem",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "0.8rem",
        }}
      >
        Cancelar
      </button>
      <button
        onClick={() => {
          onConfirm();
          closeToast();
        }}
        style={{
          background: "#EF4444",
          border: "none",
          color: "white",
          padding: "0.25rem 0.5rem",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "0.8rem",
          fontWeight: "bold",
        }}
      >
        Confirmar
      </button>
    </div>
  </div>
);

export function Calculator() {
  // Configuración Global (Gastos Fijos)
  // v3: Cambiado margen_ganancia (%) a multiplicador_ganancia (x)
  const [config, setConfig] = useLocalStorage("limonero_config_v3", {
    precio_filamento: 25000, // Precio por KG
    precio_kwh: 150.0,
    consumo_watts: 150, // Consumo promedio impresora
    desgaste_hora: 50.0, // Depreciación/Mantenimiento
    precio_repuestos: 0, // Extra repuestos (opcional)
    margen_error: 5.0, // % de error (fallos)
    multiplicador_ganancia: 2.0, // Multiplicador (ej: 2.0 = x2)
  });

  const [presets, setPresets] = useLocalStorage("limonero_presets", []);

  const [presetName, setPresetName] = useState("");
  const [editingPresetId, setEditingPresetId] = useState(null);
  const [showPresetsManager, setShowPresetsManager] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState("");

  // Datos de la Pieza
  const [inputs, setInputs] = useState({
    tiempo_horas: "",
    tiempo_minutos: "",
    peso: "", // gramos
    costo_insumos: 0, // tornillos, imanes, etc.
  });

  const [result, setResult] = useState(null);

  const handleCalculate = () => {
    // 1. Normalizar inputs
    const t_horas = parseInt(inputs.tiempo_horas) || 0;
    const t_minutos = parseInt(inputs.tiempo_minutos) || 0;
    const tiempo_total_horas = t_horas + t_minutos / 60;

    const peso_gr = parseFloat(inputs.peso) || 0;
    const insumos = parseFloat(inputs.costo_insumos) || 0;

    // 2. Cálculos Base
    // Material: (Precio KG / 1000) * Peso
    const costo_material = (config.precio_filamento / 1000) * peso_gr;

    // Energía: (Watts / 1000) * Horas * Precio kWh
    const consumo_kwh = (config.consumo_watts / 1000) * tiempo_total_horas;
    const costo_energia = consumo_kwh * config.precio_kwh;

    // Desgaste: Horas * Precio Hora
    const costo_desgaste = tiempo_total_horas * config.desgaste_hora;

    // 3. Subtotal y Margen de Error
    const subtotal_costos =
      costo_material + costo_energia + costo_desgaste + insumos;
    const costo_error = subtotal_costos * (config.margen_error / 100);

    // 4. Costo Total Real
    const costo_total = subtotal_costos + costo_error;

    // 5. Precio de Venta
    // Precio = Costo * Multiplicador
    const precio_venta = costo_total * config.multiplicador_ganancia;
    const ganancia_neta = precio_venta - costo_total;

    setResult({
      costo_material,
      costo_energia,
      costo_desgaste,
      costo_error,
      insumos,
      costo_total,
      precio_venta,
      ganancia_neta,
    });
  };

  // Auto-calcular cuando cambian inputs (opcional, pero moderno)
  useEffect(() => {
    if (inputs.peso || inputs.tiempo_horas) {
      handleCalculate();
    }
  }, [inputs, config]);

  // Estados para datos externos (Inventario y Caja)
  const [inventory, setInventory] = useLocalStorage("limonero_inventory", []);
  const [cashbook, setCashbook] = useLocalStorage("limonero_cashbook", []);

  // Estado para el Modal de Impresión
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printConfig, setPrintConfig] = useState({
    materialId: "",
    adjustedPrice: 0,
  });

  // Efecto para inicializar el precio ajustable cuando hay resultados
  useEffect(() => {
    if (result) {
      setPrintConfig((prev) => ({
        ...prev,
        adjustedPrice: result.precio_venta,
      }));
    }
  }, [result]);

  const handleOpenPrint = () => {
    if (!result) return;
    setPrintConfig({
      materialId: selectedMaterialId || "",
      adjustedPrice: result.precio_venta,
      clientName: "",
      description: "",
    });
    setShowPrintModal(true);
  };

  const handleSmartRound = (direction) => {
    const current = printConfig.adjustedPrice;
    const step = 100;
    let next;

    if (direction === "up") {
      if (current % step === 0) {
        next = current + step;
      } else {
        next = Math.ceil(current / step) * step;
      }
    } else {
      if (current % step === 0) {
        next = current - step;
      } else {
        next = Math.floor(current / step) * step;
      }
    }
    setPrintConfig((prev) => ({ ...prev, adjustedPrice: Math.max(0, next) }));
  };

  const handleConfirmPrint = () => {
    if (!printConfig.materialId) {
      toast.error("Por favor selecciona un material del inventario.");
      return;
    }
    const material = inventory.find((i) => i.id === printConfig.materialId);
    if (!material) return;

    const pesoNecesario = parseFloat(inputs.peso) || 0;

    const executePrint = () => {
      const newInventory = inventory.map((item) => {
        if (item.id === printConfig.materialId) {
          return { ...item, stock: item.stock - pesoNecesario };
        }
        return item;
      });
      setInventory(newInventory);

      const desc = printConfig.description
        ? `${printConfig.description} - ${inputs.peso}g ${material.tipo} ${material.color}`
        : `Impresión: ${inputs.peso}g de ${material.tipo} ${material.color}`;

      const newMovement = {
        id: crypto.randomUUID(),
        fecha: `${new Date().toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })} - ${new Date().toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}`,
        tipo: "INGRESO",
        monto: printConfig.adjustedPrice,
        descripcion: desc,
        nombre: printConfig.clientName || "",
        stockRestoration: {
          materialId: material.id,
          quantity: pesoNecesario,
        },
      };
      setCashbook([newMovement, ...cashbook]);

      setShowPrintModal(false);
      toast.dismiss();
      setTimeout(
        () =>
          toast.success(
            "¡Registrado exitosamente! Stock actualizado e ingreso en caja."
          ),
        100
      );
      // Reset Data
      setInputs({
        tiempo_horas: "",
        tiempo_minutos: "",
        peso: "",
        costo_insumos: 0,
      });
      setResult(null);
    };

    if (material.stock < pesoNecesario) {
      toast.error(
        ({ closeToast }) => (
          <ConfirmToast
            message={`El stock actual (${material.stock}g) es menor al necesario (${pesoNecesario}g). ¿Continuar igual?`}
            closeToast={closeToast}
            onConfirm={executePrint}
          />
        ),
        {
          autoClose: false,
          closeOnClick: false,
          icon: false,
        }
      );
      return;
    }

    executePrint();
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;

    if (editingPresetId) {
      // Update existing
      const updatedPresets = presets.map((p) =>
        p.id === editingPresetId
          ? { ...p, name: presetName, config: { ...config } }
          : p
      );
      setPresets(updatedPresets);
      toast.success("Preset actualizado correctamente");
    } else {
      // Create new
      const newPreset = {
        id: crypto.randomUUID(),
        name: presetName,
        config: { ...config },
      };
      setPresets([...presets, newPreset]);
      toast.success("Preset guardado correctamente");
    }
    setPresetName("");
    setEditingPresetId(null);
  };

  const handleEditPreset = (preset) => {
    setEditingPresetId(preset.id);
    setPresetName(preset.name);
    setConfig(preset.config);
  };

  const handleCancelEditPreset = () => {
    setEditingPresetId(null);
    setPresetName("");
  };

  const handleResetInputs = () => {
    setInputs({
      tiempo_horas: "",
      tiempo_minutos: "",
      peso: "",
      costo_insumos: 0,
    });
    setResult(null);
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("dragIndex", index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e, dropIndex) => {
    const dragIndex = Number(e.dataTransfer.getData("dragIndex"));
    if (dragIndex === dropIndex) return;

    const newPresets = [...presets];
    const [draggedItem] = newPresets.splice(dragIndex, 1);
    newPresets.splice(dropIndex, 0, draggedItem);

    setPresets(newPresets);
  };

  const handleLoadPreset = (id) => {
    if (!id) return;
    const preset = presets.find((p) => p.id === id);
    if (preset) {
      setConfig(preset.config);
    }
  };

  const handleDeletePreset = (id) => {
    toast.error(
      ({ closeToast }) => (
        <ConfirmToast
          message="¿Eliminar este preset?"
          closeToast={closeToast}
          onConfirm={() => {
            setPresets(presets.filter((p) => p.id !== id));
            toast.dismiss();
            setTimeout(() => toast.info("Preset eliminado"), 100);
          }}
        />
      ),
      {
        autoClose: false,
        closeOnClick: false,
        icon: false,
      }
    );
  };

  return (
    <div className="container" style={{ position: "relative" }}>
      {/* Print Modal Overlay */}
      {showPrintModal && (
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
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "450px",
              margin: "1rem",
              background: "var(--surface)",
            }}
          >
            <h3 className="section-title">Confirmar Impresión</h3>

            <div style={{ marginBottom: "1.5rem" }}>
              <label className="label">
                1. Seleccionar Material (Inventario)
              </label>
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
                    {item.tipo} {item.marca} - {item.color} ({item.stock}g
                    disp.)
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
                    title="Redondear arriba (+100)"
                    style={{ padding: "0.25rem 0.5rem" }}
                  >
                    ▲
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleSmartRound("down")}
                    title="Redondear abajo (-100)"
                    style={{ padding: "0.25rem 0.5rem" }}
                  >
                    ▼
                  </button>
                </div>
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                  marginTop: "0.5rem",
                }}
              >
                Este monto se ingresará en el <strong>Libro de Caja</strong>.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "flex-end",
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => setShowPrintModal(false)}
              >
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleConfirmPrint}>
                Aceptar y Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid-2">
        {/* Columna Izquierda: Inputs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Tarjeta de Configuración (Gastos Fijos) */}
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
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginBottom: "1rem",
                  }}
                >
                  <input
                    className="input"
                    placeholder="Nombre nuevo preset (ej: PETG Alta Calidad)"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleSavePreset}
                    title={
                      editingPresetId ? "Actualizar Preset" : "Guardar Preset"
                    }
                  >
                    {editingPresetId ? (
                      <RefreshCw size={18} />
                    ) : (
                      <Save size={18} />
                    )}
                  </button>
                  {editingPresetId && (
                    <button
                      className="btn btn-secondary"
                      onClick={handleCancelEditPreset}
                      title="Cancelar Edición"
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
                        onDragEnter={(e) => {
                          e.currentTarget.style.border =
                            "1px dashed var(--primary)";
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.style.border =
                            "1px solid transparent";
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <GripVertical
                            size={16}
                            style={{
                              color: "var(--text-secondary)",
                              cursor: "grab",
                            }}
                          />
                          <span style={{ fontSize: "0.9rem" }}>{p.name}</span>
                        </div>

                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            className="btn-icon"
                            style={{ color: "var(--text-secondary)" }}
                            onClick={() => handleEditPreset(p)}
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="btn-icon"
                            style={{ color: "var(--danger)" }}
                            onClick={() => handleDeletePreset(p.id)}
                            title="Eliminar"
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

            {/* PRESET LOADER (Always Visible if not managing) */}
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

            {/* ALWAYS EDITABLE CONFIG GRID */}
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
                        // Find price in inventory
                        const mat = inventory.find((i) => i.id === id);
                        if (mat) {
                          setConfig({
                            ...config,
                            precio_filamento: mat.precio,
                          });
                        }
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
                        setSelectedMaterialId(""); // Clear selection on manual edit
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

              <div className="input-card-compact">
                <span className="label-compact">
                  <Zap size={14} /> Energía ($/kWh)
                </span>
                <input
                  type="number"
                  className="input-compact-transparent"
                  value={config.precio_kwh}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      precio_kwh: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className="input-card-compact">
                <span className="label-compact">
                  <DollarSign size={14} /> Consumo (W)
                </span>
                <input
                  type="number"
                  className="input-compact-transparent"
                  value={config.consumo_watts}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      consumo_watts: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className="input-card-compact">
                <span className="label-compact">
                  <AlertCircle size={14} /> Desgaste ($/h)
                </span>
                <input
                  type="number"
                  className="input-compact-transparent"
                  value={config.desgaste_hora}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      desgaste_hora: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className="input-card-compact">
                <span className="label-compact">
                  <Scale size={14} /> Margen Error (%)
                </span>
                <input
                  type="number"
                  className="input-compact-transparent"
                  value={config.margen_error}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      margen_error: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div className="input-card-compact">
                <span className="label-compact">Multiplicador (x)</span>
                <input
                  type="number"
                  className="input-compact-transparent"
                  step="0.1"
                  value={config.multiplicador_ganancia}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      multiplicador_ganancia: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Tarjeta de Pieza (Inputs Principales) */}
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
                <Clock
                  size={16}
                  style={{ display: "inline", verticalAlign: "text-bottom" }}
                />{" "}
                Tiempo de Impresión
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
                <Scale
                  size={16}
                  style={{ display: "inline", verticalAlign: "text-bottom" }}
                />{" "}
                Peso (Gramos)
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
                <DollarSign
                  size={16}
                  style={{ display: "inline", verticalAlign: "text-bottom" }}
                />{" "}
                Costo Extra (Insumos)
              </label>
              <input
                type="number"
                className="input"
                placeholder="Ej: 500 (Tornillos, Imanes)"
                value={inputs.costo_insumos}
                onChange={(e) =>
                  setInputs({ ...inputs, costo_insumos: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* Columna Derecha: Resultados */}
        <div style={{ height: "100%" }}>
          {result && (
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
              {/* 1. TITLE */}
              <div
                className="section-title"
                style={{ color: "var(--primary)", marginBottom: 0 }}
              >
                Resumen de Costos
              </div>

              {/* 2. COST BREAKDOWN */}
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
                  <span
                    style={{
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                    }}
                  >
                    Costo Total Real
                  </span>
                  <span style={{ fontWeight: 700, fontSize: "1.25rem" }}>
                    ${result.costo_total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* 3. PRICE CARD */}
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
                    x{config.multiplicador_ganancia}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "2.5rem",
                    fontWeight: 800,
                    lineHeight: 1,
                  }}
                >
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

              {/* 4. ACTION BUTTON */}
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
          )}
          {!result && (
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
          )}
        </div>
      </div>

      {/* PRINT CONFIRMATION MODAL */}
      {showPrintModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPrintModal(false);
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "420px",
              padding: "1.5rem",
              background: "var(--background)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              border: "1px solid var(--border)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Save size={20} className="text-primary" />
              Confirmar Venta
            </h3>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              {/* Client Name Input */}
              <div className="input-group" style={{ margin: 0 }}>
                <label className="label">
                  <User size={14} style={{ marginRight: "4px" }} />
                  Nombre del Cliente
                </label>
                <input
                  className="input"
                  placeholder="Opcional (Ej: Juan Perez)"
                  value={printConfig.clientName || ""}
                  onChange={(e) =>
                    setPrintConfig({
                      ...printConfig,
                      clientName: e.target.value,
                    })
                  }
                  autoFocus
                />
              </div>

              {/* Description Input */}
              <div className="input-group" style={{ margin: 0 }}>
                <label className="label">
                  <FileText size={14} style={{ marginRight: "4px" }} />
                  Descripción Extra
                </label>
                <input
                  className="input"
                  placeholder="Ej: Pieza decorativa"
                  value={printConfig.description || ""}
                  onChange={(e) =>
                    setPrintConfig({
                      ...printConfig,
                      description: e.target.value,
                    })
                  }
                />
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    marginTop: "0.25rem",
                  }}
                >
                  Se guardará como:{" "}
                  {printConfig.description
                    ? `${printConfig.description} - ...`
                    : "Impresión: ..."}
                </span>
              </div>

              {/* Price Preview */}
              <div
                style={{
                  background: "var(--surface)",
                  padding: "1rem",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                  marginTop: "0.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                    fontSize: "0.9rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span>Precio Base:</span>
                  <span>${printConfig.adjustedPrice.toFixed(2)}</span>
                </div>
                {/* Smart Rounding Controls could go here if needed, but keeping simple */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    borderTop: "1px solid var(--border)",
                    paddingTop: "0.5rem",
                  }}
                >
                  <span style={{ fontWeight: 600 }}>Precio Final:</span>
                  <span
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 800,
                      color: "var(--success)",
                    }}
                  >
                    ${printConfig.adjustedPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "1rem",
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => setShowPrintModal(false)}
              >
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleConfirmPrint}>
                Confirmar e Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultRow({ label, value, icon, color }) {
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
}
