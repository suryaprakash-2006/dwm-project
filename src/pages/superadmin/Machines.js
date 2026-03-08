import React, { useState } from "react";
import "../../styles/theme.css";
import ViewToggle from "../../components/ViewToggle";

function Machines() {
  const [machines, setMachines] = useState([
    { id: 1, name: "CNC Lathe", dept: "Engineering", active: true },
    { id: 2, name: "Hydraulic Press", dept: "Fabrication", active: false },
    { id: 3, name: "PLC Panel", dept: "Automation", active: true },
  ]);

  const [alert, setAlert] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [editAction, setEditAction] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDept, setNewDept] = useState("");

  /* ---------------- CREATE ---------------- */
  const addMachine = () => {
    if (!newName.trim() || !newDept.trim()) return;

    setMachines([
      ...machines,
      { id: Date.now(), name: newName, dept: newDept, active: true },
    ]);

    setNewName("");
    setNewDept("");
    setShowAddForm(false);

    setAlert({ type: "success", message: "Machine added successfully." });
    setTimeout(() => setAlert(null), 3000);
  };

  /* ---------------- UPDATE ---------------- */
  const handleEditConfirm = () => {
    if (!editAction) return;

    const { id, name, dept } = editAction;

    setMachines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, name, dept } : m))
    );

    setEditAction(null);

    setAlert({ type: "success", message: "Machine updated successfully." });
    setTimeout(() => setAlert(null), 3000);
  };

  /* ---------------- ACTIVATE / DEACTIVATE ---------------- */
  const handleConfirm = () => {
    if (!confirmAction) return;

    const machine = machines.find(
      (m) => m.id === confirmAction.id
    );

    setMachines((prev) =>
      prev.map((m) =>
        m.id === confirmAction.id
          ? { ...m, active: !m.active }
          : m
      )
    );

    setAlert({
      type: machine.active ? "warning" : "success",
      message: machine.active
        ? `${machine.name} deactivated.`
        : `${machine.name} activated.`,
    });

    setConfirmAction(null);
    setTimeout(() => setAlert(null), 3000);
  };

  /* ---------------- LIST VIEW ---------------- */
  const renderList = (items) => (
    <div className="container-fluid">
      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-bordered mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Machine</th>
                <th>Department</th>
                <th>Status</th>
                <th style={{ width: "180px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{m.dept}</td>
                  <td>
                    {m.active ? (
                      <span className="badge bg-success">
                        Active
                      </span>
                    ) : (
                      <span className="badge bg-secondary">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() =>
                          setEditAction({
                            id: m.id,
                            name: m.name,
                            dept: m.dept,
                          })
                        }
                      >
                        Edit
                      </button>

                      <button
                        className={`btn btn-sm ${
                          m.active
                            ? "btn-danger"
                            : "btn-success"
                        }`}
                        onClick={() =>
                          setConfirmAction({ id: m.id })
                        }
                      >
                        {m.active
                          ? "Deactivate"
                          : "Activate"}
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

  /* ---------------- GRID VIEW ---------------- */
  const renderGrid = (items) => (
    <div className="container-fluid">
      <div className="row">
        {items.map((m) => (
          <div
            className="col-lg-4 col-md-6 mb-4"
            key={m.id}
          >
            <div className="card shadow-sm h-100 p-3">
              <h5 className="mb-2">{m.name}</h5>

              <p className="mb-1">
                <strong>Department:</strong> {m.dept}
              </p>

              <p className="mb-3">
                <strong>Status:</strong>{" "}
                {m.active ? (
                  <span className="badge bg-success">
                    Active
                  </span>
                ) : (
                  <span className="badge bg-secondary">
                    Inactive
                  </span>
                )}
              </p>

              <div className="mt-auto d-flex gap-2">
                <button
                  className="btn btn-sm btn-warning"
                  onClick={() =>
                    setEditAction({
                      id: m.id,
                      name: m.name,
                      dept: m.dept,
                    })
                  }
                >
                  Edit
                </button>

                <button
                  className={`btn btn-sm ${
                    m.active
                      ? "btn-danger"
                      : "btn-success"
                  }`}
                  onClick={() =>
                    setConfirmAction({ id: m.id })
                  }
                >
                  {m.active
                    ? "Deactivate"
                    : "Activate"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ---------------- MAIN RETURN ---------------- */
  return (
    <div className="page">
      <div className="container-fluid">
        <h3 className="mb-3">Machines</h3>

        {alert && (
          <div
            className={`alert ${
              alert.type === "success"
                ? "alert-success"
                : "alert-warning"
            }`}
          >
            {alert.message}
          </div>
        )}

        {!showAddForm && (
          <button
            className="btn btn-primary mb-3"
            onClick={() => setShowAddForm(true)}
          >
            Add Machine
          </button>
        )}

        {showAddForm && (
          <div className="card shadow-sm p-3 mb-4">
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Machine name"
              value={newName}
              onChange={(e) =>
                setNewName(e.target.value)
              }
            />
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Department"
              value={newDept}
              onChange={(e) =>
                setNewDept(e.target.value)
              }
            />
            <div className="d-flex gap-2">
              <button
                className="btn btn-success"
                onClick={addMachine}
              >
                Save
              </button>
              <button
                className="btn btn-secondary"
                onClick={() =>
                  setShowAddForm(false)
                }
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editAction && (
          <div className="confirm-overlay">
            <div className="confirm-box">
              <h6>Edit Machine</h6>
              <input
                type="text"
                className="form-control mb-2"
                value={editAction.name}
                onChange={(e) =>
                  setEditAction({
                    ...editAction,
                    name: e.target.value,
                  })
                }
              />
              <input
                type="text"
                className="form-control mb-2"
                value={editAction.dept}
                onChange={(e) =>
                  setEditAction({
                    ...editAction,
                    dept: e.target.value,
                  })
                }
              />
              <div className="d-flex gap-2 justify-content-center mt-3">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() =>
                    setEditAction(null)
                  }
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleEditConfirm}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Modal */}
        {confirmAction && (
          <div className="confirm-overlay">
            <div className="confirm-box">
              <h6>Are you sure?</h6>
              <p>
                You are about to{" "}
                {machines.find(
                  (m) =>
                    m.id === confirmAction.id
                )?.active
                  ? "deactivate"
                  : "activate"}{" "}
                this machine.
              </p>
              <div className="d-flex gap-2 justify-content-center mt-3">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() =>
                    setConfirmAction(null)
                  }
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleConfirm}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        <ViewToggle
          items={machines}
          renderList={renderList}
          renderGrid={renderGrid}
        />
      </div>
    </div>
  );
}

export default Machines;