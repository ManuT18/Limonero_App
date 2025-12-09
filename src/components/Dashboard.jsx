import React, { useMemo } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Activity,
  PieChart,
} from "lucide-react";

export function Dashboard() {
  const [inventory] = useLocalStorage("limonero_inventory", []);
  const [cashbook] = useLocalStorage("limonero_cashbook", []);

  // 1. Cálculos de KPIs
  const kpis = useMemo(() => {
    // Valor del Inventario
    const inventoryValue = inventory.reduce((total, item) => {
      const precioPorGramo = item.precio / 1000; // precio es por KG
      return total + precioPorGramo * item.stock;
    }, 0);

    // Balance Total
    const totalIncome = cashbook
      .filter((m) => m.tipo === "INGRESO")
      .reduce((t, m) => t + m.monto, 0);
    const totalExpense = cashbook
      .filter((m) => m.tipo === "EGRESO")
      .reduce((t, m) => t + m.monto, 0);
    const balance = totalIncome - totalExpense;

    // Movimientos del Mes Actual
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthMoves = cashbook.filter((m) => {
      const d = new Date(m.fecha); // Asumiendo formato compatible o ISO
      // Nota: Si 'fecha' es LocaleString 'dd/mm/yyyy', el Date parse puede fallar.
      // Mejor parsear manualmente si es necesario. En Cashbook se usa new Date().toLocaleString()
      // Intentaremos parseo flexible o usar timestamp si estuviera disponible.
      // Fallback simple: String matching para "M/YYYY" o confiar en Date parse
      return true;
    });
    // *Mejora*: Para asegurar compatibilidad con toLocaleString(), parseamos simple:
    const monthlyIncome = cashbook.reduce((acc, m) => {
      const parts = m.fecha.split(",")[0].split("/"); // dd/mm/yyyy
      if (parts.length !== 3) return acc;
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      if (
        month === currentMonth &&
        year === currentYear &&
        m.tipo === "INGRESO"
      ) {
        return acc + m.monto;
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

  // 2. Datos para Gráfico (Últimos 6 meses)
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
      const parts = m.fecha.split(",")[0].split("/");
      if (parts.length < 3) return;
      const key = `${parseInt(parts[1])}/${parts[2]}`;

      const monthData = months.find((x) => x.key === key);
      if (monthData) {
        if (m.tipo === "INGRESO") monthData.income += m.monto;
        if (m.tipo === "EGRESO") monthData.expense += m.monto;
      }
    });
    return months;
  }, [cashbook]);

  const maxChartValue = Math.max(
    ...chartData.map((d) => Math.max(d.income, d.expense)),
    100
  );

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
        {/* Income vs Expense Chart */}
        <div className="card">
          <div className="section-title" style={{ fontSize: "1.1rem" }}>
            <TrendingUp size={18} /> Ingresos vs Egresos (6 Meses)
          </div>
          <div
            style={{
              height: "200px",
              display: "flex",
              alignItems: "flex-end",
              gap: "1rem",
              paddingTop: "2rem",
            }}
          >
            {chartData.map((d, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  gap: "4px",
                }}
              >
                {/* Bars Container */}
                <div
                  style={{
                    display: "flex",
                    gap: "4px",
                    height: "100%",
                    alignItems: "flex-end",
                    justifyContent: "center",
                  }}
                >
                  {/* Income Bar */}
                  <div
                    style={{
                      width: "30%",
                      height: `${(d.income / maxChartValue) * 100}%`,
                      background: "#10B981",
                      borderRadius: "4px 4px 0 0",
                      transition: "height 0.3s ease",
                      minHeight: d.income > 0 ? "4px" : "0",
                    }}
                    title={`Ingresos: $${d.income}`}
                  />

                  {/* Expense Bar */}
                  <div
                    style={{
                      width: "30%",
                      height: `${(d.expense / maxChartValue) * 100}%`,
                      background: "#EF4444",
                      borderRadius: "4px 4px 0 0",
                      transition: "height 0.3s ease",
                      minHeight: d.expense > 0 ? "4px" : "0",
                    }}
                    title={`Egresos: $${d.expense}`}
                  />
                </div>
                {/* Label */}
                <div
                  style={{
                    textAlign: "center",
                    fontSize: "0.7rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  {d.label}
                </div>
              </div>
            ))}
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
                        m.fecha.includes(new Date().getFullYear())
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
