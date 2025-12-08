import React, { useState } from "react";
import { Navbar } from "./components/Navbar";
import { Calculator } from "./components/Calculator";
import { Inventory } from "./components/Inventory";
import { Cashbook } from "./components/Cashbook";
import { Settings } from "./components/Settings";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  const [currentTab, setCurrentTab] = useState("calculator");

  return (
    <ThemeProvider>
      <div
        style={{
          minHeight: "100vh",
          background: "var(--background)",
          color: "var(--text-main)",
        }}
      >
        <Navbar currentTab={currentTab} onTabChange={setCurrentTab} />

        <main style={{ padding: "2rem 0" }}>
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
