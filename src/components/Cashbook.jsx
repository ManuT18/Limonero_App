import React, { useState } from "react";
import { toast } from "react-toastify";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Trash2,
  Pencil,
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
        Eliminar
      </button>
    </div>
  </div>
);

export function Cashbook() {
  const [movements, setMovements] = useLocalStorage("limonero_cashbook", []);
  const [inventory, setInventory] = useLocalStorage("limonero_inventory", []);
  const [newMovement, setNewMovement] = useState({
    tipo: "INGRESO",
    monto: "",
    descripcion: "",
    nombre: "",
  });
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const handleSave = () => {
    if (!newMovement.monto || !newMovement.descripcion) return;

    if (editingId) {
      // Editar existente
      const updatedMovements = movements.map((m) => {
        if (m.id === editingId) {
          return {
            ...m,
            ...newMovement,
            monto: parseFloat(newMovement.monto),
          };
        }
        return m;
      });
      setMovements(updatedMovements);
      setEditingId(null);
    } else {
      // Crear nuevo
      setMovements([
        {
          ...newMovement,
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
          monto: parseFloat(newMovement.monto),
        },
        ...movements,
      ]);
    }

    setNewMovement({ tipo: "INGRESO", monto: "", descripcion: "", nombre: "" });
    setIsAdding(false);
    toast.success(
      editingId ? "Movimiento actualizado" : "Movimiento registrado"
    );
  };

  const handleEdit = (mov) => {
    setNewMovement({
      tipo: mov.tipo,
      monto: mov.monto,
      descripcion: mov.descripcion,
      nombre: mov.nombre || "",
    });
    setEditingId(mov.id);
    setIsAdding(true);
  };

  const handleDelete = (id) => {
    toast.error(
      ({ closeToast }) => (
        <ConfirmToast
          message="¿Estás seguro de eliminar este registro?"
          closeToast={closeToast}
          onConfirm={() => {
            const mov = movements.find((m) => m.id === id);

            // Stock Restoration Logic
            if (mov && mov.stockRestoration) {
              const { materialId, quantity } = mov.stockRestoration;
              const materialIndex = inventory.findIndex(
                (i) => i.id === materialId
              );

              if (materialIndex !== -1) {
                const newInventory = [...inventory];
                newInventory[materialIndex] = {
                  ...newInventory[materialIndex],
                  stock: newInventory[materialIndex].stock + quantity,
                };
                setInventory(newInventory);
                toast.info(`Stock restaurado: +${quantity}g al inventario`);
              }
            }

            setMovements(movements.filter((m) => m.id !== id));
            toast.dismiss();
            setTimeout(() => toast.error("Movimiento eliminado"), 100);
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

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewMovement({ tipo: "INGRESO", monto: "", descripcion: "", nombre: "" });
  };

  const totalIngresos = movements
    .filter((m) => m.tipo === "INGRESO")
    .reduce((acc, curr) => acc + curr.monto, 0);
  const totalEgresos = movements
    .filter((m) => m.tipo === "EGRESO")
    .reduce((acc, curr) => acc + curr.monto, 0);
  const balance = totalIngresos - totalEgresos;

  return (
    <div className="container">
      {/* Resumen Cards */}
      <div
        className="grid-2"
        style={{
          marginBottom: "2rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        }}
      >
        <div className="card" style={{ padding: "1.5rem" }}>
          <div
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.875rem",
              marginBottom: "0.5rem",
            }}
          >
            Balance Total
          </div>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              color: balance >= 0 ? "var(--text-main)" : "var(--danger)",
            }}
          >
            ${balance.toFixed(2)}
          </div>
        </div>
        <div className="card" style={{ padding: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "var(--success)",
              marginBottom: "0.5rem",
            }}
          >
            <TrendingUp size={16} /> Ingresos
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            ${totalIngresos.toFixed(2)}
          </div>
        </div>
        <div className="card" style={{ padding: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "var(--danger)",
              marginBottom: "0.5rem",
            }}
          >
            <TrendingDown size={16} /> Egresos
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            ${totalEgresos.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <div className="section-title" style={{ margin: 0 }}>
            <BookOpen size={24} /> Movimientos
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setNewMovement({ ...newMovement, tipo: "INGRESO" });
                setIsAdding(true);
                setEditingId(null);
              }}
            >
              <ArrowUpCircle size={18} color="var(--success)" />
              Ingreso
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setNewMovement({ ...newMovement, tipo: "EGRESO" });
                setIsAdding(true);
                setEditingId(null);
              }}
            >
              <ArrowDownCircle size={18} color="var(--danger)" />
              Egreso
            </button>
          </div>
        </div>

        {isAdding && (
          <div
            style={{
              background: "var(--background)",
              padding: "1.5rem",
              borderRadius: "var(--radius)",
              marginBottom: "2rem",
              border: "1px solid var(--border)",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: "1rem",
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              {newMovement.tipo === "INGRESO" ? (
                <ArrowUpCircle size={20} color="var(--success)" />
              ) : (
                <ArrowDownCircle size={20} color="var(--danger)" />
              )}
              {editingId
                ? "Editar Movimiento"
                : `Registrar ${newMovement.tipo}`}
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 2fr",
                gap: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <div className="input-group" style={{ margin: 0 }}>
                <label className="label">Nombre / Entidad</label>
                <input
                  className="input"
                  placeholder="Ej: Juan Perez"
                  value={newMovement.nombre}
                  onChange={(e) =>
                    setNewMovement({ ...newMovement, nombre: e.target.value })
                  }
                />
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="label">Monto ($)</label>
                <input
                  className="input"
                  type="number"
                  placeholder="0.00"
                  value={newMovement.monto}
                  onChange={(e) =>
                    setNewMovement({ ...newMovement, monto: e.target.value })
                  }
                />
              </div>
              <div
                className="input-group"
                style={{ margin: 0, gridColumn: "span 2" }}
              >
                <label className="label">Descripción</label>
                <input
                  className="input"
                  placeholder="Ej: Venta de impresión"
                  value={newMovement.descripcion}
                  onChange={(e) =>
                    setNewMovement({
                      ...newMovement,
                      descripcion: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "1rem",
              }}
            >
              <button className="btn btn-secondary" onClick={handleCancel}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                {editingId ? "Actualizar" : "Guardar"}
              </button>
            </div>
          </div>
        )}

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Tipo</th>
                <th style={{ textAlign: "right" }}>Monto</th>
                <th style={{ textAlign: "right", width: "100px" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign: "center",
                      padding: "3rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    No hay movimientos registrados
                  </td>
                </tr>
              ) : (
                movements.map((mov) => (
                  <tr key={mov.id}>
                    <td
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {mov.fecha}
                    </td>
                    <td style={{ fontWeight: 600 }}>{mov.nombre || "-"}</td>
                    <td style={{ fontWeight: 500 }}>{mov.descripcion}</td>
                    <td>
                      <span
                        className={`badge ${
                          mov.tipo === "INGRESO"
                            ? "badge-success"
                            : "badge-danger"
                        }`}
                      >
                        {mov.tipo}
                      </span>
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontWeight: 600,
                        color:
                          mov.tipo === "INGRESO"
                            ? "var(--success)"
                            : "var(--danger)",
                      }}
                    >
                      {mov.tipo === "INGRESO" ? "+" : "-"}$
                      {mov.monto.toFixed(2)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          className="btn-icon"
                          style={{
                            padding: "0.4rem",
                            color: "var(--text-secondary)",
                          }}
                          onClick={() => handleEdit(mov)}
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="btn-icon"
                          style={{ padding: "0.4rem", color: "var(--danger)" }}
                          onClick={() => handleDelete(mov.id)}
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
