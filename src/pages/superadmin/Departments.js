import React, { useState } from "react";
import "../../styles/theme.css";

const INITIAL_DEPARTMENTS = [
  { id: 1, name: "Engineering", headCount: 4, description: "Product design & development" },
  { id: 2, name: "HR",          headCount: 3, description: "Human resources & payroll"   },
  { id: 3, name: "Finance",     headCount: 2, description: "Accounts & financial ops"    },
  { id: 4, name: "QA",          headCount: 1, description: "Quality assurance"           },
];

const DEPT_ICONS = ["🔧", "👥", "💼", "✅", "⚙️", "📊", "🏭"];

export default function Departments() {
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS);
  const [alert, setAlert]             = useState(null);
  const [showAdd, setShowAdd]         = useState(false);
  const [editDept, setEditDept]       = useState(null);
  const [confirmId, setConfirmId]     = useState(null);
  const [newDept, setNewDept]         = useState({ name: "", description: "" });
  const [activeTab, setActiveTab]     = useState("grid"); // grid | list

  const showMsg = (type, msg) => {
    setAlert({ type, message: msg });
    setTimeout(() => setAlert(null), 3000);
  };

  const addDept = () => {
    if (!newDept.name.trim()) return;
    setDepartments((prev) => [...prev, { id: Date.now(), name: newDept.name, description: newDept.description, headCount: 0 }]);
    setNewDept({ name: "", description: "" });
    setShowAdd(false);
    showMsg("success", "Department added successfully.");
  };

  const saveEdit = () => {
    setDepartments((prev) => prev.map((d) => d.id === editDept.id ? { ...d, ...editDept } : d));
    setEditDept(null);
    showMsg("success", "Department updated.");
  };

  const deleteDept = () => {
    const dept = departments.find((d) => d.id === confirmId);
    setDepartments((prev) => prev.filter((d) => d.id !== confirmId));
    setConfirmId(null);
    showMsg("warning", `${dept.name} department deleted.`);
  };

  return (
    <div className="page">
      <div className="container-fluid">
        {/* Page header */}
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="mb-0">Departments</h3>
            <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
              {departments.length} departments &nbsp;·&nbsp; {departments.reduce((a, d) => a + d.headCount, 0)} total employees
            </p>
          </div>
          <div className="d-flex gap-2 align-items-center">
            {/* View toggle */}
            <div className="d-flex" style={{ border: "1px solid #e2e8f0", borderRadius: 6, overflow: "hidden" }}>
              <button
                onClick={() => setActiveTab("grid")}
                style={{
                  padding: "6px 14px", fontSize: 12.5, fontWeight: 600, border: "none", cursor: "pointer",
                  background: activeTab === "grid" ? "#2563eb" : "#fff",
                  color: activeTab === "grid" ? "#fff" : "#64748b",
                  transition: "all 0.15s",
                }}>
                🗂 Grid
              </button>
              <button
                onClick={() => setActiveTab("list")}
                style={{
                  padding: "6px 14px", fontSize: 12.5, fontWeight: 600, border: "none", cursor: "pointer",
                  background: activeTab === "list" ? "#2563eb" : "#fff",
                  color: activeTab === "list" ? "#fff" : "#64748b",
                  transition: "all 0.15s",
                }}>
                📋 List
              </button>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
              + Add Department
            </button>
          </div>
        </div>

        {alert && (
          <div className={`alert alert-${alert.type === "success" ? "success" : "warning"}`}>
            {alert.message}
          </div>
        )}

        {/* Add Form */}
        {showAdd && (
          <div className="card mb-4" style={{ padding: 20 }}>
            <h6 style={{ fontWeight: 700, marginBottom: 14 }}>New Department</h6>
            <div className="row g-2">
              <div className="col-md-4">
                <label>Department Name</label>
                <input className="form-control" placeholder="e.g. Machining Division"
                  value={newDept.name} onChange={(e) => setNewDept({ ...newDept, name: e.target.value })} />
              </div>
              <div className="col-md-6">
                <label>Description (optional)</label>
                <input className="form-control" placeholder="Short description"
                  value={newDept.description} onChange={(e) => setNewDept({ ...newDept, description: e.target.value })} />
              </div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-success btn-sm" onClick={addDept}>Save</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* GRID VIEW */}
        {activeTab === "grid" && (
          <div className="row g-3">
            {departments.map((dept, idx) => (
              <div className="col-lg-3 col-md-4 col-sm-6" key={dept.id}>
                <div style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "22px 20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.2s",
                  cursor: "default",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(37,99,235,0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; }}
                >
                  {/* top accent bar */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #2563eb, #60a5fa)" }} />

                  <div style={{ fontSize: 26, marginBottom: 10 }}>{DEPT_ICONS[idx % DEPT_ICONS.length]}</div>
                  <h5 style={{ fontWeight: 700, color: "#0f172a", fontSize: 15, marginBottom: 4 }}>{dept.name}</h5>
                  {dept.description && (
                    <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12, lineHeight: 1.4 }}>{dept.description}</p>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                    <span style={{
                      background: "#dbeafe", color: "#2563eb",
                      fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                    }}>
                      👤 {dept.headCount} members
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-sm btn-warning" style={{ flex: 1, fontSize: 12 }}
                      onClick={() => setEditDept({ ...dept })}>
                      Edit
                    </button>
                    <button className="btn btn-sm btn-danger" style={{ flex: 1, fontSize: 12 }}
                      onClick={() => setConfirmId(dept.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LIST VIEW */}
        {activeTab === "list" && (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="table table-bordered mb-0 align-middle">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Department</th>
                    <th>Description</th>
                    <th>Members</th>
                    <th style={{ width: 160 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept, idx) => (
                    <tr key={dept.id}>
                      <td style={{ color: "#94a3b8", fontSize: 13 }}>{idx + 1}</td>
                      <td>
                        <span style={{ fontSize: 16, marginRight: 8 }}>{DEPT_ICONS[idx % DEPT_ICONS.length]}</span>
                        <strong>{dept.name}</strong>
                      </td>
                      <td style={{ fontSize: 13, color: "#64748b" }}>{dept.description || "—"}</td>
                      <td>
                        <span style={{
                          background: "#dbeafe", color: "#2563eb",
                          fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                        }}>
                          {dept.headCount} members
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button className="btn btn-sm btn-warning" onClick={() => setEditDept({ ...dept })}>Edit</button>
                          <button className="btn btn-sm btn-danger" onClick={() => setConfirmId(dept.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editDept && (
          <div className="confirm-overlay">
            <div className="confirm-box">
              <h6>Edit Department</h6>
              <input className="form-control mb-2" placeholder="Department name"
                value={editDept.name} onChange={(e) => setEditDept({ ...editDept, name: e.target.value })} />
              <input className="form-control mb-2" placeholder="Description"
                value={editDept.description || ""} onChange={(e) => setEditDept({ ...editDept, description: e.target.value })} />
              <div className="d-flex gap-2 justify-content-center mt-3">
                <button className="btn btn-secondary btn-sm" onClick={() => setEditDept(null)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={saveEdit}>Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm */}
        {confirmId && (
          <div className="confirm-overlay">
            <div className="confirm-box">
              <h6>Delete Department?</h6>
              <p>This action cannot be undone.</p>
              <div className="d-flex gap-2 justify-content-center mt-3">
                <button className="btn btn-secondary btn-sm" onClick={() => setConfirmId(null)}>Cancel</button>
                <button className="btn btn-danger btn-sm" onClick={deleteDept}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
