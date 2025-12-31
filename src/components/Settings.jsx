import React, { useRef, useState } from "react";
import { toast } from "react-toastify";
import { supabase } from "../hooks/supabaseClient";
import { useAuth } from "../context/AuthContext";
import {
  Download,
  Upload,
  Settings as SettingsIcon,
  Save,
  AlertTriangle,
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

/* Existing CSV UTILS */
const convertToCSV = (objArray) => {
  const array = typeof objArray !== "object" ? JSON.parse(objArray) : objArray;
  if (array.length === 0) return "";
  const header = Object.keys(array[0]).join(",");
  const rows = array
    .map((obj) => {
      return Object.values(obj)
        .map((value) => {
          const stringValue = value ? value.toString() : "";
          if (stringValue.includes(",") || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(",");
    })
    .join("\r\n");
  return `${header}\r\n${rows}`;
};

const downloadCSV = (csvContent, fileName) => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Simple CSV Parser
const parseCSV = (text) => {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, ""));

  return lines.slice(1).map((line) => {
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (i < line.length - 1 && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current);

    return headers.reduce((obj, header, i) => {
      obj[header] = values[i] ? values[i].replace(/^"|"$/g, "") : "";
      return obj;
    }, {});
  });
};

// Helper to parse dates from various CSV formats
const parseCSVDate = (dateStr) => {
  if (!dateStr) return new Date().toISOString();

  // Case 1: "DD/MM/YYYY - HH:mm" (Custom App Format)
  // Regex matches: 27/12/2025 - 03:22
  const ddmmyyyyMatch = dateStr.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s-\s(\d{1,2}):(\d{1,2})$/
  );
  if (ddmmyyyyMatch) {
    const [_, day, month, year, hours, minutes] = ddmmyyyyMatch;
    return new Date(year, month - 1, day, hours, minutes).toISOString();
  }

  // Case 2: Standard Date parse (ISO, US format "12/15/2025, ...")
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString();
  }

  // Fallback: Current time if unparseable
  console.warn("Could not parse date:", dateStr, "- falling back to now.");
  return new Date().toISOString();
};

