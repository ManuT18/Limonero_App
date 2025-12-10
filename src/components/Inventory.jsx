import React, { useState } from "react";
import { toast } from "react-toastify";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  Trash2,
  Plus,
  Search,
  Package,
  Pencil,
  Check,
  X,
  Copy,
} from "lucide-react";

const getColor = (name) => {
  if (!name) return "#E5E7EB"; // grays.200
  const lower = name.toLowerCase().trim();
  const map = {
    // Básicos
    rojo: "#EF4444", // red.500
    azul: "#3B82F6", // blue.500
    verde: "#22C55E", // green.500
    amarillo: "#EAB308", // yellow.500
    naranja: "#F97316", // orange.500
    violeta: "#8B5CF6", // violet.500
    rosa: "#EC4899", // pink.500
    negro: "#1F2937", // gray.800
    blanco: "#F9FAFB", // gray.50
    gris: "#9CA3AF", // gray.400
    marron: "#78350F", // amber.900

    // Variantes
    "verde claro": "#86EFAC",
    "verde oscuro": "#14532D",
    "azul claro": "#93C5FD",
    "azul oscuro": "#1E3A8A",
    celeste: "#0EA5E9",
    turquesa: "#14B8A6",

    // Materiales
    dorado: "#CA8A04",
    plateado: "#D1D5DB",
    bronce: "#92400E",
    transparente: "rgba(255, 255, 255, 0.5)",
    natural: "#FDE68A",
  };
  return map[lower] || "#9CA3AF"; // Default gray
};

const sortItems = (items) => {
  return [...items].sort((a, b) => {
    // 1. Tipo
    const tipoComp = a.tipo.localeCompare(b.tipo);
    if (tipoComp !== 0) return tipoComp;
    // 2. Marca
    const marcaComp = a.marca.localeCompare(b.marca);
    if (marcaComp !== 0) return marcaComp;
    // 3. Color
    return a.color.localeCompare(b.color);
  });
};

export function Inventory() {
  const [items, setItems] = useLocalStorage("limonero_inventory", []);
  const [newItem, setNewItem] = useState({
    tipo: "",
    marca: "",
    color: "",
    stock: "",
    precio: "",
  });
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});

  const handleAdd = () => {
    if (!newItem.tipo || !newItem.stock) return;

    setItems(
      sortItems([
        ...items,
        {
          ...newItem,
          id: crypto.randomUUID(),
          stock: parseFloat(newItem.stock),
          precio: parseFloat(newItem.precio),
        },
      ])
    );
    setNewItem({ tipo: "", marca: "", color: "", stock: "", precio: "" });

    setIsAdding(false);
    toast.success("Material agregado exitosamente");
  };

  const handleDelete = (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este item?")) {
      setItems(items.filter((item) => item.id !== id));
      toast.error("Material eliminado");
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditValues({ ...item });
  };

  const handleSaveEdit = () => {
    setItems((prev) =>
      sortItems(
        prev.map((item) =>
          item.id === editingId
            ? {
                ...editValues,
                stock: parseFloat(editValues.stock) || 0,
                precio: parseFloat(editValues.precio) || 0,
              }
            : item
        )
      )
    );
    setEditingId(null);
    setEditValues({});
    toast.success("Material actualizado");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleDuplicate = (item) => {
    const duplicatedItem = {
      ...item,
      id: crypto.randomUUID(),
    };

    setItems(sortItems([...items, duplicatedItem]));
    toast.info("Material duplicado");
  };

  const filteredItems = items.filter(
    (item) =>
      item.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.color.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container">
      <div className="card">
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
                        {/* EDICION */}
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
                        {/* VISTA NORMAL */}
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
                                border:
                                  item.color?.toLowerCase() === "blanco"
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
