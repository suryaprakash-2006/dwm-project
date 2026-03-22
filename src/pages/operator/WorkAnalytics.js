import React from "react";
import { Pie, Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import "../../styles/theme.css";
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const LABELS = ["General", "Supporting Activities", "Task against order", "Complaints"];
const BLUES  = ["#2563EB", "#1D4ED8", "#60A5FA", "#93C5FD"];
const OPTS   = { responsive: true, plugins: { legend: { position: "bottom" } } };

export default function WorkAnalytics() {
  const pieData = { labels: LABELS, datasets: [{ data: [35, 30, 25, 10], backgroundColor: BLUES }] };
  const barData = { labels: LABELS, datasets: [{ label: "Hours", data: [35, 30, 25, 10], backgroundColor: "#2563EB", borderRadius: 6 }] };

  return (
    <div className="page">
      <h3>Work Analytics</h3>
      <div className="row g-3 mb-4">
        {[{ label: "Regular Hours", value: 120 }, { label: "Overtime Hours", value: 20 }, { label: "Total Hours", value: 140 }].map((c, i) => (
          <div className="col-md-4" key={i}>
            <div className="summary-card"><p>{c.label}</p><h5>{c.value}</h5></div>
          </div>
        ))}
      </div>
      <div className="row g-3">
        <div className="col-md-6">
          <div className="chart-card"><h6>Task Distribution</h6><Pie data={pieData} options={OPTS} /></div>
        </div>
        <div className="col-md-6">
          <div className="chart-card"><h6>Hours by Category</h6><Bar data={barData} options={{ ...OPTS, plugins: { legend: { display: false } } }} /></div>
        </div>
      </div>
    </div>
  );
}
