import React, { useState } from "react";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, PointElement, LineElement, Tooltip, Legend,
} from "chart.js";
<<<<<<< HEAD
import { DEPARTMENTS, EMP_OPTIONS, empLabel } from "../../data/masterData";
=======
>>>>>>> 5ab23cc1e1d41bdb87e83040f6bae0b812622797
import "../../styles/theme.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend);

<<<<<<< HEAD
const DEPT_HOURS = [42,38,95,60,55,48,70,35,88,110,75,92,80,45,65,50,55,30];
const COLORS18   = ["#2563EB","#1D4ED8","#3B82F6","#60A5FA","#16a34a","#22c55e","#d97706","#f59e0b","#dc2626","#ef4444","#7c3aed","#8b5cf6","#0891b2","#06b6d4","#be185d","#ec4899","#475569","#64748b"];
const BLUE_SHADES = ["#2563EB","#1D4ED8","#60A5FA","#93C5FD"];
const TASK_LABELS = ["General","Supporting","Task vs Order","Complaints"];
const OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "bottom", labels: { font: { size: 11 }, boxWidth: 12, padding: 8 } } },
};
const NO_LEGEND = { ...OPTS, plugins: { legend: { display: false } } };

function getEmpsByDept(dept) {
  return EMP_OPTIONS.filter((e) => e.dept === dept);
}

export default function Analytics() {
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedEmp,  setSelectedEmp]  = useState("all");
  const [dateFrom,     setDateFrom]     = useState("");
  const [dateTo,       setDateTo]       = useState("");

  const deptsWithEmps = DEPARTMENTS.filter((d) => getEmpsByDept(d).length > 0);
  const empsInDept    = selectedDept === "all" ? EMP_OPTIONS : getEmpsByDept(selectedDept);

  const handleDeptChange = (dept) => { setSelectedDept(dept); setSelectedEmp("all"); };
  const handleReset = () => { setSelectedDept("all"); setSelectedEmp("all"); setDateFrom(""); setDateTo(""); };
  const hasFilter = selectedDept !== "all" || selectedEmp !== "all" || dateFrom || dateTo;

  // Chart data
  const deptBarData = selectedDept === "all"
    ? { labels: deptsWithEmps.map((d) => d.length > 12 ? d.slice(0,11)+"…" : d),
        datasets: [{ label: "Hours", data: deptsWithEmps.map((_, i) => DEPT_HOURS[i] || 30), backgroundColor: COLORS18, borderRadius: 4 }] }
    : { labels: empsInDept.map((e) => e.name.split(" ")[0]),
        datasets: [{ label: "Hours", data: empsInDept.map((_, i) => [40,35,32,28,38,30][i] || 28), backgroundColor: "#2563EB", borderRadius: 4 }] };

  const taskPieData = {
    labels: TASK_LABELS,
    datasets: [{ data: selectedEmp === "all" ? [40,28,20,12] : [35,30,22,13], backgroundColor: BLUE_SHADES }],
  };

  const lineData = {
    labels: ["Day 1","Day 2","Day 3","Day 4","Day 5"],
    datasets: [{ label: "Hours Trend", data: [6,8,7,9,8], borderColor: "#2563EB", backgroundColor: "rgba(37,99,235,0.08)", tension: 0.4, fill: true, pointRadius: 4 }],
  };

  const deptPieData = {
    labels: deptsWithEmps,
    datasets: [{ data: deptsWithEmps.map((_, i) => DEPT_HOURS[i] || 30), backgroundColor: COLORS18 }],
  };

=======
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

