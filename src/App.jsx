/*
Copyright (C) 2025 Manuel Tauro

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <https://gnu.org>.
*/

import React, { useState } from "react";
import { Navbar } from "./components/Navbar";
import { Calculator } from "./components/Calculator";
import { Inventory } from "./components/Inventory";
import { Cashbook } from "./components/Cashbook";
import { Settings } from "./components/Settings";
import { Dashboard } from "./components/Dashboard";
import { Login } from "./components/Login";
import { VerifiedSuccess } from "./components/VerifiedSuccess";
import { PendingApproval } from "./components/PendingApproval";
import { PublicStore } from "./components/PublicStore";
import { StoreManager } from "./components/StoreManager";
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

  const { user, session, loading } = useAuth();

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
    Nueva lógica de ruteo según sesión y aprobación.
  */

  // Estado local para mostrar el Login cuando el usuario lo pide desde la Tienda Pública
  const [showLogin, setShowLogin] = useState(false);

  // 1. Si NO hay sesión...
  if (!session) {
    // ...y el usuario pidió loguearse, mostramos el componente Login
    if (showLogin) {
      return (
        <div style={{ position: "relative" }}>
          {/* Botón para volver a la tienda si se arrepiente */}
          <button
            onClick={() => setShowLogin(false)}
            style={{
              position: "absolute",
              top: "1rem",
              left: "1rem",
              zIndex: 50,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--text-secondary)",
            }}
          >
            ← Volver a la Tienda
          </button>
          <Login />
        </div>
      );
    }

    // ...si no, mostramos la Tienda Pública
    return <PublicStore onLoginClick={() => setShowLogin(true)} />;
  }

  // LOGIN MODAL STATE (Para PublicStore)
  // Como <PublicStore> reemplaza a <Login>, necesitamos una forma de mostrar el Login.
  // Vamos a refactorizar levemente para manejar esto.

  // 2. Si hay sesión pero NO está aprobado, mostramos pantalla de espera.
  // IMPORTANTE: Revisamos 'user.is_approved' (estado enriquecido), no session.user (raw JWT).
  if (user?.is_approved === false) {
    return <PendingApproval />;
  }

  /*
    D.1. VERIFICACIÓN EXITOSA
    Si el usuario viene del email de confirmación, mostramos la pantalla de éxito.
  */
  if (isVerified) {
    return <VerifiedSuccess onContinue={handleVerifiedContinue} />;
  }

  /*
    E. RENDERIZADO PRINCIPAL (Usuario validado y aprobado)
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
        {currentTab === "store" && <StoreManager />}
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
