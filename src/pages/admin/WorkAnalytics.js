import React, { useState } from "react";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend,
} from "chart.js";
import "../../styles/theme.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const EMPLOYEES = [
  { id: "all",    name: "— All Employees —" },
  { id: "arjun",  name: "Arjun Kumar"  },
  { id: "meera",  name: "Meera Patel"  },
  { id: "rahul",  name: "Rahul Singh"  },
  { id: "priya",  name: "Priya Nair"   },
  { id: "vikram", name: "Vikram Das"   },
];

const EMP_DATA = {
  all: {
    summary: { regular: 120, overtime: 30, total: 150, breakdown: "Eng: 15 | HR: 5 | Fin: 10" },
    pieData: [40, 25, 20, 15],
    barData: [40, 25, 20, 15],
  },
  arjun:  { summary: { regular: 38, overtime: 8,  total: 46,  breakdown: "Eng: 8"   }, pieData: [45, 22, 20, 13], barData: [45, 22, 20, 13] },
  meera:  { summary: { regular: 28, overtime: 4,  total: 32,  breakdown: "HR: 4"    }, pieData: [30, 35, 25, 10], barData: [30, 35, 25, 10] },
  rahul:  { summary: { regular: 32, overtime: 10, total: 42,  breakdown: "Eng: 7"   }, pieData: [50, 18, 18, 14], barData: [50, 18, 18, 14] },
  priya:  { summary: { regular: 22, overtime: 4,  total: 26,  breakdown: "Fin: 4"   }, pieData: [25, 35, 20, 20], barData: [25, 35, 20, 20] },
  vikram: { summary: { regular: 40, overtime: 4,  total: 44,  breakdown: "Eng: 0"   }, pieData: [55, 15, 20, 10], barData: [55, 15, 20, 10] },
};

const TASK_LABELS = ["General", "Supporting Activities", "Task against order", "Complaints"];
const BLUE_SHADES  = ["#2563EB", "#1D4ED8", "#60A5FA", "#93C5FD"];
const CHART_OPTS   = { responsive: true, plugins: { legend: { position: "bottom" } } };

function WorkAnalytics() {
  const [selected, setSelected] = useState("all");
  const data    = EMP_DATA[selected];
  const empName = EMPLOYEES.find((e) => e.id === selected)?.name || "";

  const pieData = {
    labels:   TASK_LABELS,
    datasets: [{ data: data.pieData, backgroundColor: BLUE_SHADES }],
  };

  const barData = {
    labels:   TASK_LABELS,
    datasets: [{ label: "Hours", data: data.barData, backgroundColor: "#2563EB", borderRadius: 6 }],
  };

  return (
    <div className="page">
      <h3>Work Analytics</h3>

      {/* Summary Cards */}
      <div className="row mb-4 g-3">
        {[
          { label: "Regular Hours",     value: data.summary.regular   },
          { label: "Overtime Hours",    value: data.summary.overtime  },
          { label: "Total Hours",       value: data.summary.total     },
          { label: "Overtime Breakdown", value: data.summary.breakdown, small: true },
        ].map((c, i) => (
          <div className="col-md-3" key={i}>
            <div className="summary-card">
              <p>{c.label}</p>
              <h5 style={c.small ? { fontSize: 15 } : {}}>{c.value}</h5>
            </div>
          </div>
        ))}
      </div>

      {/* Employee Dropdown Filter */}
      <div className="chart-card mb-4">
        <h6>Employee-wise Work Distribution</h6>
        <div className="analytics-filter">
          <label>Select Employee:</label>
          <select
            className="form-select"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            {EMPLOYEES.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          {selected !== "all" && (
            <span className="badge" style={{ background: "#dbeafe", color: "#2563eb", fontSize: 12, padding: "6px 12px", borderRadius: 20 }}>
              Showing: {empName}
            </span>
          )}
        </div>
        <div className="row g-3">
          <div className="col-md-5">
            <div style={{ maxWidth: 300, margin: "0 auto" }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#475569", textAlign: "center", marginBottom: 8 }}>TASK DISTRIBUTION</p>
              <Pie data={pieData} options={CHART_OPTS} />
            </div>
          </div>
          <div className="col-md-7">
            <p style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 8 }}>HOURS BY CATEGORY</p>
            <Bar data={barData} options={{ ...CHART_OPTS, plugins: { legend: { display: false } } }} />
          </div>
        </div>
      </div>

      {/* Overall charts */}
      <div className="row g-3">
        <div className="col-md-6">
          <div className="chart-card">
            <h6>Overall Task Distribution</h6>
            <Pie data={{
              labels: TASK_LABELS,
              datasets: [{ data: EMP_DATA.all.pieData, backgroundColor: BLUE_SHADES }],
            }} options={CHART_OPTS} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="chart-card">
            <h6>Entries — High to Low</h6>
            <Bar data={{
              labels: TASK_LABELS,
              datasets: [{ label: "Hours", data: EMP_DATA.all.barData, backgroundColor: "#2563EB", borderRadius: 6 }],
            }} options={{ ...CHART_OPTS, plugins: { legend: { display: false } } }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkAnalytics;