>>>>>>> 5ab23cc1e1d41bdb87e83040f6bae0b812622797
  return (
    <div className="page">
      <h3>Analytics</h3>

<<<<<<< HEAD
      {/* Summary cards */}
      <div className="row g-3 mb-4">
        {[
          { label: "Total Employees",     value: EMP_OPTIONS.length  },
          { label: "Total Hours (Month)", value: "1,283"             },
          { label: "Overtime Hours",      value: "142"               },
          { label: "Departments Active",  value: deptsWithEmps.length},
        ].map((c, i) => (
          <div className="col-md-3" key={i}>
            <div className="summary-card"><p>{c.label}</p><h5>{c.value}</h5></div>
=======
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
>>>>>>> 5ab23cc1e1d41bdb87e83040f6bae0b812622797
          </div>
        ))}
      </div>

<<<<<<< HEAD
      {/* ── Filter bar ────────────────────────────────────── */}
      <div style={{
        background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10,
        padding: "16px 20px", marginBottom: 20,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}>
        <div className="row g-3 align-items-end">
          <div className="col-md-3">
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>Department</label>
            <select className="form-select" value={selectedDept} onChange={(e) => handleDeptChange(e.target.value)}>
              <option value="all">— All Departments —</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>Employee</label>
            <select className="form-select" value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)}>
              <option value="all">— All Employees —</option>
              {empsInDept.map((e) => <option key={e.id} value={e.id}>{empLabel(e)}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>From</label>
            <input type="date" className="form-control" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="col-md-2">
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>To</label>
            <input type="date" className="form-control" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="col-md-2">
            {hasFilter && (
              <button className="btn btn-secondary btn-sm w-100" onClick={handleReset}>Reset Filters</button>
            )}
          </div>
        </div>

        {selectedDept !== "all" && (
          <div style={{ marginTop: 10, background: "#dbeafe", border: "1px solid #bfdbfe", borderRadius: 7, padding: "5px 14px", fontSize: 12.5, color: "#1d4ed8", fontWeight: 600, display: "inline-block" }}>
            🏢 {selectedDept} — {empsInDept.length} employee{empsInDept.length !== 1 ? "s" : ""}
            {selectedEmp !== "all" && ` · 👤 ${EMP_OPTIONS.find(e => e.id === selectedEmp)?.name}`}
          </div>
        )}
      </div>

      {/* ── 3 chart cards (top row) ───────────────────────── */}
      <div className="row g-4 mb-4">
        <div className="col-md-5">
          <div className="chart-card">
            <h6>{selectedDept === "all" ? "Hours by Department" : `${selectedDept} — Employee Hours`}</h6>
            <div style={{ height: 240 }}>
              <Bar data={deptBarData} options={NO_LEGEND} />
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="chart-card">
            <h6>Task Distribution</h6>
            <div style={{ height: 240 }}>
              <Pie data={taskPieData} options={OPTS} />
            </div>
=======
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
>>>>>>> 5ab23cc1e1d41bdb87e83040f6bae0b812622797
          </div>
        </div>
        <div className="col-md-4">
          <div className="chart-card">
            <h6>Hours Trend</h6>
<<<<<<< HEAD
            <div style={{ height: 240 }}>
              <Line data={lineData} options={NO_LEGEND} />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3 chart cards (bottom row) ────────────────────── */}
      <div className="row g-4">
        <div className="col-md-4">
          <div className="chart-card">
            <h6>Dept Distribution</h6>
            <div style={{ height: 240 }}>
              <Pie data={deptPieData} options={OPTS} />
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="chart-card">
            <h6>Top Employee Hours</h6>
            <div style={{ height: 240 }}>
              <Bar
                data={{
                  labels: EMP_OPTIONS.slice(0,6).map((e) => e.name.split(" ")[0]),
                  datasets: [{ label: "Hours", data: [40,35,32,28,45,38], backgroundColor: "#2563EB", borderRadius: 4 }],
                }}
                options={NO_LEGEND}
              />
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="chart-card">
            <h6>Overtime vs Regular</h6>
            <div style={{ height: 240 }}>
              <Bar
                data={{
                  labels: EMP_OPTIONS.slice(0,6).map((e) => e.name.split(" ")[0]),
                  datasets: [
                    { label: "Regular", data: [38,32,29,26,40,35], backgroundColor: "#2563EB", borderRadius: 4 },
                    { label: "Overtime", data: [2,3,3,2,5,3], backgroundColor: "#d97706", borderRadius: 4 },
                  ],
                }}
                options={{ ...OPTS, plugins: { legend: { position: "bottom", labels: { font: { size: 11 }, boxWidth: 12, padding: 8 } } } }}
              />
            </div>
=======
            <Line data={lineData} options={OPTS} />
>>>>>>> 5ab23cc1e1d41bdb87e83040f6bae0b812622797
          </div>
        </div>
      </div>
    </div>
  );
}
