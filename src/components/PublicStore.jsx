import React, { useState, useEffect } from "react";
import { supabase } from "../hooks/supabaseClient";
import {
  Citrus,
  LogIn,
  ShoppingBag,
  Info,
  ExternalLink,
  Moon,
  Sun,
  Loader2,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

/*
  -------------------------------------------------------------------------
  COMPONENTE PUBLIC STORE (TIENDA PÚBLICA)
  Es la Landing Page que ven los usuarios NO autenticados.
  - Muestra un catálogo de productos obtenidos de la tabla 'products'.
  - Permite visualizar items sin necesidad de login.
  - Tiene un botón de "Ingresar" que invoca al Login Modal.
  -------------------------------------------------------------------------
*/

export function PublicStore({ onLoginClick }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    fetchPublicProducts();
  }, []);

  const fetchPublicProducts = async () => {
    try {
      setLoading(true);
      // Fetch only needed columns
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching public products:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        color: "var(--text-main)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* HEADER / NAVBAR PÚBLICA */}
      <header
        style={{
          padding: "1rem 0",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          background: "var(--surface)",
          zIndex: 10,
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #facc15 0%, #eab308 100%)",
                padding: "0.5rem",
                borderRadius: "12px",
                display: "flex",
                color: "white",
                boxShadow: "0 4px 6px -1px rgba(234, 179, 8, 0.2)",
              }}
            >
              <Citrus size={24} />
            </div>
            <h1
              style={{
                fontSize: "1.25rem",
                fontWeight: "800",
                margin: 0,
                letterSpacing: "-0.025em",
              }}
            >
              El Limonero
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={toggleTheme}
              className={`btn btn-ghost ${
                theme === "dark" ? "btn-theme-sun" : "btn-theme-moon"
              }`}
              style={{
                padding: "0.5rem",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.2s, color 0.2s, background-color 0.2s",
              }}
              title="Cambiar Tema"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={onLoginClick} className="btn btn-secondary">
              <LogIn size={16} />
              <span>Ingresar</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION (Opcional) */}
      <div
        style={{
          background:
            "linear-gradient(to right, var(--surface), var(--background))",
          padding: "3rem 0",
          textAlign: "center",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="container" style={{ maxWidth: "600px" }}>
          <h2
            style={{
              fontSize: "2rem",
              fontWeight: "800",
              marginBottom: "1rem",
              background: "linear-gradient(to right, #facc15, #eab308)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Catálogo de Impresiones 3D
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
            Explora nuestros productos y diseños exclusivos. Calidad, detalle y
            creatividad en cada capa.
          </p>
        </div>
      </div>

      {/* GRID DE PRODUCTOS */}
      <div className="container" style={{ padding: "3rem 1rem" }}>
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "4rem",
              color: "var(--text-secondary)",
            }}
          >
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : products.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "4rem",
              color: "var(--text-secondary)",
              background: "var(--surface)",
              borderRadius: "var(--radius)",
            }}
          >
            <ShoppingBag
              size={48}
              style={{ opacity: 0.5, marginBottom: "1rem" }}
            />
            <h3>No hay productos disponibles por el momento</h3>
            <p>Vuelve a visitarnos pronto.</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "2rem",
            }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                className="card"
                style={{
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  padding: 0,
                  transition: "transform 0.2s, box-shadow 0.2s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Imagen del Producto */}
                <div
                  style={{
                    height: "200px",
                    background: "var(--input-bg)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <Citrus size={48} style={{ opacity: 0.2 }} />
                    </div>
                  )}
                  <div
                    style={{
                      position: "absolute",
                      top: "1rem",
                      right: "1rem",
                      background: "rgba(0,0,0,0.6)",
                      color: "white",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "2rem",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    ${product.price}
                  </div>
                </div>

                {/* Info del Producto */}
                <div
                  style={{
                    padding: "1.5rem",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "700",
                      marginBottom: "0.5rem",
                      color: "var(--text-main)",
                    }}
                  >
                    {product.title}
                  </h3>
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.9rem",
                      lineHeight: "1.5",
                      marginBottom: "1.5rem",
                      flex: 1,
                    }}
                  >
                    {product.description || "Sin descripción disponible."}
                  </p>

                  <button
                    className="btn btn-secondary"
                    style={{ width: "100%", justifyContent: "center" }}
                    onClick={() => {
                      // Aquí se podría abrir un modal de contacto o WhatsApp
                      // Por ahora es solo visual
                    }}
                  >
                    <Info size={16} style={{ marginRight: "0.5rem" }} />
                    Consultar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer
        style={{
          textAlign: "center",
          padding: "2rem",
          color: "var(--text-secondary)",
          fontSize: "0.875rem",
          borderTop: "1px solid var(--border)",
          marginTop: "auto",
        }}
      >
        <p>© {new Date().getFullYear()} El Limonero - 3D Printing Manager</p>
      </footer>
    </div>
  );
}
