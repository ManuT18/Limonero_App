import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Calculator } from './components/Calculator';
import { Inventory } from './components/Inventory';
import { Cashbook } from './components/Cashbook';
import { Settings } from './components/Settings';

function App() {
  const [currentTab, setCurrentTab] = useState('calculator');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar currentTab={currentTab} onTabChange={setCurrentTab} />
      
      <main style={{ padding: '2rem 0' }}>
        {currentTab === 'calculator' && <Calculator />}
        {currentTab === 'inventory' && <Inventory />}
        {currentTab === 'cashbook' && <Cashbook />}
        {currentTab === 'settings' && <Settings />}
      </main>
    </div>
  );
}

export default App;
