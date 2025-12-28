import React, { useRef, useState } from "react";
import { toast } from "react-toastify";
import { supabase } from "../supabaseClient";
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

export function Settings() {
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      // Fetch all data
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

      // Create Blob
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

        // Basic Validation
        if (!json.inventory && !json.cashbook) {
          toast.error("El archivo no es un backup válido.");
          return;
        }

        const proceedImport = async () => {
          try {
            setLoading(true);
            toast.info("Iniciando restauración...");

            // 1. Inventory
            if (json.inventory && json.inventory.length > 0) {
              // Ensure user_id is set to current user
              const inventoryData = json.inventory.map((item) => ({
                ...item,
                user_id: user.id,
              }));
              const { error } = await supabase
                .from("inventory")
                .upsert(inventoryData);
              if (error) throw error;
            }

            // 2. Cashbook
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

            // 3. Presets
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

            // 4. Config
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
              message="¿Estás seguro? Esto fusionará/sobrescribirá los datos en la nube con el archivo."
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
    event.target.value = ""; // Reset input
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
              <h3 style={{ margin: 0 }}>Exportar Datos</h3>
            </div>
            <p
              style={{
                color: "var(--text-secondary)",
                marginBottom: "1.5rem",
                lineHeight: "1.5",
              }}
            >
              Descarga una copia de seguridad de tus datos en la nube (JSON).
            </p>
            <button
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={handleExport}
              disabled={loading}
            >
              <Save size={18} />
              Descargar Backup Cloud
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
              <h3 style={{ margin: 0 }}>Restaurar / Importar</h3>
            </div>
            <p
              style={{
                color: "var(--text-secondary)",
                marginBottom: "1.5rem",
                lineHeight: "1.5",
              }}
            >
              Sube un archivo JSON para restaurar datos en tu cuenta.
              <br />
              <span
                style={{
                  color: "var(--danger)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  marginTop: "0.5rem",
                  fontSize: "0.85rem",
                }}
              >
                <AlertTriangle size={14} />
                Sobrescribirá datos existentes.
              </span>
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
              Seleccionar Archivo
            </button>
          </div>
        </div>
      </div>

      {/* Sección CSV */}
      <div className="card" style={{ marginTop: "2rem" }}>
        <div className="section-title">
          <Download size={24} /> Reportes (Excel/CSV)
        </div>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
          Descarga tus datos en formato CSV para abrirlos en Excel.
        </p>
        <div className="grid-2">
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
            onClick={handleExportCashbookCSV}
            disabled={loading}
          >
            <Download size={18} /> Exportar Libro de Caja (.csv)
          </button>
        </div>
      </div>
    </div>
  );
}

// Utilidades CSV (Keep existing logic)
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
