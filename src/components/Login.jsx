/*
  -------------------------------------------------------------------------
  1. IMPORTACIONES
  - React, useState: Para manejar los inputs del formulario y el modo (Login/Registro).
  - useAuth: Hook personalizado para acceder a las funciones signIn y signUp de Supabase.
  - Iconos (Lucide) y Toastify (Alertas): Para mejorar la UX visual.
  -------------------------------------------------------------------------
*/
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Citrus, Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";

/*
  -------------------------------------------------------------------------
  2. COMPONENTE LOGIN
  Unifica la lógica de Inicio de Sesión y Registro en una sola vista.
  Permite alternar entre modos usando el estado 'isSignUp'.
  -------------------------------------------------------------------------
*/
export function Login() {
  /*
    A. ESTADO LOCAL
    - isSignUp: False = "Log In", True = "Create Account".
    - loading: Para deshabilitar el botón mientras Supabase responde.
    - Inputs: email, password, fullName (solo para registro).
  */
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Visibilidad de contraseña
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth(); // Importamos funciones del AuthContext

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(""); // Solo para Sign Up

  /*
    B. MANEJADOR DE ENVÍO (Submit)
    Gestiona la llamada a Supabase dependiendo del modo actual.
  */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // --- MODO REGISTRO ---
        const { error } = await signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: `${window.location.origin}?verified=true`,
          },
        });
        if (error) throw error;
        toast.success(
          "¡Cuenta creada! Por favor revisa tu email para confirmar."
        );
      } else {
        // --- MODO LOGIN ---
        const { error } = await signIn({ email, password });
        if (error) throw error;

        // RESET DE PESTAÑA:
        // Si el usuario inicia sesión manualmente, forzamos que vaya al Dashboard.
        // Esto sobrescribe cualquier "última visita" anterior para una experiencia fresca.
        localStorage.setItem("limonero_current_tab", "dashboard");

        // La redirección/cambio de estado lo maneja AuthContext automáticamente
        // al detectar el cambio de sesión (onAuthStateChange).
      }
    } catch (error) {
      toast.error(error.message || "Ha ocurrido un error");
    } finally {
      setLoading(false);
    }
  };

  /*
    C. RENDERIZADO (UI)
    Diseño centrado con tarjeta flotante. Usa estilos inline para mantener la 
    simplicidad en un solo archivo, aunque usa clases CSS globales para inputs y botones.
  */
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
        {/* Encabezado: Logo y Título */}
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
              ? "Registrate para comenzar a gestionar tu emprendimiento de impresión 3D"
              : "Ingresa a tu cuenta para continuar"}
          </p>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          {/* Campo Nombre (Solo visible en Registro) */}
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
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  padding: 0,
                  display: "flex",
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
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

        {/* Pie: Switch Login/Registro */}
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
