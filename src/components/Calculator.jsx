import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import "./CalculatorCompact.css";
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
  Loader2,
} from "lucide-react";

const ConfirmToast = ({ closeToast, onConfirm, message }) => (
  <div>
    <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem" }}>{message}</p>
    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
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

const DEFAULT_CONFIG = {
  precio_filamento: 25000,
  precio_kwh: 150.0,
  consumo_watts: 150,
  desgaste_hora: 50.0,
  precio_repuestos: 0,
  margen_error: 5.0,
  multiplicador_ganancia: 2.0,
};

export function Calculator() {
  const { user } = useAuth();
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [presets, setPresets] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [presetName, setPresetName] = useState("");
  const [editingPresetId, setEditingPresetId] = useState(null);
  const [showPresetsManager, setShowPresetsManager] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState("");

  const [inputs, setInputs] = useState({
    tiempo_horas: "",
    tiempo_minutos: "",
    peso: "",
    costo_insumos: 0,
  });

  const [result, setResult] = useState(null);

  // Load Data
  useEffect(() => {
    Promise.all([fetchConfig(), fetchPresets(), fetchInventory()]).finally(() =>
      setLoading(false)
    );
  }, []);

  const fetchConfig = async () => {
    const { data } = await supabase
      .from("user_config")
      .select("config")
      .eq("user_id", user.id)
      .single();
    if (data && data.config) {
      setConfig({ ...DEFAULT_CONFIG, ...data.config });
    }
  };

  const fetchPresets = async () => {
    const { data } = await supabase
      .from("presets")
      .select("*")
      .order("created_at", { ascending: true });
    if (data) {
      setPresets(data);
      // Auto-load last used preset
      const lastPresetId = localStorage.getItem("limonero_last_preset_id");
      if (lastPresetId) {
        const found = data.find((p) => p.id === lastPresetId);
        if (found) setConfig(found.config);
      }
    }
  };

  const fetchInventory = async () => {
    const { data } = await supabase.from("inventory").select("*").order("tipo");
    if (data) setInventory(data);
  };

  // Debounced Config Save
  const configTimeoutRef = useRef(null);
  useEffect(() => {
    if (loading) return;

    if (configTimeoutRef.current) clearTimeout(configTimeoutRef.current);

    configTimeoutRef.current = setTimeout(async () => {
      const { error } = await supabase
        .from("user_config")
        .upsert(
          { user_id: user.id, config: config },
          { onConflict: "user_id" }
        );
      if (error) console.error("Error saving config:", error);
    }, 1000); // 1s debounce

    return () => clearTimeout(configTimeoutRef.current);
  }, [config, loading, user.id]);

  const handleCalculate = () => {
    const t_horas = parseInt(inputs.tiempo_horas) || 0;
    const t_minutos = parseInt(inputs.tiempo_minutos) || 0;
    const tiempo_total_horas = t_horas + t_minutos / 60;
    const peso_gr = parseFloat(inputs.peso) || 0;
    const insumos = parseFloat(inputs.costo_insumos) || 0;

    const costo_material = (config.precio_filamento / 1000) * peso_gr;
    const consumo_kwh = (config.consumo_watts / 1000) * tiempo_total_horas;
    const costo_energia = consumo_kwh * config.precio_kwh;
    const costo_desgaste = tiempo_total_horas * config.desgaste_hora;

    const subtotal_costos =
      costo_material + costo_energia + costo_desgaste + insumos;
    const costo_error = subtotal_costos * (config.margen_error / 100);
    const costo_total = subtotal_costos + costo_error;

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

  useEffect(() => {
    if (inputs.peso || inputs.tiempo_horas) {
      handleCalculate();
    }
  }, [inputs, config]);

  // --- Print Modal Logic ---
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printConfig, setPrintConfig] = useState({
    materialId: "",
    adjustedPrice: 0,
    clientName: "",
    description: "",
  });

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
      next =
        current % step === 0
          ? current + step
          : Math.ceil(current / step) * step;
    } else {
      next =
        current % step === 0
          ? current - step
          : Math.floor(current / step) * step;
    }
    setPrintConfig((prev) => ({ ...prev, adjustedPrice: Math.max(0, next) }));
  };

  const handleConfirmPrint = async () => {
    if (!printConfig.materialId) {
      toast.error("Por favor selecciona un material del inventario.");
      return;
    }

    // Refresh Item Stock
    const { data: material, error: fetchError } = await supabase
      .from("inventory")
      .select("*")
      .eq("id", printConfig.materialId)
      .single();

    if (fetchError || !material) {
      toast.error("Error al obtener material");
      return;
    }

    const pesoNecesario = parseFloat(inputs.peso) || 0;

    const executePrint = async () => {
      try {
        // 1. Update Stock
        const newStock = (material.stock || 0) - pesoNecesario;
        const { error: stockError } = await supabase
          .from("inventory")
          .update({ stock: newStock })
          .eq("id", printConfig.materialId);

        if (stockError) throw stockError;

        // Update local inventory state
        setInventory((prev) =>
          prev.map((item) =>
            item.id === printConfig.materialId
              ? { ...item, stock: newStock }
              : item
          )
        );

        // 2. Add to Cashbook
        const desc = printConfig.description
          ? `${printConfig.description} - ${inputs.peso}g ${material.tipo} ${material.color}`
          : `Impresión: ${inputs.peso}g de ${material.tipo} ${material.color}`;

        const payload = {
          user_id: user.id,
          fecha: new Date().toISOString(),
          tipo: "INGRESO",
          monto: printConfig.adjustedPrice,
          descripcion: desc,
          nombre: printConfig.clientName || "",
          metadata: {
            stockRestoration: {
              materialId: material.id,
              quantity: pesoNecesario,
            },
          },
        };

        const { error: cashError } = await supabase
          .from("cashbook")
          .insert([payload]);
        if (cashError) throw cashError;

        setShowPrintModal(false);
        toast.dismiss();
        toast.success(
          "¡Registrado exitosamente! Stock actualizado e ingreso en caja."
        );

        handleResetInputs();
      } catch (error) {
        toast.error("Error al registrar: " + error.message);
      }
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
        { autoClose: false, closeOnClick: false, icon: false }
      );
      return;
    }

    executePrint();
  };

  // --- Presets Logic ---
  const handleSavePreset = async () => {
    if (!presetName.trim()) return;

    try {
      const payload = {
        user_id: user.id,
        name: presetName,
        config: config,
      };

      if (editingPresetId) {
        const { error } = await supabase
          .from("presets")
          .update(payload)
          .eq("id", editingPresetId);
        if (error) throw error;
        setPresets((prev) =>
          prev.map((p) => (p.id === editingPresetId ? { ...p, ...payload } : p))
        );
        toast.success("Preset actualizado");
      } else {
        const { data, error } = await supabase
          .from("presets")
          .insert([payload])
          .select();
        if (error) throw error;
        setPresets((prev) => [...prev, ...data]);
        toast.success("Preset guardado");
      }
      setPresetName("");
      setEditingPresetId(null);
    } catch (error) {
      toast.error("Error al guardar preset: " + error.message);
    }
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

  const handleDeletePreset = (id) => {
    toast.error(
      ({ closeToast }) => (
        <ConfirmToast
          message="¿Eliminar este preset?"
          closeToast={closeToast}
          onConfirm={async () => {
            try {
              const { error } = await supabase
                .from("presets")
                .delete()
                .eq("id", id);
              if (error) throw error;
              setPresets((prev) => prev.filter((p) => p.id !== id));
              toast.dismiss();
              toast.info("Preset eliminado");
            } catch (error) {
              toast.error("Error al eliminar: " + error.message);
            }
          }}
        />
      ),
      { autoClose: false, closeOnClick: false, icon: false }
    );
  };

  const handleLoadPreset = (id) => {
    const preset = presets.find((p) => p.id === id);
    if (preset) {
      setConfig(preset.config);
      localStorage.setItem("limonero_last_preset_id", id);
    }
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

  // Drag and Drop Logic (Local Reordering of View, logic doesn't persist order for now unless we add order col)
  // Current implementation only reorders local array.
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("dragIndex", index);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e, dropIndex) => {
    const dragIndex = Number(e.dataTransfer.getData("dragIndex"));
    if (dragIndex === dropIndex) return;
    const newPresets = [...presets];
    const [draggedItem] = newPresets.splice(dragIndex, 1);
    newPresets.splice(dropIndex, 0, draggedItem);
    setPresets(newPresets);
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <Loader2 className="animate-spin" /> Cargando calculadora...
      </div>
    );

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
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPrintModal(false);
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
                    placeholder="Nombre nuevo preset"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleSavePreset}
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
                    {" "}
                    Filamento / Material{" "}
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
                          setConfig({
                            ...config,
                            precio_filamento: mat.precio,
                          });
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
                    {" "}
                    {item.icon} {item.label}{" "}
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

          {/* Tarjeta de Pieza (Inputs Principales) */}
          <div className="card">
            <div
              className="section-title"
              style={{ justifyContent: "space-between" }}
            >
              <span>
                {" "}
                <RefreshCw size={20} /> Datos de la Pieza{" "}
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
                {" "}
                <Clock size={16} /> Tiempo de Impresión{" "}
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
                {" "}
                <Scale size={16} /> Peso (Gramos){" "}
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
                {" "}
                <DollarSign size={16} /> Costo Extra (Insumos){" "}
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
        </div>

        {/* Columna Derecha: Resultados */}
        <div style={{ height: "100%" }}>
          {result ? (
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
                {" "}
                Resumen de Costos{" "}
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
                  <span
                    style={{ fontWeight: 600, color: "var(--text-secondary)" }}
                  >
                    {" "}
                    Costo Total Real{" "}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: "1.25rem" }}>
                    {" "}
                    ${result.costo_total.toFixed(2)}{" "}
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
                <div
                  style={{ fontSize: "2.5rem", fontWeight: 800, lineHeight: 1 }}
                >
                  {" "}
                  ${result.precio_venta.toFixed(2)}{" "}
                </div>
                <div
                  style={{
                    marginTop: "0.5rem",
                    opacity: 0.9,
                    fontSize: "0.875rem",
                  }}
                >
                  {" "}
                  Ganancia Neta: ${result.ganancia_neta.toFixed(2)}{" "}
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
          ) : (
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
        {" "}
        ${value.toFixed(2)}{" "}
      </span>
    </div>
  );
}
