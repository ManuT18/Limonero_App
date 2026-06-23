/*
Copyright (C) 2025 Manuel Tauro

This work is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License.
To view a copy of this license, visit http://creativecommons.org/licenses/by-nc/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/

/*
  -------------------------------------------------------------------------
  1. IMPORTACIONES
  - React Hooks: Para estado y efectos secundarios (fetch inicial).
  - Toastify: Para notificaciones al usuario (éxito/error).
  - Supabase: Cliente para base de datos.
  - Iconos: Lucide React para la interfaz gráfica.
  - Helpers: Utilidades fuera del componente para colores y toasts de confirmación.
  -------------------------------------------------------------------------
*/
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { supabase } from "../hooks/supabaseClient";
import { useAuth } from "../context/AuthContext";
import {
  Trash2,
  Plus,
  Search,
  Package,
  Pencil,
  Check,
  X,
  Copy,
  Loader2,
} from "lucide-react";

/*
  -------------------------------------------------------------------------
  2. FUNCIONES AUXILIARES (Helpers)
  - getColor: Devuelve un código hex basado en el nombre del color (para mostrar una bolita de color).
  - ConfirmToast: Componente pequeño para confirmar eliminación dentro del toast.
  -------------------------------------------------------------------------
*/
const getColor = (name) => {
  if (!name) return "#E5E7EB";
  const lower = name.toLowerCase().trim();
  const map = {
    rojo: "#EF4444",
    azul: "#3B82F6",
    verde: "#22C55E",
    amarillo: "#EAB308",
    naranja: "#F97316",
    violeta: "#8B5CF6",
    rosa: "#EC4899",
    negro: "#000000ff",
    blanco: "#F9FAFB",
    gris: "#9CA3AF",
    "gris oscuro": "#2e2e2eff",
    marron: "#78350F",
    "verde claro": "#86EFAC",
    "verde oscuro": "#14532D",
    "azul claro": "#93C5FD",
    "azul oscuro": "#1E3A8A",
    celeste: "#0EA5E9",
    turquesa: "#14B8A6",
    dorado: "#CA8A04",
    plateado: "#D1D5DB",
    bronce: "#92400E",
    transparente: "rgba(255, 255, 255, 0.5)",
    natural: "#FDE68A",
  };
  return map[lower] || "#9CA3AF";
};

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

