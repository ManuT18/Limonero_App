import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Citrus, Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

export function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(""); // Only for Sign Up

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        toast.success(
          "¡Cuenta creada! Por favor revisa tu email para confirmar."
        );
      } else {
        const { error } = await signIn({ email, password });
        if (error) throw error;
        // La redirección/cambio de estado lo maneja AuthContext automáticamente
      }
    } catch (error) {
      toast.error(error.message || "Ha ocurrido un error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--background)",
        padding: "1rem",
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "2.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <div
            style={{
              display: "inline-flex",
              padding: "0.75rem",
              borderRadius: "1rem",
              background: "linear-gradient(135deg, #facc15 0%, #a3e635 100%)",
              color: "white",
              marginBottom: "1rem",
              boxShadow: "0 4px 6px -1px rgba(163, 230, 53, 0.3)",
            }}
          >
            <Citrus size={32} />
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              marginBottom: "0.5rem",
            }}
          >
            {isSignUp ? "Crear Cuenta" : "Bienvenido"}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            {isSignUp
              ? "Registrate para comenzar a gestionar tu 3D Farm"
              : "Ingresa a tu cuenta para continuar"}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          {isSignUp && (
            <div className="input-group" style={{ margin: 0 }}>
              <label className="label">Nombre Completo</label>
              <input
                className="input"
                type="text"
                placeholder="Ej: Manu T"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="input-group" style={{ margin: 0 }}>
            <label className="label">Email</label>
            <div style={{ position: "relative" }}>
              <Mail
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
                type="email"
                placeholder="tu@email.com"
                style={{ paddingLeft: "2.5rem" }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label className="label">Contraseña</label>
            <div style={{ position: "relative" }}>
              <Lock
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
                type="password"
                placeholder="••••••••"
                style={{ paddingLeft: "2.5rem" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: "0.5rem", justifyContent: "center" }}
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : isSignUp ? (
              "Registrarse"
            ) : (
              "Ingresar"
            )}
          </button>
        </form>

        <div
          style={{
            textAlign: "center",
            fontSize: "0.9rem",
            color: "var(--text-secondary)",
            marginTop: "0.5rem",
          }}
        >
          {isSignUp ? "¿Ya tienes cuenta? " : "¿No tienes cuenta? "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            style={{
              background: "none",
              border: "none",
              color: "var(--primary)",
              fontWeight: "600",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {isSignUp ? "Ingresa aquí" : "Regístrate aquí"}
          </button>
        </div>
      </div>
    </div>
  );
}
