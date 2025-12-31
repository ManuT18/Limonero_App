/*
  -------------------------------------------------------------------------
  COMPONENTE: DeleteAccount
  Permite al usuario eliminar todos sus datos asociados (Inventario, Caja, Configuración).
  NOTA: No elimina el usuario de 'auth.users' (requiere backend), pero limpia
  toda la data personal y cierra sesión.
  -------------------------------------------------------------------------
*/
import React, { useState } from "react";
import { toast } from "react-toastify";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "../hooks/supabaseClient";
import { useAuth } from "../context/AuthContext";

/*
  Auxiliar: Modal de confirmación interno
*/
const ConfirmDeleteToast = ({ closeToast, onConfirm }) => (
  <div>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        marginBottom: "0.5rem",
      }}
    >
      <AlertTriangle size={18} color="#EF4444" />
      <strong style={{ fontSize: "0.9rem", color: "#EF4444" }}>
        ¿Eliminar Cuenta y Datos?
      </strong>
    </div>
    <p
      style={{
        margin: "0 0 0.5rem 0",
        fontSize: "0.85rem",
        color: "var(--text-secondary)",
      }}
    >
      Esta acción es irreversible. Se borrarán inventario, caja y
      configuraciones.
    </p>
    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
      <button
        onClick={closeToast}
        style={{
          background: "transparent",
          border: "1px solid currentColor",
          color: "inherit",
          padding: "0.3rem 0.6rem",
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
          padding: "0.3rem 0.6rem",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "0.8rem",
          fontWeight: "bold",
        }}
      >
        Sí, eliminar todo
      </button>
    </div>
  </div>
);

export function DeleteAccount() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);

      // 1. Eliminar datos de todas las tablas
      const tables = ["inventory", "cashbook", "presets", "user_config"];

      // Ejecutamos las promesas en paralelo
      await Promise.all(
        tables.map((table) =>
          supabase.from(table).delete().eq("user_id", user.id)
        )
      );

      toast.success("Cuenta reiniciada correctamente. Cerrando sesión...");

      // 2. Cerrar sesión (El usuario auth sigue existiendo pero vacío)
      setTimeout(async () => {
        await signOut();
      }, 1500);
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar cuenta: " + error.message);
      setLoading(false); // Solo bajamos loading si falló
    }
  };

  const confirmDelete = () => {
    toast.error(
      ({ closeToast }) => (
        <ConfirmDeleteToast
          closeToast={closeToast}
          onConfirm={handleDeleteAccount}
        />
      ),
      { autoClose: false, closeOnClick: false, icon: false }
    );
  };

  return (
    <div
      className="card"
      style={{
        marginTop: "2rem",
        borderColor: "#FCA5A5", // Borde rojo claro
        background: "rgba(239, 68, 68, 0.02)", // Fondo rojo muy sutil
      }}
    >
      <div
        className="section-title"
        style={{ color: "#EF4444", marginBottom: "1rem" }}
      >
        <Trash2 size={24} /> Zona de Peligro
      </div>

      <p
        style={{
          color: "var(--text-secondary)",
          marginBottom: "1.5rem",
          fontSize: "0.9rem",
        }}
      >
        Aquí puedes eliminar tu cuenta. Esto borrará permanentemente todo tu
        inventario, registro de caja, presets y configuraciones.
        <br />
        <strong>No podrás deshacer esta acción.</strong>
      </p>

      <button
        className="btn"
        onClick={confirmDelete}
        disabled={loading}
        style={{
          background: "#EF4444",
          color: "white",
          border: "none",
          fontWeight: "bold",
          width: "100%",
          justifyContent: "center",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? (
          <Loader2 className="animate-spin" size={20} />
        ) : (
          <Trash2 size={18} />
        )}
        {loading ? "Eliminando datos..." : "Eliminar mi cuenta"}
      </button>
    </div>
  );
}
