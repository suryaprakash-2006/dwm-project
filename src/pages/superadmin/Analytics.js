import React, { useState } from "react";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, PointElement, LineElement, Tooltip, Legend,
} from "chart.js";
import "../../styles/theme.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend);

const DEPARTMENTS = ["Engineering", "HR", "Finance"];

const DEPT_DATA = {
  Engineering: {
    employees: ["Arjun Kumar", "Vikram Das", "Suresh Raj"],
    hours: [40, 38, 35],
    tasks: [50, 20, 20, 10],
  },
  HR: {
    employees: ["Meera Iyer", "Priya Nair"],
    hours: [28, 22],
    tasks: [30, 35, 25, 10],
  },
  Finance: {
    employees: ["Rahul Sharma", "Kiran Bose"],
    hours: [35, 30],
    tasks: [20, 30, 30, 20],
  },
};

const TASK_LABELS = ["General", "Supporting Activities", "Task vs Order", "Complaints"];
const DEPT_COLORS = { Engineering: "#2563EB", HR: "#16a34a", Finance: "#d97706" };
const BLUE_SHADES = ["#2563EB", "#1D4ED8", "#60A5FA", "#93C5FD"];
const OPTS = { responsive: true, plugins: { legend: { position: "bottom" } } };

export default function Analytics() {
  const [selectedDept, setSelectedDept] = useState("all");

  const pieData = {
    labels: DEPARTMENTS,
    datasets: [{ data: [50, 30, 20], backgroundColor: ["#2563EB", "#16a34a", "#d97706"] }],
  };

  const lineData = {
    labels: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"],
    datasets: [{
      label: "Hours Trend",
      data: [6, 8, 7, 9, 8],
      borderColor: "#2563EB",
      backgroundColor: "rgba(37,99,235,0.1)",
      tension: 0.4,
      fill: true,
    }],
  };

  const deptEmpBarData = selectedDept === "all" ? {
    labels: DEPARTMENTS,
    datasets: [{
      label: "Total Hours",
      data: [113, 50, 65],
      backgroundColor: ["#2563EB", "#16a34a", "#d97706"],
      borderRadius: 6,
    }],
  } : {
    labels: DEPT_DATA[selectedDept].employees,
    datasets: [{
      label: "Hours",
      data: DEPT_DATA[selectedDept].hours,
      backgroundColor: DEPT_COLORS[selectedDept],
      borderRadius: 6,
    }],
  };

  const taskPieData = selectedDept === "all"
    ? { labels: TASK_LABELS, datasets: [{ data: [40, 28, 20, 12], backgroundColor: BLUE_SHADES }] }
    : { labels: TASK_LABELS, datasets: [{ data: DEPT_DATA[selectedDept].tasks, backgroundColor: BLUE_SHADES }] };

  return (
    <div className="page">
      <h3>Analytics</h3>

      {/* Summary row */}
      <div className="row g-3 mb-4">
        {[
          { label: "Total Employees", value: "7" },
          { label: "Total Hours (Month)", value: "228" },
          { label: "Overtime Hours", value: "42" },
          { label: "Active Departments", value: "3" },
        ].map((c, i) => (
          <div className="col-md-3" key={i}>
            <div className="summary-card">
              <p>{c.label}</p>
              <h5>{c.value}</h5>
            </div>
          </div>
        ))}
      </div>

      {/* Department-wise Employee Distribution */}
      <div className="chart-card mb-4">
        <h6>Department-wise Employee Distribution</h6>
        <div className="analytics-filter">
          <label>Filter by Department:</label>
          <select
            className="form-select"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="all">— All Departments —</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {selectedDept !== "all" && (
            <span className="badge" style={{
              background: "#dbeafe", color: "#2563eb",
              fontSize: 12, padding: "6px 12px", borderRadius: 20
            }}>
              {DEPT_DATA[selectedDept].employees.length} employees in {selectedDept}
            </span>
          )}
        </div>
        <div className="row g-3">
          <div className="col-md-6">
            <p style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
              {selectedDept === "all" ? "HOURS BY DEPARTMENT" : `EMPLOYEE HOURS — ${selectedDept.toUpperCase()}`}
            </p>
            <Bar data={deptEmpBarData} options={{ ...OPTS, plugins: { legend: { display: false } } }} />
          </div>
          <div className="col-md-6">
            <p style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>TASK DISTRIBUTION</p>
            <Pie data={taskPieData} options={OPTS} />
          </div>
        </div>
      </div>

      {/* Bottom row: overall charts */}
      <div className="row g-3">
        <div className="col-md-4">
          <div className="chart-card">
            <h6>Department Distribution</h6>
            <Pie data={pieData} options={OPTS} />
          </div>
        </div>
        <div className="col-md-4">
          <div className="chart-card">
            <h6>Employee Hours</h6>
            <Bar
              data={{
                labels: ["Arjun", "Meera", "Rahul", "Priya", "Vikram"],
                datasets: [{ label: "Hours", data: [40, 28, 35, 22, 38], backgroundColor: "#2563EB", borderRadius: 6 }],
              }}
              options={{ ...OPTS, plugins: { legend: { display: false } } }}
            />
          </div>
        </div>
        <div className="col-md-4">
          <div className="chart-card">
            <h6>Hours Trend</h6>
            <Line data={lineData} options={OPTS} />
          </div>
        </div>
      </div>
    </div>
  );
}
