import React, { useState, useEffect } from "react";
import { Pie, Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import "../../styles/theme.css";
import config from "../../config";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, ChartDataLabels);

const PIE_COLORS = ["#2563EB", "#1D4ED8", "#3B82F6", "#60A5FA", "#10B981", "#34D399", "#F59E0B", "#FBBF24"];

const pieOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { position: "bottom", labels: { font: { size: 11 }, boxWidth: 13, padding: 10 } },
    datalabels: {
      color: "#fff", font: { weight: "bold", size: 12 },
      formatter: (v, ctx) => { const t = ctx.dataset.data.reduce((a, b) => a + b, 0); return t > 0 ? `${Math.round((v / t) * 100)}%` : ""; }
    },
    tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed} hrs` } },
  },
};

const barOpts = {
  responsive: true, maintainAspectRatio: false, indexAxis: "y",
  plugins: {
    legend: { display: false },
    datalabels: { anchor: "end", align: "end", color: "#1e293b", font: { weight: "bold", size: 11 }, formatter: (v) => `${v} hrs` },
    tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.x} hrs` } },
  },
  scales: {
    x: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { size: 11 } } },
    y: { grid: { display: false }, ticks: { font: { size: 12, weight: "600" } } },
  },
};

const GRAPH_TABS = [
  { key: "pie", icon: "🥧", label: "Task Distribution" },
  { key: "bar", icon: "📊", label: "Hours" },
];

export default function WorkAnalytics({ user }) {
  const [employees, setEmployees]     = useState([]);
  const [workRows, setWorkRows]       = useState([]);

  const [selected, setSelected]       = useState("all");
  const [dateFrom, setDateFrom]       = useState("");
  const [dateTo, setDateTo]           = useState("");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [activeGraph, setActiveGraph] = useState("pie");

  const dept = user?.department || user?.dept || "";

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { "Authorization": `Bearer ${token}` };

        // Fetch employees
        const empRes = await fetch(`${config.API_URL}/employees`, { headers });
        if (empRes.ok && mounted) {
          const emps = await empRes.json();
          // Filter to admin's department
          setEmployees(emps.filter(e => e.dept === dept));
        }

        // Fetch work summaries (automatically filtered by admin's department on backend)
        const workRes = await fetch(`${config.API_URL}/reports/work-summary`, { headers });
        if (workRes.ok && mounted) {
          setWorkRows(await workRes.json());
        }
      } catch (err) {
        console.warn("Failed to load work analytics data", err);
      }
    })();
    return () => { mounted = false; };
  }, [dept]);

  // Filter local time entries dynamically
  const filteredRows = workRows.filter((r) => {
    if (selected !== "all" && r.empId !== selected) return false;
    if (shiftFilter !== "all" && r.shift !== shiftFilter) return false;
    if (dateFrom && r.date < dateFrom) return false;
    if (dateTo && r.date > dateTo) return false;
    return true;
  });

  // Calculate totals
  const totalRegular = filteredRows.reduce((acc, r) => acc + r.regularHours, 0);
  const totalOvertime = filteredRows.reduce((acc, r) => acc + r.overtimeHours, 0);
  const totalCombined = totalRegular + totalOvertime;

  // Task distribution grouping
  const taskMap = {};
  filteredRows.forEach((r) => {
    const cat = r.category || "General";
    taskMap[cat] = (taskMap[cat] || 0) + (r.regularHours + r.overtimeHours);
  });

  const taskData = Object.entries(taskMap).map(([l, v]) => ({ l, v: roundToTwo(v) }));
  const taskSorted = [...taskData].sort((a, b) => b.v - a.v);

  function roundToTwo(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  const makePie = (d) => ({
    labels: d.map(x => x.l),
    datasets: [{ data: d.map(x => x.v), backgroundColor: PIE_COLORS, borderWidth: 2, borderColor: "#fff", hoverOffset: 6 }]
  });

  const makeBar = (d) => ({
    labels: d.map(x => x.l),
    datasets: [{ data: d.map(x => x.v), backgroundColor: ["#2563EB", "#3B82F6", "#60A5FA", "#93C5FD", "#10B981", "#34D399"], borderRadius: 6, borderSkipped: false }]
  });

  const selectedName = employees.find(e => e.id === selected)?.name;

  return (
    <div className="page">
      <h3>Work Analytics</h3>

      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#dbeafe", border: "1px solid #bfdbfe", borderRadius: 8, padding: "6px 14px", marginBottom: 16 }}>
        <span>🏢</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1d4ed8" }}>Department: {dept}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <label style={{ fontSize: 12.5, fontWeight: 600, color: "#475569", margin: 0 }}>Employee:</label>
        <select className="form-select" style={{ width: 230 }} value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="all">— All Employees —</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.empNo})</option>)}
        </select>
        <label style={{ fontSize: 12.5, fontWeight: 600, color: "#475569", margin: "0 0 0 8px" }}>Shift:</label>
        <select className="form-select" style={{ width: 120 }} value={shiftFilter} onChange={(e) => setShiftFilter(e.target.value)}>
          <option value="all">All Shifts</option>
          <option value="A">Shift A</option>
          <option value="B">Shift B</option>
          <option value="C">Shift C</option>
        </select>
        <label style={{ fontSize: 12.5, fontWeight: 600, color: "#475569", margin: "0 0 0 8px" }}>Date Range:</label>
        <input type="date" className="form-control" style={{ width: 155 }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <span style={{ fontSize: 12.5, color: "#94a3b8" }}>to</span>
        <input type="date" className="form-control" style={{ width: 155 }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        {(selected !== "all" || dateFrom || dateTo || shiftFilter !== "all") && (
          <button className="btn btn-secondary btn-sm" onClick={() => { setSelected("all"); setDateFrom(""); setDateTo(""); setShiftFilter("all"); }}>Clear</button>
        )}
      </div>

      <div className="row g-3 mb-4">
        {[
          { label: "Regular Hours", value: roundToTwo(totalRegular) },
          { label: "Overtime Hours", value: roundToTwo(totalOvertime) },
          { label: "Total Hours", value: roundToTwo(totalCombined) }
        ].map((c, i) => (
          <div className="col-md-4" key={i}>
            <div className="summary-card">
              <p>{c.label}</p>
              <h5>{c.value}</h5>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {GRAPH_TABS.map((t) => (
          <button key={t.key} onClick={() => setActiveGraph(t.key)} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 22px", borderRadius: 10, border: "2px solid",
            borderColor: activeGraph === t.key ? "#2563eb" : "#e2e8f0",
            background: activeGraph === t.key ? "#dbeafe" : "#fff",
            color: activeGraph === t.key ? "#1d4ed8" : "#64748b",
            fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.15s",
            boxShadow: activeGraph === t.key ? "0 2px 8px rgba(37,99,235,0.2)" : "none",
          }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div className="chart-card" style={{ minHeight: 320 }}>
        {taskSorted.length === 0 ? (
          <p style={{ textAlign: "center", padding: 50, color: "#94a3b8" }}>No work logs found matching selected criteria.</p>
        ) : (
          <>
            {activeGraph === "pie" && (
              <>
                <h6>Task Distribution {selected !== "all" && `— ${selectedName}`}</h6>
                <div style={{ height: 280 }}><Pie data={makePie(taskSorted)} options={pieOpts} /></div>
              </>
            )}
            {activeGraph === "bar" && (
              <>
                <h6>Hours by Category — High to Low</h6>
                <div style={{ height: 280 }}><Bar data={makeBar(taskSorted)} options={barOpts} /></div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
