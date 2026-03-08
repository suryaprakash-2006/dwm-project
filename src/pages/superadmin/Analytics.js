import React from "react";
import "../../styles/theme.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
} from "chart.js";

import { Pie, Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

function Analytics() {

  const pieData = {
    labels: ["Machine Work", "Maintenance", "Inspection", "Reports"],
    datasets: [
      {
        data: [40, 25, 20, 15],
        backgroundColor: ["#ff6384", "#36a2eb", "#ffce56", "#4bc0c0"]
      }
    ]
  };

  const barData = {
    labels: ["Operator1", "Operator2", "Operator3", "Operator4"],
    datasets: [
      {
        label: "Hours",
        data: [120, 90, 75, 60],
        backgroundColor: "#36a2eb"
      }
    ]
  };

  const lineData = {
    labels: ["Week1", "Week2", "Week3", "Week4"],
    datasets: [
      {
        label: "Work Trend",
        data: [30, 40, 35, 50],
        borderColor: "#ff6384"
      }
    ]
  };

  const overtimeHours = 32;

  return (

    <div className="page">

      <h3>Analytics Dashboard</h3>

      <div className="row">

        <div className="col-md-6 mb-4">
          <div className="card p-3">
            <h5>Task Distribution</h5>
            <Pie data={pieData} />
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card p-3">
            <h5>Employee Hours</h5>
            <Bar data={barData} />
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card p-3">
            <h5>Weekly Trend</h5>
            <Line data={lineData} />
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card p-3 text-center">
            <h5>Overtime Hours</h5>
            <h2>{overtimeHours}</h2>
          </div>
        </div>

      </div>

    </div>

  );

}

export default Analytics;