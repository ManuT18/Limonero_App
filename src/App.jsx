import React, { useState } from "react";
import { Navbar } from "./components/Navbar";
import { Calculator } from "./components/Calculator";
import { Inventory } from "./components/Inventory";
import { Cashbook } from "./components/Cashbook";
import { Settings } from "./components/Settings";
import { Dashboard } from "./components/Dashboard";
import { Login } from "./components/Login";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Loader2 } from "lucide-react";

function AppContent() {
  const [currentTab, setCurrentTab] = useState("dashboard");
  const { session, loading } = useAuth();

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

  if (!session) {
    return <Login />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        color: "var(--text-main)",
      }}
    >
      <Navbar currentTab={currentTab} onTabChange={setCurrentTab} />

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
