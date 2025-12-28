import React, { useState } from "react";
import { Navbar } from "./components/Navbar";
import { Calculator } from "./components/Calculator";
import { Inventory } from "./components/Inventory";
import { Cashbook } from "./components/Cashbook";
import { Settings } from "./components/Settings";
import { Dashboard } from "./components/Dashboard";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [currentTab, setCurrentTab] = useState("dashboard");

  return (
    <ThemeProvider>
      <ToastContainer
        position="bottom-right"
        theme="colored"
        autoClose={1000}
        hideProgressBar={true}
      />
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
    </ThemeProvider>
  );
}

export default App;