export function Settings() {
  const fileInputRef = useRef(null);
  const csvInputRef = useRef(null);
  const [importType, setImportType] = useState(null); // 'inventory' | 'cashbook'
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // ... existing handleExport ...
  const handleExport = async () => {
    try {
      setLoading(true);
      const { data: inventory } = await supabase.from("inventory").select("*");
      const { data: cashbook } = await supabase.from("cashbook").select("*");
      const { data: presets } = await supabase.from("presets").select("*");
      const { data: config } = await supabase
        .from("user_config")
        .select("*")
        .eq("user_id", user.id)
        .single();

      const data = {
        inventory: inventory || [],
        cashbook: cashbook || [],
        presets: presets || [],
        config: config?.config || {},
        exportDate: new Date().toISOString(),
        version: "v4-supabase",
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup_limonero_cloud_${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Exportación completada");
    } catch (error) {
      toast.error("Error al exportar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ... existing JSON import logic ...
  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (!json.inventory && !json.cashbook) {
          toast.error("El archivo no es un backup válido.");
          return;
        }

        const proceedImport = async () => {
          try {
            setLoading(true);
            toast.info("Iniciando restauración...");

            if (json.inventory && json.inventory.length > 0) {
              const inventoryData = json.inventory.map((item) => ({
                ...item,
                user_id: user.id,
              }));
              const { error } = await supabase
                .from("inventory")
                .upsert(inventoryData);
              if (error) throw error;
            }
            if (json.cashbook && json.cashbook.length > 0) {
              const cashData = json.cashbook.map((item) => ({
                ...item,
                user_id: user.id,
              }));
              const { error } = await supabase
                .from("cashbook")
                .upsert(cashData);
              if (error) throw error;
            }
            if (json.presets && json.presets.length > 0) {
              const presetData = json.presets.map((item) => ({
                ...item,
                user_id: user.id,
              }));
              const { error } = await supabase
                .from("presets")
                .upsert(presetData);
              if (error) throw error;
            }
            if (json.config) {
              const { error } = await supabase
                .from("user_config")
                .upsert({ user_id: user.id, config: json.config });
              if (error) throw error;
            }

            toast.success("Backup restaurado en la nube correctamente.");
            setTimeout(() => window.location.reload(), 1500);
          } catch (error) {
            console.error(error);
            toast.error("Error al importar: " + error.message);
          } finally {
            setLoading(false);
          }
        };

        toast.error(
          ({ closeToast }) => (
            <ConfirmToast
              message="¿Estás seguro? Esto fusionará/sobrescribirá los datos."
              closeToast={closeToast}
              onConfirm={proceedImport}
            />
          ),
          { autoClose: false, closeOnClick: false, icon: false }
        );
      } catch (error) {
        console.error(error);
        toast.error("Error al leer el archivo de backup");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  // --- CSV Import Logic ---
  const handleImportCSVClick = (type) => {
    setImportType(type);
    csvInputRef.current.click();
  };

  const handleCSVFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const rows = parseCSV(e.target.result);
        if (rows.length === 0)
          return toast.info("Archivo vacío o formato incorrecto");

        setLoading(true);
        let successCount = 0;

        if (importType === "inventory") {
          const payload = rows.map((r) => ({
            user_id: user.id,
            tipo: r.tipo || "Desconocido",
            marca: r.marca || "",
            color: r.color || "",
            stock: parseFloat(r.stock) || 0,
            precio: parseFloat(r.precio) || 0,
            // Ignore ID to create new ones, or use if importing backup
          }));
          // Batch insert
          const { error } = await supabase.from("inventory").insert(payload);
          if (error) throw error;
          successCount = payload.length;
        } else if (importType === "cashbook") {
          const payload = rows.map((r) => ({
            user_id: user.id,
            fecha: parseCSVDate(r.fecha), // USE PARSER HERE
            tipo: r.tipo || "INGRESO",
            monto: parseFloat(r.monto) || 0,
            descripcion: r.descripcion || "",
            nombre: r.nombre || "",
          }));
          const { error } = await supabase.from("cashbook").insert(payload);
          if (error) throw error;
          successCount = payload.length;
        }

        toast.success(`Importados ${successCount} registros exitosamente.`);
      } catch (error) {
        console.error(error);
        toast.error("Error al importar CSV: " + error.message);
      } finally {
        setLoading(false);
        setImportType(null);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleExportInventoryCSV = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from("inventory").select("*");
      if (!data || data.length === 0) return toast.info("Inventario vacío");
      const csv = convertToCSV(data);
      downloadCSV(
        csv,
        `inventario_cloud_${new Date().toISOString().split("T")[0]}.csv`
      );
    } catch (e) {
      toast.error("Error exportando CSV");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCashbookCSV = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from("cashbook").select("*");
      if (!data || data.length === 0) return toast.info("Caja vacía");
      const csv = convertToCSV(data);
      downloadCSV(
        csv,
        `caja_cloud_${new Date().toISOString().split("T")[0]}.csv`
      );
    } catch (e) {
      toast.error("Error exportando CSV");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <Loader2 className="animate-spin" /> Procesando datos...
      </div>
    );

  return (
    <div className="container">
      <div className="card">
        <div
          className="section-title"
          style={{ margin: 0, marginBottom: "2rem" }}
        >
          <SettingsIcon size={24} /> Configuración y Respaldo Cloud
        </div>

        <div className="grid-2">
          {/* Exportar */}
          <div
            style={{
              padding: "1.5rem",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  padding: "0.5rem",
                  background: "rgba(163, 230, 53, 0.2)",
                  borderRadius: "50%",
                  color: "var(--primary)",
                }}
              >
                <Download size={20} />
              </div>
              <h3 style={{ margin: 0 }}>Exportar Datos (JSON)</h3>
            </div>
            <p
              style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}
            >
              Backup completo para restaurar luego.
            </p>
            <button
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={handleExport}
              disabled={loading}
            >
              <Save size={18} />
              Descargar JSON
            </button>
          </div>

          {/* Importar */}
          <div
            style={{
              padding: "1.5rem",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  padding: "0.5rem",
                  background: "rgba(59, 130, 246, 0.2)",
                  borderRadius: "50%",
                  color: "#3b82f6",
                }}
              >
                <Upload size={20} />
              </div>
              <h3 style={{ margin: 0 }}>Restaurar Backup (JSON)</h3>
            </div>
            <p
              style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}
            >
              Restaura un backup previo completo.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept=".json"
              onChange={handleFileChange}
            />
            <button
              className="btn btn-secondary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={handleImportClick}
              disabled={loading}
            >
              <Upload size={18} />
              Subir JSON
            </button>
          </div>
        </div>
      </div>

      {/* Sección CSV */}
      <div className="card" style={{ marginTop: "2rem" }}>
        <div className="section-title">
          <SettingsIcon size={24} /> Gestión Masiva (CSV)
        </div>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
          Exporta o Importa tus datos masivamente usando CSV (Excel / Sheets).
          <br />
          <small>
            Para importar, asegúrate de que el CSV tenga las cabeceras correas
            (tipo, marca, color, stock, precio para Inventario).
          </small>
        </p>

        <input
          type="file"
          ref={csvInputRef}
          style={{ display: "none" }}
          accept=".csv"
          onChange={handleCSVFileChange}
        />

        <div className="grid-2">
          {/* INVENTARIO */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <strong style={{ color: "var(--text-main)" }}>Inventario</strong>
            <button
              className="btn btn-secondary"
              style={{ justifyContent: "center" }}
              onClick={handleExportInventoryCSV}
              disabled={loading}
            >
              <Download size={18} /> Exportar Inventario (.csv)
            </button>
            <button
              className="btn btn-secondary"
              style={{ justifyContent: "center" }}
              onClick={() => handleImportCSVClick("inventory")}
              disabled={loading}
            >
              <Upload size={18} /> Importar Inventario (.csv)
            </button>
          </div>

          {/* CAJA */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <strong style={{ color: "var(--text-main)" }}>Libro de Caja</strong>
            <button
              className="btn btn-secondary"
              style={{ justifyContent: "center" }}
              onClick={handleExportCashbookCSV}
              disabled={loading}
            >
              <Download size={18} /> Exportar Libro de Caja (.csv)
            </button>
            <button
              className="btn btn-secondary"
              style={{ justifyContent: "center" }}
              onClick={() => handleImportCSVClick("cashbook")}
              disabled={loading}
            >
              <Upload size={18} /> Importar Libro de Caja (.csv)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Utilidades CSV (Keep existing logic)
