/*
  -------------------------------------------------------------------------
  COMPONENTE: VerifiedSuccess
  Pantalla de celebración que se muestra cuando el usuario confirma su email.
  -------------------------------------------------------------------------
*/
import React from "react";
import { CheckCircle, ArrowRight } from "lucide-react";

export function VerifiedSuccess({ onContinue }) {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--background)",
        padding: "1rem",
        textAlign: "center",
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: "400px",
          width: "100%",
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            marginTop: "-3rem",
            background: "#10B981",
            borderRadius: "50%",
            padding: "1rem",
            boxShadow: "0 4px 6px rgba(16, 185, 129, 0.3)",
            color: "white",
            marginBottom: "1rem",
          }}
        >
          <CheckCircle size={48} />
        </div>

        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
          ¡Email Verificado!
        </h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
          Tu cuenta ha sido confirmada exitosamente. Ya puedes acceder a todas
          las funcionalidades del Limonero.
        </p>

        <button
          className="btn btn-primary"
          onClick={onContinue}
          style={{ width: "100%", justifyContent: "center" }}
        >
          Ir al Panel de Control <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
