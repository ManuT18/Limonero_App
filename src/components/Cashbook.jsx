import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Trash2,
  Pencil,
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
        Eliminar
      </button>
    </div>
  </div>
);

export function Cashbook() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  // Inventory is needed for restoration logic, but we might check it on demand or load it.
  // Loading all inventory just for delete might be overkill but simple.
  // Actually, we only need to update it.

  const { user } = useAuth();
  const [newMovement, setNewMovement] = useState({
    tipo: "INGRESO",
    monto: "",
    descripcion: "",
    nombre: "",
  });
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("cashbook")
        .select("*")
        .order("fecha", { ascending: false }); // Newest first

      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      toast.error("Error al cargar caja: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!newMovement.monto || !newMovement.descripcion) return;

    try {
      const payload = {
        user_id: user.id,
        tipo: newMovement.tipo,
        monto: parseFloat(newMovement.monto),
        descripcion: newMovement.descripcion,
        nombre: newMovement.nombre || "",
        // fecha will default to now() on insert if not provided
        // or we can provide it explicitly.
      };

      if (!editingId) {
        // Create new
        payload.fecha = new Date().toISOString();
      }

      let data, error;

      if (editingId) {
        // Edit
        const { error: updateError } = await supabase
          .from("cashbook")
          .update({
            tipo: payload.tipo,
            monto: payload.monto,
            descripcion: payload.descripcion,
            nombre: payload.nombre,
          })
          .eq("id", editingId);
        error = updateError;

        if (!error) {
          setMovements((prev) =>
            prev.map((m) => (m.id === editingId ? { ...m, ...payload } : m))
          );
        }
      } else {
        // Insert
        const { data: insertData, error: insertError } = await supabase
          .from("cashbook")
          .insert([payload])
          .select();
        data = insertData;
        error = insertError;

        if (!error && data) {
          setMovements([data[0], ...movements]);
        }
      }

      if (error) throw error;

      setNewMovement({
        tipo: "INGRESO",
        monto: "",
        descripcion: "",
        nombre: "",
      });
      setIsAdding(false);
      setEditingId(null);
      toast.success(
        editingId ? "Movimiento actualizado" : "Movimiento registrado"
      );
    } catch (error) {
      toast.error("Error al guardar: " + error.message);
    }
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
          onConfirm={async () => {
            try {
              // 1. Get movement to check metadata
              // We likely have it in state 'movements', but fetching ensures safety
              const mov = movements.find((m) => m.id === id);

              if (mov && mov.metadata && mov.metadata.stockRestoration) {
                const { materialId, quantity } = mov.metadata.stockRestoration;

                // 2. Restore Stock
                // Fetch current stock first (concurrency safe-ish)
                const { data: matData, error: matError } = await supabase
                  .from("inventory")
                  .select("stock")
                  .eq("id", materialId)
                  .single();

                if (!matError && matData) {
                  const newStock = (matData.stock || 0) + quantity;
                  await supabase
                    .from("inventory")
                    .update({ stock: newStock })
                    .eq("id", materialId);

                  toast.info(`Stock restaurado: +${quantity}g al inventario`);
                }
              }

              // 3. Delete Movement
              const { error } = await supabase
                .from("cashbook")
                .delete()
                .eq("id", id);
              if (error) throw error;

              setMovements((prev) => prev.filter((m) => m.id !== id));
              toast.dismiss();
              setTimeout(() => toast.error("Movimiento eliminado"), 100);
            } catch (error) {
              toast.error("Error al eliminar: " + error.message);
            }
          }}
        />
      ),
      { autoClose: false, closeOnClick: false, icon: false }
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

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <Loader2 className="animate-spin" /> Cargando movimientos...
      </div>
    );

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
                      {new Date(mov.fecha || mov.created_at).toLocaleString(
                        "es-AR",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
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