/*
  -------------------------------------------------------------------------
  3. COMPONENTE INVENTORY
  Gestión CRUD (Create - Read - Update - Delete) completa de materiales de impresión 3D (Filamentos).
  Permite: Listar, Agregar, Editar, Duplicar y Eliminar items.
  -------------------------------------------------------------------------
*/
export function Inventory() {
  // --- ESTADO GLOBAL ---
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // Obtenemos el ID del usuario para RLS (Row Level Security)

  // --- ESTADO DEL FORMULARIO (NUEVO ITEM) ---
  const [newItem, setNewItem] = useState({
    tipo: "",
    marca: "",
    color: "",
    stock: "",
    precio: "",
  });
  const [isAdding, setIsAdding] = useState(false); // Toggle para mostrar el form

  // --- ESTADO DE UI INTERACTIVA ---
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null); // ID del item que se está editando
  const [editValues, setEditValues] = useState({}); // Valores temporales de edición

  // Carga inicial de datos
  useEffect(() => {
    fetchItems();
  }, []);

  /*
    A. LECTURA DE DATOS (READ)
    Trae todos los items de la tabla 'inventory' ordenados por tipo.
  */
  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .order("tipo", { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      toast.error("Error al cargar inventario: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  /*
    B. CREACIÓN DE DATOS (CREATE)
    Inserta un nuevo registro en Supabase y actualiza el estado local optimísticamente.
  */
  const handleAdd = async () => {
    if (!newItem.tipo || !newItem.stock) return;

    try {
      const payload = {
        user_id: user.id,
        tipo: newItem.tipo,
        marca: newItem.marca,
        color: newItem.color,
        stock: parseFloat(newItem.stock) || 0,
        precio: parseFloat(newItem.precio) || 0,
      };

      const { data, error } = await supabase
        .from("inventory")
        .insert([payload])
        .select();
      if (error) throw error;

      setItems([...items, ...data]);
      setNewItem({ tipo: "", marca: "", color: "", stock: "", precio: "" });
      setIsAdding(false);
      toast.success("Material agregado exitosamente");
    } catch (error) {
      toast.error("Error al guardar: " + error.message);
    }
  };

  /*
    C. ELIMINACIÓN DE DATOS (DELETE)
    Muestra un Toast personalizado de confirmación antes de borrar.
  */
  const handleDelete = (id) => {
    toast.error(
      ({ closeToast }) => (
        <ConfirmToast
          closeToast={closeToast}
          message="¿Eliminar este material?"
          onConfirm={async () => {
            try {
              const { error } = await supabase
                .from("inventory")
                .delete()
                .eq("id", id);
              if (error) throw error;
              setItems((prev) => prev.filter((item) => item.id !== id));
              toast.dismiss();
              setTimeout(() => toast.error("Material eliminado"), 100);
            } catch (error) {
              toast.error("Error al eliminar: " + error.message);
            }
          }}
        />
      ),
      { autoClose: false, closeOnClick: false, icon: false }
    );
  };

  /*
    D. EDICIÓN DE DATOS (UPDATE)
    Funciones para iniciar modo edición, guardar cambios y cancelar.
  */
  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditValues({ ...item });
  };

  const handleSaveEdit = async () => {
    try {
      const updates = {
        tipo: editValues.tipo,
        marca: editValues.marca,
        color: editValues.color,
        stock: parseFloat(editValues.stock) || 0,
        precio: parseFloat(editValues.precio) || 0,
      };

      const { error } = await supabase
        .from("inventory")
        .update(updates)
        .eq("id", editingId);
      if (error) throw error;

      setItems((prev) =>
        prev.map((item) =>
          item.id === editingId ? { ...item, ...updates } : item
        )
      );
      setEditingId(null);
      setEditValues({});
      toast.success("Material actualizado");
    } catch (error) {
      toast.error("Error al actualizar: " + error.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  /*
    E. DUPLICACIÓN
    Crea una copia de un item existente (útil para variantes de color).
  */
  const handleDuplicate = async (item) => {
    try {
      const { id, created_at, ...rest } = item;
      const payload = { ...rest, user_id: user.id }; // Aseguramos nuevo ID generado por la DB

      const { data, error } = await supabase
        .from("inventory")
        .insert([payload])
        .select();
      if (error) throw error;

      setItems([...items, ...data]);
      toast.info("Material duplicado");
    } catch (error) {
      toast.error("Error al duplicar: " + error.message);
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <Loader2 className="animate-spin" /> Cargando inventario...
      </div>
    );

  // Filtrado en tiempo real (Búsqueda)
  const filteredItems = items.filter(
    (item) =>
      (item.tipo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.marca || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.color || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  /*
    F. RENDERIZADO PRINCIPAL
    - Barra superior: Título, Buscador, Botón Nuevo.
    - Formulario (Condicional): Panel colapsable para agregar.
    - Tabla: Lista de materiales con soporte para edición en línea (Inline Editing).
  */
  return (
    <div className="container">
      <div className="card">
        {/* CABECERA Y ACCIONES */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div className="section-title" style={{ margin: 0 }}>
            <Package size={24} /> Inventario de Materiales
          </div>

          <div
            style={{
              display: "flex",
              gap: "1rem",
              flex: 1,
              justifyContent: "flex-end",
            }}
          >
            <div
              style={{ position: "relative", maxWidth: "300px", width: "100%" }}
            >
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-secondary)",
                }}
              />
              <input
                className="input"
                placeholder="Buscar..."
                style={{ paddingLeft: "2.5rem" }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={() => setIsAdding(!isAdding)}
            >
              <Plus size={18} />
              Nuevo
            </button>
          </div>
        </div>

        {/* FORMULARIO DE AGREGAR */}
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
              style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1rem" }}
            >
              Agregar Nuevo Material
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <div className="input-group" style={{ margin: 0 }}>
                <label className="label">Tipo</label>
                <input
                  className="input"
                  placeholder="Ej: PLA"
                  value={newItem.tipo}
                  onChange={(e) =>
                    setNewItem({ ...newItem, tipo: e.target.value })
                  }
                />
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="label">Marca</label>
                <input
                  className="input"
                  placeholder="Ej: Grilon"
                  value={newItem.marca}
                  onChange={(e) =>
                    setNewItem({ ...newItem, marca: e.target.value })
                  }
                />
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="label">Color</label>
                <input
                  className="input"
                  placeholder="Ej: Rojo"
                  value={newItem.color}
                  onChange={(e) =>
                    setNewItem({ ...newItem, color: e.target.value })
                  }
                />
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="label">Stock (gr)</label>
                <input
                  className="input"
                  type="number"
                  placeholder="1000"
                  value={newItem.stock}
                  onChange={(e) =>
                    setNewItem({ ...newItem, stock: e.target.value })
                  }
                />
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="label">Precio Compra ($)</label>
                <input
                  className="input"
                  type="number"
                  placeholder="25000"
                  value={newItem.precio}
                  onChange={(e) =>
                    setNewItem({ ...newItem, precio: e.target.value })
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
              <button
                className="btn btn-secondary"
                onClick={() => setIsAdding(false)}
              >
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleAdd}>
                Guardar Item
              </button>
            </div>
          </div>
        )}

        {/* TABLA DE RESULTADOS */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Color</th>
                <th>Stock</th>
                <th>Valor</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    style={{
                      textAlign: "center",
                      padding: "3rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    No se encontraron items
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id}>
                    {editingId === item.id ? (
                      <>
                        {/* MODO EDICIÓN (INLINE) */}
                        <td>
                          <input
                            className="input"
                            value={editValues.tipo}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                tipo: e.target.value,
                              })
                            }
                            placeholder="Tipo"
                            style={{ marginBottom: "0.25rem" }}
                          />
                          <input
                            className="input"
                            value={editValues.marca}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                marca: e.target.value,
                              })
                            }
                            placeholder="Marca"
                            style={{ fontSize: "0.85rem" }}
                          />
                        </td>
                        <td>
                          <input
                            className="input"
                            value={editValues.color}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                color: e.target.value,
                              })
                            }
                            placeholder="Color"
                          />
                        </td>
                        <td>
                          <input
                            className="input"
                            type="number"
                            value={editValues.stock}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                stock: e.target.value,
                              })
                            }
                            placeholder="Stock"
                            style={{ width: "80px" }}
                          />
                        </td>
                        <td>
                          <input
                            className="input"
                            type="number"
                            value={editValues.precio}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                precio: e.target.value,
                              })
                            }
                            placeholder="Precio"
                            style={{ width: "80px" }}
                          />
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: "0.5rem",
                            }}
                          >
                            <button
                              className="btn btn-primary"
                              style={{ padding: "0.5rem" }}
                              onClick={handleSaveEdit}
                              title="Guardar"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: "0.5rem" }}
                              onClick={handleCancelEdit}
                              title="Cancelar"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        {/* MODO VISUALIZACIÓN */}
                        <td>
                          <span
                            style={{
                              fontWeight: 600,
                              color: "var(--text-main)",
                            }}
                          >
                            {item.tipo}
                          </span>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {item.marca}
                          </div>
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <div
                              style={{
                                width: "12px",
                                height: "12px",
                                borderRadius: "50%",
                                background: getColor(item.color),
                                flexShrink: 0,
                                border:
                                  (item.color || "").toLowerCase() === "blanco"
                                    ? "1px solid var(--border)"
                                    : "none",
                              }}
                            ></div>
                            {item.color}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              item.stock < 200
                                ? "badge-danger"
                                : "badge-success"
                            }`}
                            style={{ whiteSpace: "nowrap" }}
                          >
                            {item.stock} gr
                          </span>
                        </td>
                        <td>${item.precio}</td>
                        <td style={{ textAlign: "right" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: "0.5rem",
                            }}
                          >
                            <button
                              className="btn btn-ghost"
                              style={{ padding: "0.5rem" }}
                              onClick={() => handleEdit(item)}
                              title="Editar"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              className="btn btn-ghost"
                              style={{ padding: "0.5rem" }}
                              onClick={() => handleDuplicate(item)}
                              title="Duplicar"
                            >
                              <Copy size={18} />
                            </button>
                            <button
                              className="btn btn-ghost"
                              style={{
                                color: "var(--danger)",
                                padding: "0.5rem",
                              }}
                              onClick={() => handleDelete(item.id)}
                              title="Eliminar"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
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
