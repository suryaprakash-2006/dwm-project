import React, { useState } from "react";
import { DEPARTMENTS, EMP_OPTIONS, empLabel } from "../../data/masterData";
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
  { date: "2026-03-01", empId: "E-001", employee: "Arjun Kumar",  dept: "Engineering Design",  machine: "CNC Lathe",       hours: 8, overtime: 0, status: "P"  },
  { date: "2026-03-01", empId: "H-001", employee: "Meera Iyer",   dept: "Human Resource",      machine: "—",               hours: 7, overtime: 0, status: "P"  },
  { date: "2026-03-01", empId: "M-001", employee: "Rahul Sharma", dept: "Machining Division",  machine: "PLC Panel",       hours: 8, overtime: 2, status: "P"  },
  { date: "2026-03-02", empId: "E-001", employee: "Arjun Kumar",  dept: "Engineering Design",  machine: "CNC Lathe",       hours: 0, overtime: 0, status: "L"  },
  { date: "2026-03-02", empId: "E-002", employee: "Vikram Das",   dept: "Engineering Design",  machine: "Hydraulic Press", hours: 8, overtime: 0, status: "OD" },
  { date: "2026-03-02", empId: "Q-001", employee: "User Staff",   dept: "Quality Assurance",   machine: "—",               hours: 4, overtime: 0, status: "HD" },
  { date: "2026-03-03", empId: "M-001", employee: "Rahul Sharma", dept: "Machining Division",  machine: "CNC Lathe",       hours: 8, overtime: 1, status: "P"  },
  { date: "2026-03-03", empId: "H-001", employee: "Meera Iyer",   dept: "Human Resource",      machine: "—",               hours: 8, overtime: 0, status: "P"  },
  { date: "2026-03-03", empId: "E-001", employee: "Arjun Kumar",  dept: "Engineering Design",  machine: "PLC Panel",       hours: 8, overtime: 3, status: "P"  },
  { date: "2026-03-04", empId: "P-001", employee: "Ravi Menon",   dept: "Product Assembly",    machine: "—",               hours: 8, overtime: 0, status: "P"  },
  { date: "2026-03-04", empId: "SC-001",employee: "Kavya Reddy",  dept: "Supply Chain Management","machine": "—",          hours: 7, overtime: 0, status: "P"  },
];

const MACHINES = ["All Machines", "CNC Lathe", "Hydraulic Press", "PLC Panel", "—"];

export default function Reports() {
  const [filterEmp,     setFilterEmp]     = useState("all");
  const [filterDept,    setFilterDept]    = useState("All Departments");
  const [filterMachine, setFilterMachine] = useState("All Machines");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  // When dept changes, reset employee filter
  const handleDeptChange = (dept) => { setFilterDept(dept); setFilterEmp("all"); };

  const empsForDept = filterDept === "All Departments"
    ? EMP_OPTIONS
    : EMP_OPTIONS.filter((e) => e.dept === filterDept);

  const filtered = ALL_ROWS.filter((r) => {
    if (filterEmp  !== "all"             && r.empId   !== filterEmp)     return false;
    if (filterDept !== "All Departments" && r.dept    !== filterDept)    return false;
    if (filterMachine !== "All Machines" && r.machine !== filterMachine) return false;
    if (dateFrom && r.date < dateFrom) return false;
    if (dateTo   && r.date > dateTo)   return false;
    return true;
  });

  const selectedEmpName = EMP_OPTIONS.find((e) => e.id === filterEmp)?.name;

  return (
    <div className="page">
      <h3>Reports</h3>

      {/* Filters */}
      <div className="row mb-3 g-3">
        <div className="col-md-3">
          <label>Department</label>
          <select className="form-select" value={filterDept} onChange={(e) => handleDeptChange(e.target.value)}>
            <option>All Departments</option>
            {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="col-md-3">
          <label>Employee</label>
          <select className="form-select" value={filterEmp} onChange={(e) => setFilterEmp(e.target.value)}>
            <option value="all">— All Employees —</option>
            {empsForDept.map((e) => <option key={e.id} value={e.id}>{empLabel(e)}</option>)}
          </select>
        </div>
        <div className="col-md-3">
          <label>Machine</label>
          <select className="form-select" value={filterMachine} onChange={(e) => setFilterMachine(e.target.value)}>
            {MACHINES.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="col-md-3">
          <label>Date Range</label>
          <input type="date" className="form-control mb-1" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <input type="date" className="form-control"      value={dateTo}   onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      {/* Active filter tags */}
      {(filterEmp !== "all" || filterDept !== "All Departments" || filterMachine !== "All Machines" || dateFrom || dateTo) && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
          {filterDept !== "All Departments" && (
            <span style={{ background: "#dcfce7", color: "#16a34a", fontSize: 12, fontWeight: 600, padding: "3px 12px", borderRadius: 20, display: "flex", alignItems: "center", gap: 6 }}>
              🏢 {filterDept}
              <button onClick={() => handleDeptChange("All Departments")} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#16a34a", fontWeight: 900, padding: 0 }}>×</button>
            </span>
          )}
          {filterEmp !== "all" && (
            <span style={{ background: "#dbeafe", color: "#1d4ed8", fontSize: 12, fontWeight: 600, padding: "3px 12px", borderRadius: 20, display: "flex", alignItems: "center", gap: 6 }}>
              👤 {selectedEmpName}
              <button onClick={() => setFilterEmp("all")} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#1d4ed8", fontWeight: 900, padding: 0 }}>×</button>
            </span>
          )}
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
                <th>DEPARTMENT</th>
                <th>MACHINE</th>
                <th>REG HRS</th>
                <th>OT HRS</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={8} style={{ textAlign: "center", color: "#94a3b8", padding: "30px", fontSize: 14 }}>No records found for selected filters.</td></tr>
                : filtered.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: "#334155" }}>{r.date}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 12, color: "#94a3b8" }}>{r.empId}</td>
                    <td style={{ fontWeight: 600, color: "#0f172a" }}>{r.employee}</td>
                    <td style={{ color: "#475569", fontSize: 13 }}>{r.dept}</td>
                    <td style={{ color: "#475569" }}>{r.machine}</td>
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
