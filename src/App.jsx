import React, { useState } from "react";
import { Navbar } from "./components/Navbar";
import { Calculator } from "./components/Calculator";
import { Inventory } from "./components/Inventory";
import { Cashbook } from "./components/Cashbook";
import { Settings } from "./components/Settings";
import { Dashboard } from "./components/Dashboard";
import { Login } from "./components/Login";
import { VerifiedSuccess } from "./components/VerifiedSuccess";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Loader2 } from "lucide-react";

/*
  -------------------------------------------------------------------------
  COMPONENTE DE CONTENIDO (AppContent)
  Este componente contiene la lógica principal de la UI visual.
  Se separa de 'App' para poder usar el hook 'useAuth' que provee AuthProvider.
  -------------------------------------------------------------------------
*/
function AppContent() {
  /*
    A. ESTADO DE NAVEGACIÓN (Lazy Init)
    Recupera la última pestaña visitada desde localStorage.
    Si no existe, carga 'dashboard' por defecto.
  */
  const [currentTab, setCurrentTab] = useState(() => {
    return localStorage.getItem("limonero_current_tab") || "dashboard";
  });

  // Estado para mostrar pantalla de éxito de verificación
  const [isVerified, setIsVerified] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("verified") === "true";
  });

  const { session, loading } = useAuth();

  /*
    B. MANEJADOR DE CAMBIO DE PESTAÑA
    Actualiza el estado y persiste la elección en el navegador del usuario
    para que al recargar (F5) vuelva al mismo lugar.
  */
  const handleTabChange = (tab) => {
    setCurrentTab(tab);
    localStorage.setItem("limonero_current_tab", tab);
  };

  const handleVerifiedContinue = () => {
    setIsVerified(false);
    // Limpiar URL sin recargar
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  /*
    C. PANTALLA DE CARGA
    Mientras Supabase verifica si el usuario está logueado, muestra un spinner.
  */
  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--background)",
          color: "var(--text-main)",
        }}
      >
        <Loader2
          size={48}
          className="animate-spin"
          style={{ color: "var(--primary)" }}
        />
      </div>
    );
  }

  /*
    D. PROTECCIÓN DE RUTA (Guard)
    Si no hay sesión activa, bloquea el acceso y muestra el Login.
  */
  if (!session) {
    return <Login />;
  }

  /*
    D.1. VERIFICACIÓN EXITOSA
    Si el usuario viene del email de confirmación, mostramos la pantalla de éxito.
  */
  if (isVerified) {
    return <VerifiedSuccess onContinue={handleVerifiedContinue} />;
  }

  /*
    E. RENDERIZADO PRINCIPAL
    Si hay usuario, muestra la Navbar y el módulo seleccionado (Routing Manual).
  */
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        color: "var(--text-main)",
      }}
    >
      <Navbar currentTab={currentTab} onTabChange={handleTabChange} />

      <main style={{ padding: "2rem 0" }}>
        {currentTab === "dashboard" && <Dashboard />}
        {currentTab === "calculator" && <Calculator />}
        {currentTab === "inventory" && <Inventory />}
        {currentTab === "cashbook" && <Cashbook />}
        {currentTab === "settings" && <Settings />}
      </main>
    </div>
  );
}

/*
  -------------------------------------------------------------------------
  COMPONENTE RAÍZ (App)
  Punto de entrada de la jerarquía de componentes.
  Su única función es configurar los Proveedores (Providers) globales
  para que el resto de la app tenga acceso a Tema, Autenticación y Toasts.
  -------------------------------------------------------------------------
*/
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastContainer
          position="bottom-right"
          theme="colored"
          autoClose={1000}
          hideProgressBar={true}
        />
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
