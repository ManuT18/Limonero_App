import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { supabase } from "../hooks/supabaseClient";
import { useAuth } from "../context/AuthContext";
import {
  Package,
  Plus,
  Trash2,
  Pencil,
  Image as ImageIcon,
  Loader2,
  X,
  Check,
} from "lucide-react";

/*
  -------------------------------------------------------------------------
  COMPONENTE STORE MANAGER (GESTIÓN DE TIENDA)
  Panel administrativo para gestionar los productos de la tienda pública.
  - CRUD completo (Crear, Leer, Actualizar, Borrar) de productos.
  - Subida de imágenes a Supabase Storage ('product-images').
  -------------------------------------------------------------------------
*/

export function StoreManager() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    image_url: "",
  });

  // Fetch Products
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast.error("Error al cargar productos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Image Upload Handler
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validación de Tamaño (Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.warning("La imagen es muy pesada. Máximo 5MB.");
      return;
    }

    // Validación de Tipo
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.warning("Formato no soportado. Usa JPG, PNG o WEBP.");
      return;
    }

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: data.publicUrl });
      toast.success("Imagen subida correctamente");
    } catch (error) {
      toast.error("Error al subir imagen: " + error.message);
    }
  };

  // Save Product (Create/Update)
  const handleSave = async () => {
    if (!formData.title || !formData.price) {
      toast.warning("El título y el precio son obligatorios");
      return;
    }

    try {
      const payload = {
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        image_url: formData.image_url,
        active: true,
      };

      if (editingId) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Producto actualizado");
      } else {
        const { error } = await supabase.from("products").insert([payload]);
        if (error) throw error;
        toast.success("Producto creado");
      }

      setFormData({ title: "", description: "", price: "", image_url: "" });
      setIsAdding(false);
      setEditingId(null);
      fetchProducts();
    } catch (error) {
      toast.error("Error al guardar: " + error.message);
    }
  };

  // Delete Product
  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este producto?")) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      setProducts(products.filter((p) => p.id !== id));
      toast.success("Producto eliminado");
    } catch (error) {
      toast.error("Error al eliminar: " + error.message);
    }
  };

  // Edit Trigger
  const handleEdit = (product) => {
    setFormData({
      title: product.title,
      description: product.description || "",
      price: product.price,
      image_url: product.image_url || "",
    });
    setEditingId(product.id);
    setIsAdding(true);
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <Loader2 className="animate-spin" /> Cargando tienda...
      </div>
    );

  return (
    <div className="container">
      <div className="card">
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <div className="section-title" style={{ margin: 0 }}>
            <Package size={24} /> Gestión de Tienda
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setIsAdding(!isAdding);
              setEditingId(null);
              setFormData({
                title: "",
                description: "",
                price: "",
                image_url: "",
              });
            }}
          >
            {isAdding ? <X size={18} /> : <Plus size={18} />}
            {isAdding ? "Cerrar" : "Nuevo Producto"}
          </button>
        </div>

        {/* Form */}
        {isAdding && (
          <div
            className="card"
            style={{
              background: "var(--background)",
              border: "1px solid var(--border)",
              marginBottom: "2rem",
            }}
          >
            <div
              style={{
                display: "grid",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div className="input-group">
                <label className="label">Título</label>
                <input
                  className="input"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Ej: Maceta Hexagonal"
                />
              </div>

              <div className="input-group">
                <label className="label">Descripción</label>
                <textarea
                  className="input"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Detalles del producto..."
                  rows={3}
                  style={{ resize: "vertical" }}
                />
              </div>

              <div className="input-group">
                <label className="label">Precio ($)</label>
                <input
                  className="input"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
              </div>

              <div className="input-group">
                <label className="label">Imagen</label>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                >
                  <label
                    className="btn btn-secondary"
                    style={{ cursor: "pointer" }}
                  >
                    <ImageIcon size={18} style={{ marginRight: "0.5rem" }} />
                    Subir Foto
                    <input
                      type="file"
                      accept="image/jpeg, image/png, image/webp"
                      onChange={handleImageUpload}
                      style={{ display: "none" }}
                    />
                  </label>
                  {formData.image_url && (
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      style={{
                        width: "50px",
                        height: "50px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn btn-primary" onClick={handleSave}>
                <Check size={18} style={{ marginRight: "0.5rem" }} />
                {editingId ? "Actualizar Producto" : "Publicar Producto"}
              </button>
            </div>
          </div>
        )}

        {/* Product List */}
        <div style={{ display: "grid", gap: "1rem" }}>
          {products.map((product) => (
            <div
              key={product.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                background: "var(--surface)",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.title}
                    style={{
                      width: "60px",
                      height: "60px",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      background: "var(--background)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <ImageIcon size={24} />
                  </div>
                )}
                <div>
                  <h3
                    style={{
                      margin: "0 0 0.25rem 0",
                      fontSize: "1rem",
                      fontWeight: 600,
                    }}
                  >
                    {product.title}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      color: "var(--text-secondary)",
                      fontSize: "0.875rem",
                    }}
                  >
                    ${product.price}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className="btn-icon"
                  style={{ color: "var(--primary)" }}
                  onClick={() => handleEdit(product)}
                >
                  <Pencil size={18} />
                </button>
                <button
                  className="btn-icon"
                  style={{ color: "var(--danger)" }}
                  onClick={() => handleDelete(product.id)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          {products.length === 0 && !loading && (
            <div
              style={{
                textAlign: "center",
                padding: "3rem",
                color: "var(--text-secondary)",
              }}
            >
              No hay productos en la tienda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
