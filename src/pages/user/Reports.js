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
    { date: "01-02-2026", category: "General",               hours: 8, status: "P"  },
    { date: "02-02-2026", category: "Supporting Activities", hours: 7, status: "P"  },
    { date: "03-02-2026", category: "Task against order",    hours: 8, status: "P"  },
    { date: "04-02-2026", category: "General",               hours: 0, status: "L"  },
    { date: "05-02-2026", category: "Travel / OD",           hours: 8, status: "OD" },
  ];

  return (
    <div className="page">
      <h3>Monthly Reports</h3>

      <div className="mb-4 d-flex align-items-center gap-3">
        <label style={{ margin: 0, fontWeight: 600, fontSize: 13, color: "#475569" }}>Select Month:</label>
        <select className="form-select" style={{ width: "auto", minWidth: 160 }}>
          <option>January 2026</option>
          <option>February 2026</option>
          <option>March 2026</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="table table-bordered mb-0 align-middle">
            <thead>
              <tr>
                <th>DATE</th>
                <th>CATEGORY</th>
                <th>HOURS</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: "#334155" }}>{r.date}</td>
                  <td style={{ color: "#475569" }}>{r.category}</td>
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
