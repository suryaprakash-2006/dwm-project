import React from "react";
import "../../styles/theme.css";

const StatusBadge = ({ status }) => {
  const map = {
    P:  { label: "Present", bg: "#16a34a", text: "#fff" },
    L:  { label: "Leave",   bg: "#dc2626", text: "#fff" },
    OD: { label: "On Duty", bg: "#d97706", text: "#fff" },
  };
  const s = map[status] || map["P"];
  return (
    <span style={{
      display: "inline-block",
      background: s.bg, color: s.text,
      fontSize: 13, fontWeight: 700,
      padding: "5px 14px", borderRadius: 20,
      minWidth: 80, textAlign: "center",
    }}>{s.label}</span>
  );
};

function Reports() {
  const rows = [
    { date: "01-02-2026", employee: "Arjun Kumar",  dept: "Engineering", machine: "CNC Lathe",       hours: 8, status: "P"  },
    { date: "02-02-2026", employee: "Meera Iyer",   dept: "HR",          machine: "Hydraulic Press", hours: 7, status: "P"  },
    { date: "03-02-2026", employee: "Rahul Sharma", dept: "Finance",     machine: "PLC Panel",       hours: 8, status: "P"  },
    { date: "04-02-2026", employee: "Arjun Kumar",  dept: "Engineering", machine: "CNC Lathe",       hours: 0, status: "L"  },
    { date: "05-02-2026", employee: "Vikram Das",   dept: "Engineering", machine: "PLC Panel",       hours: 8, status: "OD" },
  ];

  return (
    <div className="page">
      <h3>Reports</h3>

      <div className="row mb-4 g-3">
        <div className="col-md-3">
          <label>Department</label>
          <select className="form-select">
            <option>All Departments</option>
            <option>Engineering</option>
            <option>HR</option>
            <option>Finance</option>
          </select>
        </div>
        <div className="col-md-3">
          <label>Employee</label>
          <select className="form-select">
            <option>All Employees</option>
            <option>Arjun Kumar</option>
            <option>Meera Iyer</option>
            <option>Rahul Sharma</option>
          </select>
        </div>
        <div className="col-md-3">
          <label>Date Range</label>
          <input type="date" className="form-control mb-2" />
          <input type="date" className="form-control" />
        </div>
        <div className="col-md-3">
          <label>Machine</label>
          <select className="form-select">
            <option>All Machines</option>
            <option>CNC Lathe</option>
            <option>Hydraulic Press</option>
            <option>PLC Panel</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="table table-bordered mb-0 align-middle">
            <thead>
              <tr>
                <th>DATE</th>
                <th>EMPLOYEE</th>
                <th>DEPARTMENT</th>
                <th>MACHINE</th>
                <th>HOURS</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: "#334155" }}>{r.date}</td>
                  <td style={{ fontWeight: 600, color: "#0f172a" }}>{r.employee}</td>
                  <td style={{ color: "#475569" }}>{r.dept}</td>
                  <td style={{ color: "#475569" }}>{r.machine}</td>
                  <td style={{ fontWeight: 600, fontFamily: "monospace", color: "#0f172a" }}>{r.hours}</td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="d-flex gap-2 mt-3">
        <button className="btn btn-outline-primary btn-sm">Export JSON</button>
        <button className="btn btn-outline-primary btn-sm">Export PDF</button>
        <button className="btn btn-outline-primary btn-sm">Export Excel</button>
      </div>
    </div>
  );
}

export default Reports;
