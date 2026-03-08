import React from "react";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import "../../styles/theme.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

function WorkAnalytics() {
  const pieData = {
    labels: ["General", "Supporting Activities", "Task against order", "Complaints"],
    datasets: [
      {
        data: [40, 25, 20, 15],
        backgroundColor: ["#2563EB", "#1D4ED8", "#60A5FA", "#93C5FD"],
      },
    ],
  };

  const barData = {
    labels: ["General", "Supporting Activities", "Task against order", "Complaints"],
    datasets: [
      {
        label: "Hours",
        data: [40, 25, 20, 15],
        backgroundColor: "#2563EB",
      },
    ],
  };

  return (
    <div className="page">
      <h3>Work Analytics</h3>
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card">
            <p>Total Regular Hours</p>
            <h5>120</h5>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <p>Total Overtime Hours</p>
            <h5>30</h5>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <p>Total Hours</p>
            <h5>150</h5>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <h6>Task Distribution</h6>
            <Pie data={pieData} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <h6>Entries (High to Low)</h6>
            <Bar data={barData} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkAnalytics;
