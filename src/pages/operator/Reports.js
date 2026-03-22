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
      letterSpacing: "0.3px", minWidth: 80,
      textAlign: "center",
    }}>{s.label}</span>
  );
};

export default function Reports() {
  const rows = [
    { date: "01-03-2026", category: "General",               regular: 8, overtime: 0, status: "P"  },
    { date: "02-03-2026", category: "Task against order",    regular: 8, overtime: 2, status: "P"  },
    { date: "03-03-2026", category: "Supporting Activities", regular: 8, overtime: 0, status: "P"  },
    { date: "04-03-2026", category: "General",               regular: 0, overtime: 0, status: "L"  },
    { date: "05-03-2026", category: "Travel / OD",           regular: 8, overtime: 0, status: "OD" },
  ];

  return (
    <div className="page">
      <h3>My Reports</h3>

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
                <th>REGULAR HRS</th>
                <th>OVERTIME HRS</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: "#334155" }}>{r.date}</td>
                  <td style={{ color: "#475569" }}>{r.category}</td>
                  <td style={{ fontWeight: 600, color: "#0f172a", fontFamily: "monospace" }}>{r.regular}</td>
                  <td style={{ fontWeight: 600, color: r.overtime > 0 ? "#d97706" : "#94a3b8", fontFamily: "monospace" }}>{r.overtime}</td>
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
