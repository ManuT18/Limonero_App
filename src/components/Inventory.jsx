import React, { useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { Trash2, Plus, Search, Package } from "lucide-react";

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

  const handleAdd = () => {
    if (!newItem.tipo || !newItem.stock) return;

    setItems([
      ...items,
      {
        ...newItem,
        id: crypto.randomUUID(),
        stock: parseFloat(newItem.stock),
        precio: parseFloat(newItem.precio),
      },
    ]);
    setNewItem({ tipo: "", marca: "", color: "", stock: "", precio: "" });
    setIsAdding(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este item?")) {
      setItems(items.filter((item) => item.id !== id));
    }
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
                <th>Detalles</th>
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
                    <td>
                      <span
                        style={{ fontWeight: 600, color: "var(--text-main)" }}
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
                            background: "gray" /* Podría ser dinámico */,
                          }}
                        ></div>
                        {item.color}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          item.stock < 200 ? "badge-danger" : "badge-success"
                        }`}
                      >
                        {item.stock} gr
                      </span>
                    </td>
                    <td>${item.precio}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="btn btn-ghost"
                        style={{ color: "var(--danger)", padding: "0.5rem" }}
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 size={18} />
                      </button>
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
