import React, { useRef } from "react";
import {
  Download,
  Upload,
  Settings as SettingsIcon,
  Save,
  AlertTriangle,
} from "lucide-react";

export function Settings() {
  const fileInputRef = useRef(null);

  const handleExport = () => {
    // 1. Obtener datos del LocalStorage
    const inventory = localStorage.getItem("limonero_inventory");
    const cashbook = localStorage.getItem("limonero_cashbook");

    const data = {
      inventory: inventory ? JSON.parse(inventory) : [],
      cashbook: cashbook ? JSON.parse(cashbook) : [],
      exportDate: new Date().toISOString(),
    };

    // 2. Crear archivo Blob
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    // 3. Descargar
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_limonero_${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

        // Validación básica
        if (!json.inventory && !json.cashbook) {
          alert(
            "El archivo no parece ser un backup válido de esta aplicación."
          );
          return;
        }

        if (
          confirm(
            "¿Estás seguro? Esto SOBRESCRIBIRÁ todos los datos actuales con los del archivo."
          )
        ) {
          if (json.inventory)
            localStorage.setItem(
              "limonero_inventory",
              JSON.stringify(json.inventory)
            );
          if (json.cashbook)
            localStorage.setItem(
              "limonero_cashbook",
              JSON.stringify(json.cashbook)
            );

          alert("¡Datos importados con éxito! La página se recargará.");
          window.location.reload();
        }
      } catch (error) {
        console.error(error);
        alert("Error al leer el archivo. Asegúrate de que sea un JSON válido.");
      }
    };
    reader.readAsText(file);
    event.target.value = ""; // Reset input
  };

  const handleExportInventoryCSV = () => {
    const data = localStorage.getItem("limonero_inventory");
    if (!data) return alert("No hay datos de inventario.");

    const inventory = JSON.parse(data);
    if (inventory.length === 0) return alert("El inventario está vacío.");

    // Aplanar/Seleccionar columnas relevantes si se desea, o exportar todo
    const csv = convertToCSV(inventory);
    downloadCSV(
      csv,
      `inventario_limonero_${new Date().toISOString().split("T")[0]}.csv`
    );
  };

  const handleExportCashbookCSV = () => {
    const data = localStorage.getItem("limonero_cashbook");
    if (!data) return alert("No hay movimientos en caja.");

    const cashbook = JSON.parse(data);
    if (cashbook.length === 0) return alert("La caja está vacía.");

    const csv = convertToCSV(cashbook);
    downloadCSV(
      csv,
      `caja_limonero_${new Date().toISOString().split("T")[0]}.csv`
    );
  };

  return (
    <div className="container">
      <div className="card">
        <div
          className="section-title"
          style={{ margin: 0, marginBottom: "2rem" }}
        >
          <SettingsIcon size={24} /> Configuración y Respaldo
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
              Descarga una copia de seguridad de todo tu Inventario y Libro de
              Caja en un archivo JSON. Guárdalo en un lugar seguro (nube, USB)
              para no perder tu información.
            </p>
            <button
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={handleExport}
            >
              <Save size={18} />
              Descargar Copia de Seguridad
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
              <h3 style={{ margin: 0 }}>Importar Datos</h3>
            </div>
            <p
              style={{
                color: "var(--text-secondary)",
                marginBottom: "1.5rem",
                lineHeight: "1.5",
              }}
            >
              Restaura una copia de seguridad previa.
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
                Atención: Esto borrará los datos actuales.
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
            >
              <Upload size={18} />
              Seleccionar Archivo y Restaurar
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
          Descarga tus datos en formato CSV para abrirlos en Excel, Google
          Sheets o LibreOffice.
        </p>
        <div className="grid-2">
          <button
            className="btn btn-secondary"
            style={{ justifyContent: "center" }}
            onClick={handleExportInventoryCSV}
          >
            <Download size={18} /> Exportar Inventario (.csv)
          </button>
          <button
            className="btn btn-secondary"
            style={{ justifyContent: "center" }}
            onClick={handleExportCashbookCSV}
          >
            <Download size={18} /> Exportar Libro de Caja (.csv)
          </button>
        </div>
      </div>
    </div>
  );
}

// Utilidades CSV
const convertToCSV = (objArray) => {
  const array = typeof objArray !== "object" ? JSON.parse(objArray) : objArray;
  if (array.length === 0) return "";

  // Obtener headers
  const header = Object.keys(array[0]).join(",");

  // Obtener filas
  const rows = array
    .map((obj) => {
      return Object.values(obj)
        .map((value) => {
          // Escapar comillas y manejar strings con comas
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
