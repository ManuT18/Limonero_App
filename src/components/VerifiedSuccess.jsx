/*
Copyright (C) 2025 Manuel Tauro

This work is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License.
To view a copy of this license, visit http://creativecommons.org/licenses/by-nc/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/

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
          Tu cuenta ha sido confirmada exitosamente
          <br />
          Ya puedes acceder a todas las funcionalidades de El Limonero
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
