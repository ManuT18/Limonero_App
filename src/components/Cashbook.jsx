import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ArrowUpCircle, ArrowDownCircle, Plus, BookOpen, TrendingUp, TrendingDown } from 'lucide-react';

export function Cashbook() {
  const [movements, setMovements] = useLocalStorage('limonero_cashbook', []);
  const [newMovement, setNewMovement] = useState({
    tipo: 'INGRESO',
    monto: '',
    descripcion: ''
  });
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (!newMovement.monto || !newMovement.descripcion) return;
    
    setMovements([
      { 
        ...newMovement, 
        id: crypto.randomUUID(), 
        fecha: new Date().toLocaleString(),
        monto: parseFloat(newMovement.monto) 
      },
      ...movements
    ]);
    setNewMovement({ tipo: 'INGRESO', monto: '', descripcion: '' });
    setIsAdding(false);
  };

  const totalIngresos = movements.filter(m => m.tipo === 'INGRESO').reduce((acc, curr) => acc + curr.monto, 0);
  const totalEgresos = movements.filter(m => m.tipo === 'EGRESO').reduce((acc, curr) => acc + curr.monto, 0);
  const balance = totalIngresos - totalEgresos;

  return (
    <div className="container">
      
      {/* Resumen Cards */}
      <div className="grid-2" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Balance Total</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: balance >= 0 ? 'var(--text-main)' : 'var(--danger)' }}>
            ${balance.toFixed(2)}
          </div>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', marginBottom: '0.5rem' }}>
            <TrendingUp size={16} /> Ingresos
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>${totalIngresos.toFixed(2)}</div>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', marginBottom: '0.5rem' }}>
            <TrendingDown size={16} /> Egresos
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>${totalEgresos.toFixed(2)}</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div className="section-title" style={{ margin: 0 }}><BookOpen size={24} /> Movimientos</div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => { setNewMovement({...newMovement, tipo: 'INGRESO'}); setIsAdding(true); }}>
              <ArrowUpCircle size={18} color="var(--success)" />
              Ingreso
            </button>
            <button className="btn btn-secondary" onClick={() => { setNewMovement({...newMovement, tipo: 'EGRESO'}); setIsAdding(true); }}>
              <ArrowDownCircle size={18} color="var(--danger)" />
              Egreso
            </button>
          </div>
        </div>

        {isAdding && (
          <div style={{ background: 'var(--background)', padding: '1.5rem', borderRadius: 'var(--radius)', marginBottom: '2rem', border: '1px solid var(--border)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {newMovement.tipo === 'INGRESO' ? <ArrowUpCircle size={20} color="var(--success)" /> : <ArrowDownCircle size={20} color="var(--danger)" />}
              Registrar {newMovement.tipo}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="label">Monto ($)</label>
                <input className="input" type="number" placeholder="0.00" value={newMovement.monto} onChange={e => setNewMovement({...newMovement, monto: e.target.value})} />
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="label">Descripción</label>
                <input className="input" placeholder="Ej: Venta de impresión" value={newMovement.descripcion} onChange={e => setNewMovement({...newMovement, descripcion: e.target.value})} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setIsAdding(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAdd}>Guardar Movimiento</button>
            </div>
          </div>
        )}

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Tipo</th>
                <th style={{ textAlign: 'right' }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No hay movimientos registrados</td>
                </tr>
              ) : (
                movements.map(mov => (
                  <tr key={mov.id}>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{mov.fecha}</td>
                    <td style={{ fontWeight: 500 }}>{mov.descripcion}</td>
                    <td>
                      <span className={`badge ${mov.tipo === 'INGRESO' ? 'badge-success' : 'badge-danger'}`}>
                        {mov.tipo}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: mov.tipo === 'INGRESO' ? 'var(--success)' : 'var(--danger)' }}>
                      {mov.tipo === 'INGRESO' ? '+' : '-'}${mov.monto.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
