<<<<<<< HEAD
import React, { useState } from "react";
import { Pie, Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import "../../styles/theme.css";

=======
import React from "react";
import { Pie, Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import "../../styles/theme.css";
>>>>>>> 5ab23cc1e1d41bdb87e83040f6bae0b812622797
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const LABELS = ["General", "Supporting Activities", "Task against order", "Complaints"];
const BLUES  = ["#2563EB", "#1D4ED8", "#60A5FA", "#93C5FD"];
<<<<<<< HEAD
const OPTS   = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { font: { size: 11 }, boxWidth: 12, padding: 8 } } } };

export default function WorkAnalytics() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  const pieData = { labels: LABELS, datasets: [{ data: [35, 30, 25, 10], backgroundColor: BLUES }] };
  const barData = { labels: LABELS, datasets: [{ label: "Hours", data: [35, 30, 25, 10], backgroundColor: "#2563EB", borderRadius: 5 }] };
=======
const OPTS   = { responsive: true, plugins: { legend: { position: "bottom" } } };

export default function WorkAnalytics() {
  const pieData = { labels: LABELS, datasets: [{ data: [35, 30, 25, 10], backgroundColor: BLUES }] };
  const barData = { labels: LABELS, datasets: [{ label: "Hours", data: [35, 30, 25, 10], backgroundColor: "#2563EB", borderRadius: 6 }] };
>>>>>>> 5ab23cc1e1d41bdb87e83040f6bae0b812622797

  return (
    <div className="page">
      <h3>Work Analytics</h3>
<<<<<<< HEAD

      {/* Date Range */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <label style={{ fontSize: 12.5, fontWeight: 600, color: "#475569", margin: 0 }}>Date Range:</label>
        <input type="date" className="form-control" style={{ width: 160 }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <span style={{ fontSize: 12.5, color: "#94a3b8" }}>to</span>
        <input type="date" className="form-control" style={{ width: 160 }} value={dateTo}   onChange={(e) => setDateTo(e.target.value)} />
        {(dateFrom || dateTo) && (
          <button className="btn btn-secondary btn-sm" onClick={() => { setDateFrom(""); setDateTo(""); }}>Clear</button>
        )}
      </div>

      {/* Summary */}
=======
>>>>>>> 5ab23cc1e1d41bdb87e83040f6bae0b812622797
      <div className="row g-3 mb-4">
        {[{ label: "Regular Hours", value: 120 }, { label: "Overtime Hours", value: 20 }, { label: "Total Hours", value: 140 }].map((c, i) => (
          <div className="col-md-4" key={i}>
            <div className="summary-card"><p>{c.label}</p><h5>{c.value}</h5></div>
          </div>
        ))}
      </div>
<<<<<<< HEAD

      {/* 2 chart cards */}
      <div className="row g-4">
        <div className="col-md-6">
          <div className="chart-card">
            <h6>Task Distribution</h6>
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
=======
      <div className="row g-3">
        <div className="col-md-6">
          <div className="chart-card"><h6>Task Distribution</h6><Pie data={pieData} options={OPTS} /></div>
        </div>
        <div className="col-md-6">
          <div className="chart-card"><h6>Hours by Category</h6><Bar data={barData} options={{ ...OPTS, plugins: { legend: { display: false } } }} /></div>
>>>>>>> 5ab23cc1e1d41bdb87e83040f6bae0b812622797
        </div>
      </div>
    </div>
  );
}
