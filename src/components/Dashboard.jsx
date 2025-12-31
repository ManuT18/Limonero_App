/*
  -------------------------------------------------------------------------
  1. IMPORTACIONES
  - React Hooks (useMemo, useState, useEffect): Para optimizar cálculos y manejar estado.
  - Supabase: Para obtener datos de Inventario y Caja.
  - Iconos (Lucide): Para visualizar KPIs gráficamente.
  -------------------------------------------------------------------------
*/
import React, { useMemo, useState, useEffect } from "react";
import { supabase } from "../hooks/supabaseClient";
import { useAuth } from "../context/AuthContext";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Activity,
  PieChart,
  Loader2,
} from "lucide-react";

/*
  -------------------------------------------------------------------------
  2. COMPONENTE DASHBOARD
  Vista principal que resume el estado del negocio.
  Muestra tarjetas con KPIs (Indicadores Clave de Desempeño) y gráficos simples.
  -------------------------------------------------------------------------
*/
export function Dashboard() {
  const [inventory, setInventory] = useState([]);
  const [cashbook, setCashbook] = useState([]);
  const [loading, setLoading] = useState(true);

  /*
    A. CARGA DE DATOS (Data Fetching)
    Obtiene métricas crudas de las tablas 'inventory' y 'cashbook'.
    Se optimiza pidiendo solo las columnas necesarias para los cálculos.
  */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: invData } = await supabase
          .from("inventory")
          .select("id, precio, stock");
        const { data: cashData } = await supabase
          .from("cashbook")
          .select("tipo, monto, fecha");

        if (invData) setInventory(invData);
        if (cashData) setCashbook(cashData);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /*
    B. CÁLCULO DE MÉTRICAS (KPIs)
    Se usa useMemo para recalcular solo si cambian los datos de inventario o caja.
    1. Valor Inventario: Suma de (Stock * Precio/g).
    2. Balance: Ingresos - Egresos históricos.
    3. Ingresos Mensuales: Suma de ingresos del mes corriente.
  */
  const kpis = useMemo(() => {
    const inventoryValue = inventory.reduce((total, item) => {
      const precioPorGramo = (item.precio || 0) / 1000;
      return total + precioPorGramo * (item.stock || 0);
    }, 0);

    // Balance Total
    const totalIncome = cashbook
      .filter((m) => m.tipo === "INGRESO")
      .reduce((t, m) => t + (m.monto || 0), 0);
    const totalExpense = cashbook
      .filter((m) => m.tipo === "EGRESO")
      .reduce((t, m) => t + (m.monto || 0), 0);
    const balance = totalIncome - totalExpense;

    // Movimientos del Mes Actual
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyIncome = cashbook.reduce((acc, m) => {
      if (!m.fecha) return acc;

      const d = new Date(m.fecha);
      // Validar fecha válida
      if (isNaN(d.getTime())) return acc;

      if (
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear &&
        m.tipo === "INGRESO"
      ) {
        return acc + (m.monto || 0);
      }
      return acc;
    }, 0);

    return {
      inventoryValue,
      balance,
      monthlyIncome,
      itemCount: inventory.length,
    };
  }, [inventory, cashbook]);

  /*
    C. DATOS PARA GRÁFICOS
    Genera un array con los últimos 6 meses para mostrar la evolución Ingresos vs Egresos.
  */
  const chartData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
      months.push({
        key,
        income: 0,
        expense: 0,
        label: d.toLocaleString("es-ES", { month: "short" }),
      });
    }

    cashbook.forEach((m) => {
      if (!m.fecha) return;
      const d = new Date(m.fecha);
      if (isNaN(d.getTime())) return;

      const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
      const monthData = months.find((x) => x.key === key);

      if (monthData) {
        if (m.tipo === "INGRESO") monthData.income += m.monto || 0;
        if (m.tipo === "EGRESO") monthData.expense += m.monto || 0;
      }
    });
    return months;
  }, [cashbook]);

  // Escala para el gráfico de líneas (Normalización visual)
  const maxChartValue = Math.max(
    ...chartData.map((d) => Math.max(d.income, d.expense)),
    100
  );

  // Helpers para gráfico SVG (Puntos y Líneas)
  const getCoord = (i, val) => {
    const x = i * 20; // Distribuir 6 puntos en 100% (0, 20, 40, 60, 80, 100)
    const y = 100 - (val / maxChartValue) * 100;
    return { x, y };
  };

  const pointsIncome = chartData
    .map((d, i) => {
      const { x, y } = getCoord(i, d.income);
      return `${x},${y}`;
    })
    .join(" ");

  const pointsExpense = chartData
    .map((d, i) => {
      const { x, y } = getCoord(i, d.expense);
      return `${x},${y}`;
    })
    .join(" ");

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <Loader2 className="animate-spin" /> Cargando panel...
      </div>
    );

  /*
    D. RENDERIZADO VISUAL
    - Tarjetas de KPIs (Arriba).
    - Gráfico de Barras CSS (Izquierda abajo).
    - Panel de Resumen Rápido (Derecha abajo).
  */
  return (
    <div className="container">
      <h2 className="section-title" style={{ marginBottom: "2rem" }}>
        <Activity size={24} /> Panel de Control
      </h2>

      {/* KPI Cards */}
      <div
        className="grid-3"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          display: "grid",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {/* Balance Global */}
        <div
          className="card"
          style={{ borderLeft: "4px solid var(--primary)" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
            }}
          >
            <div>
              <div
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                BALANCE GLOBAL
              </div>
              <div
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  color: kpis.balance >= 0 ? "var(--success)" : "var(--danger)",
                }}
              >
                ${kpis.balance.toLocaleString()}
              </div>
            </div>
            <div
              style={{
                padding: "0.5rem",
                background: "var(--background)",
                borderRadius: "50%",
              }}
            >
              <DollarSign size={20} color="var(--primary)" />
            </div>
          </div>
        </div>

        {/* Valor Inventario */}
        <div className="card" style={{ borderLeft: "4px solid #F59E0B" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
            }}
          >
            <div>
              <div
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                VALOR INVENTARIO
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800 }}>
                $
                {kpis.inventoryValue.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>
            </div>
            <div
              style={{
                padding: "0.5rem",
                background: "var(--background)",
                borderRadius: "50%",
              }}
            >
              <Package size={20} color="#F59E0B" />
            </div>
          </div>
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--text-secondary)",
              marginTop: "0.5rem",
            }}
          >
            {kpis.itemCount} rollos registrados
          </div>
        </div>

        {/* Ingresos Mes */}
        <div className="card" style={{ borderLeft: "4px solid #10B981" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
            }}
          >
            <div>
              <div
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                INGRESOS (ESTE MES)
              </div>
              <div
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  color: "#10B981",
                }}
              >
                ${kpis.monthlyIncome.toLocaleString()}
              </div>
            </div>
            <div
              style={{
                padding: "0.5rem",
                background: "var(--background)",
                borderRadius: "50%",
              }}
            >
              <TrendingUp size={20} color="#10B981" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid-2" style={{ alignItems: "start" }}>
        {/* Grafo de Líneas (SVG) */}
        <div className="card">
          <div className="section-title" style={{ fontSize: "1.1rem" }}>
            <TrendingUp size={18} /> Ingresos vs Egresos (6 Meses)
          </div>

          <div style={{ position: "relative", paddingTop: "1rem" }}>
            {/* Contenedor SVG */}
            <div style={{ height: "200px", width: "100%" }}>
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{ width: "100%", height: "100%", overflow: "visible" }}
              >
                {/* Eje Y (Línea base opcional) */}
                <line
                  x1="0"
                  y1="100"
                  x2="100"
                  y2="100"
                  stroke="var(--border)"
                  strokeWidth="1"
                />

                {/* Línea de Ingresos */}
                <polyline
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2"
                  points={pointsIncome}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Línea de Egresos */}
                <polyline
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="2"
                  points={pointsExpense}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Puntos (Ingresos) */}
                {chartData.map((d, i) => {
                  const { x, y } = getCoord(i, d.income);
                  return (
                    <circle
                      key={`inc-${i}`}
                      cx={x}
                      cy={y}
                      r="1.5"
                      fill="#10B981"
                      stroke="var(--card-bg)"
                      strokeWidth="0.5"
                    >
                      <title>Ingresos: ${d.income}</title>
                    </circle>
                  );
                })}

                {/* Puntos (Egresos) */}
                {chartData.map((d, i) => {
                  const { x, y } = getCoord(i, d.expense);
                  return (
                    <circle
                      key={`exp-${i}`}
                      cx={x}
                      cy={y}
                      r="1.5"
                      fill="#EF4444"
                      stroke="var(--card-bg)"
                      strokeWidth="0.5"
                    >
                      <title>Egresos: ${d.expense}</title>
                    </circle>
                  );
                })}
              </svg>
            </div>

            {/* Etiquetas del Eje X */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "0.5rem",
              }}
            >
              {chartData.map((d, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-secondary)",
                    textAlign: "center",
                    width: "20px", // Ancho fijo para centrar respecto al punto
                    transform: "translateX(0)", // Ajuste visual si es necesario
                  }}
                >
                  {d.label}
                </div>
              ))}
            </div>

            {/* Leyenda */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "center",
                marginTop: "1rem",
                fontSize: "0.8rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    background: "#10B981",
                    borderRadius: "50%",
                  }}
                ></div>
                <span>Ingresos</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    background: "#EF4444",
                    borderRadius: "50%",
                  }}
                ></div>
                <span>Egresos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions / Tips */}
        <div className="card">
          <div className="section-title" style={{ fontSize: "1.1rem" }}>
            <PieChart size={18} /> Distribución Rápida
          </div>
          <p
            style={{
              fontSize: "0.9rem",
              color: "var(--text-secondary)",
              marginBottom: "1rem",
            }}
          >
            Un resumen rápido de tu actividad reciente.
          </p>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0.5rem",
                background: "var(--background)",
                borderRadius: "var(--radius)",
              }}
            >
              <span>Promedio Ingreso/Venta</span>
              <strong>
                $
                {Math.round(
                  kpis.monthlyIncome /
                    (cashbook.filter(
                      (m) =>
                        m.tipo === "INGRESO" &&
                        new Date(m.fecha).getFullYear() ===
                          new Date().getFullYear()
                    ).length || 1)
                )}
              </strong>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0.5rem",
                background: "var(--background)",
                borderRadius: "var(--radius)",
              }}
            >
              <span>Materiales en Stock</span>
              <strong>{kpis.itemCount}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
