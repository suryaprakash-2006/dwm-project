import React, { useState } from "react";
import { EMP_OPTIONS, empLabel } from "../../data/masterData";
import "../../styles/theme.css";

const StatusBadge = ({ status }) => {
  const map = {
    P:  { label: "Present",  bg: "#16a34a", text: "#fff" },
    L:  { label: "Leave",    bg: "#dc2626", text: "#fff" },
    OD: { label: "On Duty",  bg: "#d97706", text: "#fff" },
    HD: { label: "Half Day", bg: "#2563eb", text: "#fff" },
  };
  const s = map[status] || map["P"];
  return (
    <span style={{ display: "inline-block", background: s.bg, color: s.text, fontSize: 13, fontWeight: 700, padding: "5px 14px", borderRadius: 20, minWidth: 80, textAlign: "center" }}>
      {s.label}
    </span>
  );
};

const ALL_ROWS = [
  { date: "2026-03-01", empId: "E-001", employee: "Arjun Kumar",  hours: 8, overtime: 0, status: "P"  },
  { date: "2026-03-01", empId: "H-001", employee: "Meera Iyer",   hours: 7, overtime: 0, status: "P"  },
  { date: "2026-03-01", empId: "M-001", employee: "Rahul Sharma", hours: 8, overtime: 2, status: "P"  },
  { date: "2026-03-02", empId: "E-001", employee: "Arjun Kumar",  hours: 0, overtime: 0, status: "L"  },
  { date: "2026-03-02", empId: "E-002", employee: "Vikram Das",   hours: 8, overtime: 0, status: "OD" },
  { date: "2026-03-02", empId: "Q-001", employee: "User Staff",   hours: 4, overtime: 0, status: "HD" },
  { date: "2026-03-03", empId: "M-001", employee: "Rahul Sharma", hours: 8, overtime: 1, status: "P"  },
  { date: "2026-03-03", empId: "H-001", employee: "Meera Iyer",   hours: 8, overtime: 0, status: "P"  },
  { date: "2026-03-03", empId: "E-001", employee: "Arjun Kumar",  hours: 8, overtime: 3, status: "P"  },
];

export default function Reports() {
  const [filterEmp, setFilterEmp] = useState("all");
  const [month,     setMonth]     = useState("March 2026");

  const filtered = ALL_ROWS.filter((r) => filterEmp === "all" || r.empId === filterEmp);
  const selectedEmpName = EMP_OPTIONS.find((e) => e.id === filterEmp)?.name;

  return (
    <div className="page">
      <h3>Reports</h3>

      {/* Filters — Employee only + Month */}
      <div className="row mb-3 g-3">
        <div className="col-md-5">
          <label>Employee</label>
          <select className="form-select" value={filterEmp} onChange={(e) => setFilterEmp(e.target.value)}>
            <option value="all">— All Employees —</option>
            {EMP_OPTIONS.map((e) => <option key={e.id} value={e.id}>{empLabel(e)}</option>)}
          </select>
        </div>
        <div className="col-md-4">
          <label>Month</label>
          <select className="form-select" value={month} onChange={(e) => setMonth(e.target.value)}>
            <option>January 2026</option>
            <option>February 2026</option>
            <option>March 2026</option>
          </select>
        </div>
        <div className="col-md-3 d-flex align-items-end">
          {filterEmp !== "all" && (
            <button className="btn btn-secondary btn-sm w-100" onClick={() => setFilterEmp("all")}>Clear Filter</button>
          )}
        </div>
      </div>

      {/* Active filter tag */}
      {filterEmp !== "all" && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <span style={{ background: "#dbeafe", color: "#1d4ed8", fontSize: 12, fontWeight: 600, padding: "3px 12px", borderRadius: 20, display: "flex", alignItems: "center", gap: 6 }}>
            👤 {selectedEmpName}
            <button onClick={() => setFilterEmp("all")} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#1d4ed8", fontWeight: 900, padding: 0, fontSize: 14 }}>×</button>
          </span>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="table table-bordered mb-0 align-middle">
            <thead>
              <tr>
                <th>DATE</th>
                <th>EMP ID</th>
                <th>EMPLOYEE</th>
                <th>REG HRS</th>
                <th>OT HRS</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={6} style={{ textAlign: "center", color: "#94a3b8", padding: "28px", fontSize: 14 }}>No records found.</td></tr>
                : filtered.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: "#334155" }}>{r.date}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 12, color: "#94a3b8" }}>{r.empId}</td>
                    <td style={{ fontWeight: 600, color: "#0f172a" }}>{r.employee}</td>
                    <td style={{ fontWeight: 600, fontFamily: "monospace" }}>{r.hours}</td>
                    <td style={{ fontWeight: 600, fontFamily: "monospace", color: r.overtime > 0 ? "#d97706" : "#94a3b8" }}>{r.overtime}</td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))
              }
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
