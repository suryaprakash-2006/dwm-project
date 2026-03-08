import React from "react";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import "../../styles/theme.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend);

function Analytics() {
  const pieData = {
    labels: ["Engineering", "HR", "Finance"],
    datasets: [{ data: [50, 30, 20], backgroundColor: ["#2563EB", "#1D4ED8", "#60A5FA"] }],
  };

  const barData = {
    labels: ["Arjun", "Meera", "Rahul"],
    datasets: [{ label: "Hours", data: [40, 25, 35], backgroundColor: "#2563EB" }],
  };

  const lineData = {
    labels: ["Day 1", "Day 2", "Day 3", "Day 4"],
    datasets: [{ label: "Trend", data: [6, 8, 7, 9], borderColor: "#2563EB", tension: 0.3 }],
  };

  return (
    <div className="page">
      <h3>Analytics</h3>
      <div className="row">
        <div className="col-md-4"><div className="card"><h6>Department Distribution</h6><Pie data={pieData} /></div></div>
        <div className="col-md-4"><div className="card"><h6>Employee Hours</h6><Bar data={barData} /></div></div>
        <div className="col-md-4"><div className="card"><h6>Hours Trend</h6><Line data={lineData} /></div></div>
      </div>
    </div>
  );
}

export default Analytics;
