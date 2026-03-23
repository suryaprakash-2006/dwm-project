import React, { useState } from "react";
import { DEPARTMENTS, EMPLOYEES as MASTER_EMPS, empLabel } from "../../data/masterData";
import "../../styles/theme.css";

// All employees grouped by department with role info
// Using shared master data
const INITIAL_EMPLOYEES = MASTER_EMPS;

const ROLE_COLOR = {
  SUPER_ADMIN: { bg: "#fee2e2", color: "#dc2626" },
  ADMIN:       { bg: "#fef3c7", color: "#d97706" },
  USER:        { bg: "#dbeafe", color: "#2563eb" },
  OPERATOR:    { bg: "#dcfce7", color: "#16a34a" },
};

export default function Employees() {
  const [employees, setEmployees]     = useState(INITIAL_EMPLOYEES);
  const [filterDept, setFilterDept]   = useState("all");
  const [showAdd, setShowAdd]         = useState(false);
  const [alert, setAlert]             = useState(null);
  const [editEmp, setEditEmp]         = useState(null);
  const [confirmId, setConfirmId]     = useState(null);
  const [newEmp, setNewEmp]           = useState({ name: "", email: "", role: "USER", dept: "" });

  const showMsg = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const depts    = ["all", "System", ...DEPARTMENTS];
  const filtered = filterDept === "all" ? employees : employees.filter((e) => e.dept === filterDept);

  const addEmployee = () => {
    if (!newEmp.name.trim() || !newEmp.email.trim() || !newEmp.dept.trim()) return;
    const id = `EMP-${Date.now()}`;
    setEmployees((prev) => [...prev, { ...newEmp, id, active: true }]);
    setNewEmp({ name: "", email: "", role: "USER", dept: "" });
    setShowAdd(false);
    showMsg("success", "Employee added successfully.");
  };

  const saveEdit = () => {
    if (!editEmp) return;
    setEmployees((prev) => prev.map((e) => e.id === editEmp.id ? { ...e, ...editEmp } : e));
    setEditEmp(null);
    showMsg("success", "Employee updated.");
  };

  const toggleActive = () => {
    const emp = employees.find((e) => e.id === confirmId);
    setEmployees((prev) => prev.map((e) => e.id === confirmId ? { ...e, active: !e.active } : e));
    showMsg(emp.active ? "warning" : "success", `${emp.name} ${emp.active ? "disabled" : "enabled"}.`);
    setConfirmId(null);
  };

  // Group by department for display
  const deptGroups = {};
  filtered.forEach((e) => {
    if (!deptGroups[e.dept]) deptGroups[e.dept] = [];
    deptGroups[e.dept].push(e);
  });

  return (
    <div className="page">
      <div className="container-fluid">
        <h3 className="mb-1">Employees</h3>

        {alert && (
          <div className={`alert alert-${alert.type === "success" ? "success" : "warning"}`}>
            {alert.message}
          </div>
        )}

        {/* Top bar */}
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-3">
            <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>
              {filtered.length} employee{filtered.length !== 1 ? "s" : ""}
            </span>
            <div className="d-flex align-items-center gap-2">
              <label style={{ margin: 0, fontSize: 12.5 }}>Department:</label>
              <select
                className="form-select"
                style={{ width: "auto", fontSize: 13 }}
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
              >
                {depts.map((d) => (
                  <option key={d} value={d}>{d === "all" ? "All Departments" : d}</option>
                ))}
              </select>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
            + Add Employee
          </button>
        </div>

        {/* Add Form */}
        {showAdd && (
          <div className="card mb-4" style={{ padding: "20px" }}>
            <h6 style={{ marginBottom: 16, fontWeight: 700 }}>New Employee</h6>
            <div className="row g-2">
              <div className="col-md-3">
                <label>Name</label>
                <input className="form-control" placeholder="Full name"
                  value={newEmp.name} onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })} />
              </div>
              <div className="col-md-3">
                <label>Email</label>
                <input className="form-control" placeholder="email@dwm.com"
                  value={newEmp.email} onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })} />
              </div>
              <div className="col-md-2">
                <label>Role</label>
                <select className="form-select" value={newEmp.role}
                  onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}>
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="OPERATOR">OPERATOR</option>
                </select>
              </div>
              <div className="col-md-3">
                <label>Department</label>
                <select className="form-select" value={newEmp.dept} onChange={(e) => setNewEmp({ ...newEmp, dept: e.target.value })}>
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-success btn-sm" onClick={addEmployee}>Save</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Table — department grouped */}
        <div className="card" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="table table-bordered mb-0 align-middle">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(deptGroups).map(([dept, emps]) => (
                  <React.Fragment key={dept}>
                    {/* Department header row */}
                    <tr>
                      <td colSpan={7} style={{
                        background: "#f1f5f9",
                        fontWeight: 700,
                        fontSize: 12,
                        color: "#475569",
                        textTransform: "uppercase",
                        letterSpacing: "0.6px",
                        padding: "8px 16px",
                        borderBottom: "2px solid #e2e8f0",
                      }}>
                        🏢 {dept} &nbsp;
                        <span style={{ fontWeight: 500, color: "#94a3b8", textTransform: "none", letterSpacing: 0 }}>
                          ({emps.length} member{emps.length !== 1 ? "s" : ""})
                        </span>
                      </td>
                    </tr>
                    {emps.map((emp) => (
                      <tr key={emp.id}>
                        <td style={{ fontFamily: "monospace", fontSize: 12, color: "#94a3b8" }}>{emp.id}</td>
                        <td style={{ fontWeight: 600, color: "#0f172a" }}>{emp.name}</td>
                        <td style={{ fontSize: 13, color: "#475569" }}>{emp.email}</td>
                        <td>
                          <span className="badge" style={{
                            background: ROLE_COLOR[emp.role]?.bg,
                            color: ROLE_COLOR[emp.role]?.color,
                            fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 700,
                          }}>
                            {emp.role}
                          </span>
                        </td>
                        <td style={{ fontSize: 13 }}>{emp.dept}</td>
                        <td>
                          <span className="badge" style={{
                            background: emp.active ? "#dcfce7" : "#f1f5f9",
                            color: emp.active ? "#16a34a" : "#64748b",
                            fontSize: 11, padding: "4px 10px", borderRadius: 20,
                          }}>
                            {emp.active ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td>
                          {emp.role === "SUPER_ADMIN" ? (
                            <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>
                          ) : (
                            <div className="d-flex gap-2">
                              <button className="btn btn-sm btn-warning"
                                onClick={() => setEditEmp({ ...emp })}>
                                Edit
                              </button>
                              <button
                                className={`btn btn-sm ${emp.active ? "btn-danger" : "btn-success"}`}
                                onClick={() => setConfirmId(emp.id)}>
                                {emp.active ? "Disable" : "Enable"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal */}
        {editEmp && (
          <div className="confirm-overlay">
            <div className="confirm-box">
              <h6>Edit Employee</h6>
              <input className="form-control mb-2" placeholder="Name"
                value={editEmp.name} onChange={(e) => setEditEmp({ ...editEmp, name: e.target.value })} />
              <input className="form-control mb-2" placeholder="Email"
                value={editEmp.email} onChange={(e) => setEditEmp({ ...editEmp, email: e.target.value })} />
              <select className="form-select mb-2" value={editEmp.role}
                onChange={(e) => setEditEmp({ ...editEmp, role: e.target.value })}>
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="OPERATOR">OPERATOR</option>
              </select>
              <input className="form-control mb-2" placeholder="Department"
                value={editEmp.dept} onChange={(e) => setEditEmp({ ...editEmp, dept: e.target.value })} />
              <div className="d-flex gap-2 justify-content-center mt-3">
                <button className="btn btn-secondary btn-sm" onClick={() => setEditEmp(null)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={saveEdit}>Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Disable/Enable */}
        {confirmId && (
          <div className="confirm-overlay">
            <div className="confirm-box">
              <h6>Are you sure?</h6>
              <p>
                You are about to {employees.find((e) => e.id === confirmId)?.active ? "disable" : "enable"} this employee.
              </p>
              <div className="d-flex gap-2 justify-content-center mt-3">
                <button className="btn btn-secondary btn-sm" onClick={() => setConfirmId(null)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={toggleActive}>Confirm</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
