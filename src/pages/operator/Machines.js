import React, { useState } from "react";
import "../../styles/theme.css";
import ViewToggle from "../../components/ViewToggle";

// Visible toggle-style status pill
const StatusPill = ({ active }) => (
  <div style={{
    display: "inline-flex", alignItems: "center", gap: 7,
    background: active ? "#16a34a" : "#94a3b8",
    borderRadius: 20, padding: "5px 14px",
    minWidth: 90, justifyContent: "center",
  }}>
    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.85)" }} />
    <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: "0.2px" }}>
      {active ? "Active" : "Inactive"}
    </span>
  </div>
);

function OperatorMachines({ machines, setMachines }) {
  const [alert, setAlert]             = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [editAction, setEditAction]   = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName]         = useState("");
  const [newDept, setNewDept]         = useState("");

  const showMsg = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const addMachine = () => {
    if (!newName.trim() || !newDept.trim()) return;
    setMachines((prev) => [...prev, { id: Date.now(), name: newName, dept: newDept, active: true }]);
    setNewName(""); setNewDept(""); setShowAddForm(false);
    showMsg("success", "Machine added successfully.");
  };

  const handleEditConfirm = () => {
    if (!editAction) return;
    setMachines((prev) => prev.map((m) => m.id === editAction.id ? { ...m, name: editAction.name, dept: editAction.dept } : m));
    setEditAction(null);
    showMsg("success", "Machine updated.");
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    const machine = machines.find((m) => m.id === confirmAction.id);
    setMachines((prev) => prev.map((m) => m.id === confirmAction.id ? { ...m, active: !m.active } : m));
    showMsg(machine.active ? "warning" : "success", `${machine.name} ${machine.active ? "deactivated" : "activated"}.`);
    setConfirmAction(null);
  };

  const renderList = (items) => (
    <div className="container-fluid">
      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="table table-bordered mb-0 align-middle">
            <thead>
              <tr>
                <th>MACHINE</th>
                <th>DEPARTMENT</th>
                <th>STATUS</th>
                <th style={{ width: 210 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 600, color: "#0f172a" }}>{m.name}</td>
                  <td style={{ color: "#475569" }}>{m.dept}</td>
                  <td><StatusPill active={m.active} /></td>
                  <td>
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-warning"
                        onClick={() => setEditAction({ id: m.id, name: m.name, dept: m.dept })}>
                        Edit
                      </button>
                      <button
                        className={`btn btn-sm ${m.active ? "btn-danger" : "btn-success"}`}
                        onClick={() => setConfirmAction({ id: m.id })}>
                        {m.active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderGrid = (items) => (
    <div className="container-fluid">
      <div className="row">
        {items.map((m) => (
          <div className="col-lg-4 col-md-6 mb-4" key={m.id}>
            <div className="dept-grid-card h-100">
              <h5 style={{ fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{m.name}</h5>
              <p style={{ fontSize: 13, color: "#475569", marginBottom: 12 }}><strong>Department:</strong> {m.dept}</p>
              <div style={{ marginBottom: 16 }}><StatusPill active={m.active} /></div>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-warning"
                  onClick={() => setEditAction({ id: m.id, name: m.name, dept: m.dept })}>Edit</button>
                <button className={`btn btn-sm ${m.active ? "btn-danger" : "btn-success"}`}
                  onClick={() => setConfirmAction({ id: m.id })}>
                  {m.active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="container-fluid">
        <div className="d-flex align-items-center mb-3">
          <h3 className="mb-0">Machines</h3>
          <span className="readonly-badge" style={{ background: "#dcfce7", color: "#16a34a", borderColor: "#bbf7d0" }}>
            ✏️ Operator Access
          </span>
        </div>

        {alert && (
          <div className={`alert alert-${alert.type === "success" ? "success" : "warning"}`}>
            {alert.message}
          </div>
        )}

        {!showAddForm && (
          <button className="btn btn-primary mb-3" onClick={() => setShowAddForm(true)}>+ Add Machine</button>
        )}

        {showAddForm && (
          <div className="card p-3 mb-4">
            <div className="row g-2">
              <div className="col-md-5">
                <label>Machine Name</label>
                <input type="text" className="form-control" placeholder="e.g. CNC Lathe"
                  value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div className="col-md-5">
                <label>Department</label>
                <input type="text" className="form-control" placeholder="e.g. Engineering"
                  value={newDept} onChange={(e) => setNewDept(e.target.value)} />
              </div>
            </div>
            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-success btn-sm" onClick={addMachine}>Save</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editAction && (
          <div className="confirm-overlay">
            <div className="confirm-box">
              <h6>Edit Machine</h6>
              <input type="text" className="form-control mb-2" placeholder="Machine name"
                value={editAction.name} onChange={(e) => setEditAction({ ...editAction, name: e.target.value })} />
              <input type="text" className="form-control mb-2" placeholder="Department"
                value={editAction.dept} onChange={(e) => setEditAction({ ...editAction, dept: e.target.value })} />
              <div className="d-flex gap-2 justify-content-center mt-3">
                <button className="btn btn-secondary btn-sm" onClick={() => setEditAction(null)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleEditConfirm}>Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Modal */}
        {confirmAction && (
          <div className="confirm-overlay">
            <div className="confirm-box">
              <h6>Are you sure?</h6>
              <p>You are about to {machines.find((m) => m.id === confirmAction.id)?.active ? "deactivate" : "activate"} this machine.</p>
              <div className="d-flex gap-2 justify-content-center mt-3">
                <button className="btn btn-secondary btn-sm" onClick={() => setConfirmAction(null)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleConfirm}>Confirm</button>
              </div>
            </div>
          </div>
        )}

        <ViewToggle items={machines} renderList={renderList} renderGrid={renderGrid} />
      </div>
    </div>
  );
}

export default OperatorMachines;
