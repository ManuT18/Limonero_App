import React, { useState, useEffect } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
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
} from "lucide-react";

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

  // Datos de la Pieza
  const [inputs, setInputs] = useState({
    tiempo_horas: "",
    tiempo_minutos: "",
    peso: "", // gramos
    costo_insumos: 0, // tornillos, imanes, etc.
  });

  const [result, setResult] = useState(null);
  const [showConfig, setShowConfig] = useState(false);

  const handleCalculate = () => {
    // 1. Normalizar inputs
    const t_horas = parseFloat(inputs.tiempo_horas) || 0;
    const t_minutos = parseFloat(inputs.tiempo_minutos) || 0;
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
        materialId: "", 
        adjustedPrice: result.precio_venta
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
      alert("Por favor selecciona un material del inventario.");
      return;
    }
    const material = inventory.find((i) => i.id === printConfig.materialId);
    if (!material) return;

    const pesoNecesario = parseFloat(inputs.peso) || 0;
    if (material.stock < pesoNecesario) {
        if(!confirm(`El stock actual (${material.stock}g) es menor al necesario (${pesoNecesario}g). ¿Continuar igual?`)) {
            return;
        }
    }

    const newInventory = inventory.map((item) => {
      if (item.id === printConfig.materialId) {
        return { ...item, stock: item.stock - pesoNecesario };
      }
      return item;
    });
    setInventory(newInventory);

    const newMovement = {
      id: crypto.randomUUID(),
      fecha: new Date().toLocaleString(),
      tipo: "INGRESO",
      monto: printConfig.adjustedPrice,
      descripcion: `Impresión: ${inputs.peso}g de ${material.tipo} ${material.color}`,
    };
    setCashbook([newMovement, ...cashbook]);

    setShowPrintModal(false);
    alert("¡Registrado exitosamente!\n- Stock descontado\n- Ingreso agregado a caja");
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
                  <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem'}}>
                      Se descontarán <strong>{inputs.peso}g</strong> del stock seleccionado.
                  </div>
              )}
            </div>

            <div style={{ marginBottom: "2rem" }}>
              <label className="label">2. Ajustar Precio Final (Smart Rounding)</label>
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
                <div style={{ flex: 1, fontSize: "2rem", fontWeight: "bold", textAlign: 'center' }}>
                  ${printConfig.adjustedPrice.toFixed(0)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <button 
                        className="btn btn-secondary" 
                        onClick={() => handleSmartRound("up")}
                        title="Redondear arriba (+100)"
                        style={{padding: '0.25rem 0.5rem'}}
                    >
                        ▲
                    </button>
                    <button 
                        className="btn btn-secondary" 
                        onClick={() => handleSmartRound("down")}
                        title="Redondear abajo (-100)"
                        style={{padding: '0.25rem 0.5rem'}}
                    >
                        ▼
                    </button>
                </div>
              </div>
              <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem'}}>
                  Este monto se ingresará en el <strong>Libro de Caja</strong>.
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
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
                onClick={() => setShowConfig(!showConfig)}
                style={{ fontSize: "0.875rem" }}
              >
                {showConfig ? "Ocultar" : "Editar"}
              </button>
            </div>

            {showConfig ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div className="input-group">
                  <label className="label">Precio Filamento ($/KG)</label>
                  <input
                    type="number"
                    className="input"
                    value={config.precio_filamento}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        precio_filamento: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="input-group">
                  <label className="label">Precio Energía ($/kWh)</label>
                  <input
                    type="number"
                    className="input"
                    value={config.precio_kwh}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        precio_kwh: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="input-group">
                  <label className="label">Consumo Máquina (Watts)</label>
                  <input
                    type="number"
                    className="input"
                    value={config.consumo_watts}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        consumo_watts: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="input-group">
                  <label className="label">Desgaste ($/Hora)</label>
                  <input
                    type="number"
                    className="input"
                    value={config.desgaste_hora}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        desgaste_hora: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="input-group">
                  <label className="label">Margen Error (%)</label>
                  <input
                    type="number"
                    className="input"
                    value={config.margen_error}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        margen_error: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="input-group">
                  <label className="label">Multiplicador Ganancia</label>
                  <input
                    type="number"
                    className="input"
                    step="0.5"
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
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    background: "var(--background)",
                    padding: "0.5rem",
                    borderRadius: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Filamento
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    ${config.precio_filamento}/kg
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    background: "var(--background)",
                    padding: "0.5rem",
                    borderRadius: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Energía
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    ${config.precio_kwh}/kWh
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    background: "var(--background)",
                    padding: "0.5rem",
                    borderRadius: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Consumo
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    {config.consumo_watts}W
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    background: "var(--background)",
                    padding: "0.5rem",
                    borderRadius: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Desgaste
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    ${config.desgaste_hora}/h
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    background: "var(--background)",
                    padding: "0.5rem",
                    borderRadius: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Margen Error
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    {config.margen_error}%
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    background: "var(--background)",
                    padding: "0.5rem",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--primary)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-secondary)",
                      marginBottom: "0.2rem",
                    }}
                  >
                    Multiplicador
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "2px",
                    }}
                  >
                    <span
                      style={{ color: "var(--primary)", fontWeight: "bold" }}
                    >
                      x
                    </span>
                    <input
                      type="number"
                      step="1"
                      value={config.multiplicador_ganancia}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          multiplicador_ganancia: parseFloat(e.target.value),
                        })
                      }
                      style={{
                        width: "100%",
                        border: "none",
                        background: "transparent",
                        fontWeight: 600,
                        color: "var(--primary)",
                        padding: 0,
                        margin: 0,
                        fontSize: "1rem",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tarjeta de Pieza (Inputs Principales) */}
          <div className="card">
            <div className="section-title">
              <RefreshCw size={20} /> Datos de la Pieza
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
        <div>
          {result && (
            <div className="card card-result">
              <div
                className="section-title"
                style={{ color: "var(--primary)" }}
              >
                Resumen de Costos
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
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
                    margin: "1rem 0",
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
                    Costo Total Real
                  </span>
                  <span style={{ fontWeight: 700, fontSize: "1.25rem" }}>
                    ${result.costo_total.toFixed(2)}
                  </span>
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
                    marginTop: "1rem",
                    boxShadow: "0 10px 15px -3px rgba(70, 229, 123, 0.3)",
                    width: "100%",
                  }}
                  onClick={handleOpenPrint}
                >
                  Imprimir
                </button>
              </div>
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
                minHeight: "300px",
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
        ${value.toFixed(2)}
      </span>
    </div>
  );
}
