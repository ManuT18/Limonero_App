import React from "react";
import { useAuth } from "../context/AuthContext";
import { ShieldAlert, LogOut } from "lucide-react";

/*
  -------------------------------------------------------------------------
  COMPONENTE PENDING APPROVAL
  Esta pantalla se muestra cuando un usuario ha verificado su email pero
  el campo 'is_approved' en su perfil de Supabase sigue siendo FALSE.
  -------------------------------------------------------------------------
*/

export function PendingApproval() {
  const { signOut, user } = useAuth();

  return (
    <div
      className="container"
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: "400px",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
        }}
      >
        <div
          style={{
            background: "var(--warning-light)",
            padding: "1rem",
            borderRadius: "50%",
            color: "var(--warning)",
          }}
        >
          <ShieldAlert size={48} />
        </div>

        <div>
          <h2 style={{ margin: "0 0 0.5rem 0" }}>Cuenta en Revisión</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
            Hola <strong>{user?.email}</strong>. Tu cuenta ha sido verificada,
            pero requiere la aprobación manual del administrador para acceder al
            sistema.
          </p>
          <p
            style={{
              fontSize: "0.9rem",
              background: "var(--background)",
              padding: "0.75rem",
              borderRadius: "var(--radius)",
              marginTop: "1rem",
            }}
          >
            Te notificaremos cuando tu acceso sea habilitado.
          </p>
        </div>

        <button
          onClick={signOut}
          className="btn btn-secondary"
          style={{ width: "100%" }}
        >
          <LogOut size={18} style={{ marginRight: "0.5rem" }} />
          Cerrar Sesión / Volver a la Tienda
        </button>
      </div>
    </div>
  );
}
