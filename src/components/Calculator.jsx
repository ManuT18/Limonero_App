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
  1. IMPORTACIONES
  - Hooks: useState, useEffect, useRef.
  - Supabase/Context: Datos y auth.
  - Servicios: transactionService (Lógica de negocio extraída).
  - Constantes: Keys para storage.
  - Componentes: Sub-componentes refactorizados para UI limpia.
  -------------------------------------------------------------------------
*/
import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { supabase } from "../hooks/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";
import "./CalculatorCompact.css";

// Servicios y Constantes
import { registerPrintTransaction } from "../services/transactionService";
import { STORAGE_KEYS } from "../constants/keys";

// Sub-componentes
import { ConfigSection } from "./calculator/ConfigSection";
import { PieceInputs } from "./calculator/PieceInputs";
import { ResultsSection } from "./calculator/ResultsSection";
import { PrintModal } from "./calculator/PrintModal";

/*
  -------------------------------------------------------------------------
  2. COMPONENTE AUXILIAR: ConfirmToast
  Pequeño diálogo dentro de una notificación.
  -------------------------------------------------------------------------
*/
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

/*
  -------------------------------------------------------------------------
  3. CONFIGURACIÓN POR DEFECTO
  -------------------------------------------------------------------------
*/
const DEFAULT_CONFIG = {
  precio_filamento: 25000,
  precio_kwh: 150.0,
  consumo_watts: 150,
  desgaste_hora: 50.0,
  precio_repuestos: 0,
  margen_error: 5.0,
  multiplicador_ganancia: 2.0,
};

/*
  -------------------------------------------------------------------------
  4. COMPONENTE CALCULATOR (Refactorizado)
  Actúa como Contenedor/Controlador principal:
  - Gestiona el estado global de la calculadora.
  - Orquesta la carga de datos.
  - Coordina los sub-componentes.
  -------------------------------------------------------------------------
*/
export function Calculator() {
  const { user } = useAuth();

  // -- ESTADOS DE DATOS --
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [presets, setPresets] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  // -- ESTADOS DE UI / FORMULARIO --
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

  // -- ESTADOS MODAL DE IMPRESIÓN --
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printConfig, setPrintConfig] = useState({
    materialId: "",
    adjustedPrice: 0,
    clientName: "",
    description: "",
  });

  // -----------------------------------------------------------------------
  // A. CARGA INICIAL
  // -----------------------------------------------------------------------
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
      const lastPresetId = localStorage.getItem(STORAGE_KEYS.LAST_PRESET_ID);
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

  // -----------------------------------------------------------------------
  // B. AUTOSAVE CONFIG
  // -----------------------------------------------------------------------
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
    }, 1000);

    return () => clearTimeout(configTimeoutRef.current);
  }, [config, loading, user.id]);

  // -----------------------------------------------------------------------
  // C. LÓGICA DE CÁLCULO
  // -----------------------------------------------------------------------
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

  // -----------------------------------------------------------------------
  // D. GESTIÓN DE PRESETS (CRUD)
  // -----------------------------------------------------------------------
  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    try {
      const payload = { user_id: user.id, name: presetName, config: config };
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
      localStorage.setItem(STORAGE_KEYS.LAST_PRESET_ID, id);
    }
  };

  // Drag and Drop Logic (Local)
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

  // -----------------------------------------------------------------------
  // E. LÓGICA DEL MODAL DE IMPRESIÓN (Estado y Submit)
  // -----------------------------------------------------------------------
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

    const pesoNecesario = parseFloat(inputs.peso) || 0;
    const materialDetails = inventory.find(
      (m) => m.id === printConfig.materialId
    ) || { tipo: "Material", color: "Generico" };

    // Función auxiliar para ejecutar la transacción
    const execute = async () => {
      const { success, newStock, error } = await registerPrintTransaction({
        userId: user.id,
        materialId: printConfig.materialId,
        quantity: pesoNecesario,
        price: printConfig.adjustedPrice,
        clientName: printConfig.clientName,
        description: printConfig.description,
        materialDetails,
      });

      if (success) {
        // Actualizar estado local
        setInventory((prev) =>
          prev.map((item) =>
            item.id === printConfig.materialId
              ? { ...item, stock: newStock }
              : item
          )
        );
        setShowPrintModal(false);
        toast.dismiss();
        toast.success(
          "¡Registrado exitosamente! Stock actualizado e ingreso en caja."
        );
        handleResetInputs();
      } else {
        toast.error("Error al registrar: " + error.message);
      }
    };

    // Validación de stock
    const currentStock = materialDetails.stock || 0;
    if (currentStock < pesoNecesario) {
      toast.error(
        ({ closeToast }) => (
          <ConfirmToast
            message={`El stock actual (${currentStock}g) es menor al necesario (${pesoNecesario}g). ¿Continuar igual?`}
            closeToast={closeToast}
            onConfirm={execute}
          />
        ),
        { autoClose: false, closeOnClick: false, icon: false }
      );
    } else {
      await execute();
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

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <Loader2 className="animate-spin" /> Cargando calculadora...
      </div>
    );

  // -----------------------------------------------------------------------
  // F. RENDER PRINCIPAL
  // -----------------------------------------------------------------------
  return (
    <div className="container" style={{ position: "relative" }}>
      {/* 1. Modal Overlay */}
      <PrintModal
        show={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        onConfirm={handleConfirmPrint}
        printConfig={printConfig}
        setPrintConfig={setPrintConfig}
        inputs={inputs}
        inventory={inventory}
        handleSmartRound={handleSmartRound}
      />

      <div className="grid-2">
        {/* 2. Columna Izquierda: Configuración e Inputs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <ConfigSection
            config={config}
            setConfig={setConfig}
            showPresetsManager={showPresetsManager}
            setShowPresetsManager={setShowPresetsManager}
            presets={presets}
            presetName={presetName}
            setPresetName={setPresetName}
            editingPresetId={editingPresetId}
            handleSavePreset={handleSavePreset}
            handleEditPreset={handleEditPreset}
            handleCancelEditPreset={handleCancelEditPreset}
            handleDeletePreset={handleDeletePreset}
            handleLoadPreset={handleLoadPreset}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            inventory={inventory}
            selectedMaterialId={selectedMaterialId}
            setSelectedMaterialId={setSelectedMaterialId}
          />

          <PieceInputs
            inputs={inputs}
            setInputs={setInputs}
            handleResetInputs={handleResetInputs}
          />
        </div>

        {/* 3. Columna Derecha: Resultados */}
        <div style={{ height: "100%" }}>
          <ResultsSection
            result={result}
            config={config}
            handleOpenPrint={handleOpenPrint}
          />
        </div>
      </div>
    </div>
  );
}
