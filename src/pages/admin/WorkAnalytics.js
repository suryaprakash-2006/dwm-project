import React, { useState } from "react";
import { Pie, Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { EMP_OPTIONS, empLabel } from "../../data/masterData";
import "../../styles/theme.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const TASK_LABELS = ["General", "Supporting Activities", "Task against order", "Complaints"];
const BLUE_SHADES = ["#2563EB", "#1D4ED8", "#60A5FA", "#93C5FD"];
const OPTS = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { font: { size: 11 }, boxWidth: 12, padding: 8 } } } };

const EMP_DATA = {
  all:    { regular: 120, overtime: 30, total: 150, pieData: [40, 25, 20, 15], barData: [40, 25, 20, 15] },
  "E-001":{ regular: 38,  overtime: 8,  total: 46,  pieData: [45, 22, 20, 13], barData: [45, 22, 20, 13] },
  "H-001":{ regular: 28,  overtime: 4,  total: 32,  pieData: [30, 35, 25, 10], barData: [30, 35, 25, 10] },
  "M-001":{ regular: 32,  overtime: 10, total: 42,  pieData: [50, 18, 18, 14], barData: [50, 18, 18, 14] },
  "H-002":{ regular: 22,  overtime: 4,  total: 26,  pieData: [25, 35, 20, 20], barData: [25, 35, 20, 20] },
};

export default function WorkAnalytics({ user }) {
  const [selected, setSelected] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  const data = EMP_DATA[selected] || EMP_DATA.all;
  const dept = user?.department || "HR";

  const pieData = { labels: TASK_LABELS, datasets: [{ data: data.pieData, backgroundColor: BLUE_SHADES }] };
  const barData = { labels: TASK_LABELS, datasets: [{ label: "Hours", data: data.barData, backgroundColor: "#2563EB", borderRadius: 5 }] };

  return (
    <div className="page">
      <h3>Work Analytics</h3>

      {/* Dept badge */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#dbeafe", border: "1px solid #bfdbfe", borderRadius: 8, padding: "6px 14px", marginBottom: 20 }}>
        <span>🏢</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1d4ed8" }}>Department: {dept}</span>
      </div>

      {/* Filters row: employee + date range */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <label style={{ fontSize: 12.5, fontWeight: 600, color: "#475569", margin: 0 }}>Employee:</label>
        <select className="form-select" style={{ width: 230 }} value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="all">— All Employees —</option>
          {EMP_OPTIONS.map((e) => <option key={e.id} value={e.id}>{empLabel(e)}</option>)}
        </select>

        <label style={{ fontSize: 12.5, fontWeight: 600, color: "#475569", margin: "0 0 0 8px" }}>Date Range:</label>
        <input type="date" className="form-control" style={{ width: 155 }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <span style={{ fontSize: 12.5, color: "#94a3b8" }}>to</span>
        <input type="date" className="form-control" style={{ width: 155 }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        {(selected !== "all" || dateFrom || dateTo) && (
          <button className="btn btn-secondary btn-sm" onClick={() => { setSelected("all"); setDateFrom(""); setDateTo(""); }}>Clear</button>
        )}
      </div>

      {/* Summary */}
      <div className="row g-3 mb-4">
        {[
          { label: "Regular Hours",  value: data.regular  },
          { label: "Overtime Hours", value: data.overtime },
          { label: "Total Hours",    value: data.total    },
        ].map((c, i) => (
          <div className="col-md-4" key={i}>
            <div className="summary-card"><p>{c.label}</p><h5>{c.value}</h5></div>
          </div>
        ))}
      </div>

      {/* 2 chart cards — constrained */}
      <div className="row g-4">
        <div className="col-md-6">
          <div className="chart-card">
            <h6>Task Distribution {selected !== "all" && `— ${EMP_OPTIONS.find(e => e.id === selected)?.name}`}</h6>
            <div style={{ height: 240 }}>
              <Pie data={pieData} options={OPTS} />
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="chart-card">
            <h6>Hours by Category</h6>
            <div style={{ height: 240 }}>
              <Bar data={barData} options={{ ...OPTS, plugins: { legend: { display: false } } }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
