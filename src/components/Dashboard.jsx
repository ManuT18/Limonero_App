/*
Copyright (C) 2025 Manuel Tauro

This work is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License.
To view a copy of this license, visit http://creativecommons.org/licenses/by-nc/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
*/

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
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/*
  -------------------------------------------------------------------------
  2. COMPONENTE DASHBOARD
  Vista principal que resume el estado del negocio.
  Muestra tarjetas con KPIs (Indicadores Clave de Desempeño) y gráficos simples.
  -------------------------------------------------------------------------
*/
export function Dashboard() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [cashbook, setCashbook] = useState([]);
  const [loading, setLoading] = useState(true);

  const userName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuario";

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

      {/* Saludo de Bienvenida */}
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "1.8rem",
            fontWeight: "bold",
            color: "var(--text-main)",
            marginBottom: "0.25rem",
          }}
        >
          ¡Hola, {userName}! 👋
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
          Aquí tienes un resumen de tu actividad reciente en el taller.
        </p>
      </div>

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

          <div
            style={{
              position: "relative",
              paddingTop: "1rem",
              height: "300px",
              width: "100%",
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="colorIngresos"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorEgresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card-bg)",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    color: "var(--text-main)",
                  }}
                  itemStyle={{ fontSize: "0.9rem", fontWeight: 500 }}
                  labelStyle={{
                    color: "var(--text-secondary)",
                    marginBottom: "0.5rem",
                  }}
                  formatter={(value) => [
                    `$${value.toLocaleString()}`,
                    undefined,
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Ingresos"
                  stroke="#10B981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorIngresos)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="Egresos"
                  stroke="#EF4444"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorEgresos)"
                />
              </AreaChart>
            </ResponsiveContainer>
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
