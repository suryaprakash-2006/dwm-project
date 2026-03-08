import React, { useState } from "react";
import "../../styles/theme.css";
import ViewToggle from "../../components/ViewToggle";

function Departments() {
  const [departments, setDepartments] = useState([
    { id: 1, name: "Engineering" },
    { id: 2, name: "HR" },
    { id: 3, name: "Finance" },
  ]);

  const [alert, setAlert] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [editAction, setEditAction] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDept, setNewDept] = useState("");

  /* -------------------- CREATE -------------------- */
  const addDepartment = () => {
    if (!newDept.trim()) return;

    setDepartments([
      ...departments,
      { id: Date.now(), name: newDept },
    ]);

    setNewDept("");
    setShowAddForm(false);

    setAlert({ type: "success", message: "Department added successfully." });
    setTimeout(() => setAlert(null), 3000);
  };

  /* -------------------- UPDATE -------------------- */
  const handleEditConfirm = () => {
    if (!editAction) return;

    const { id, name } = editAction;

    setDepartments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, name } : d))
    );

    setEditAction(null);

    setAlert({ type: "success", message: "Department updated successfully." });
    setTimeout(() => setAlert(null), 3000);
  };

  /* -------------------- DELETE -------------------- */
  const handleConfirm = () => {
    if (!confirmAction) return;

    const dept = departments.find((d) => d.id === confirmAction.id);

    setDepartments((prev) =>
      prev.filter((d) => d.id !== confirmAction.id)
    );

    setConfirmAction(null);

    setAlert({
      type: "warning",
      message: `${dept.name} department deleted.`,
    });

    setTimeout(() => setAlert(null), 3000);
  };

  /* -------------------- LIST VIEW -------------------- */
  const renderList = (items) => (
    <div className="container-fluid">
      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-bordered mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Department</th>
                <th style={{ width: "180px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((dept) => (
                <tr key={dept.id}>
                  <td>{dept.name}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() =>
                          setEditAction({
                            id: dept.id,
                            name: dept.name,
                          })
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() =>
                          setConfirmAction({ id: dept.id })
                        }
                      >
                        Delete
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

  /* -------------------- GRID VIEW -------------------- */
  const renderGrid = (items) => (
    <div className="container-fluid">
      <div className="row">
        {items.map((dept) => (
          <div className="col-lg-4 col-md-6 mb-4" key={dept.id}>
            <div className="card shadow-sm h-100 p-3">
              <h5 className="mb-2">{dept.name}</h5>

              <div className="mt-auto d-flex gap-2">
                <button
                  className="btn btn-sm btn-warning"
                  onClick={() =>
                    setEditAction({
                      id: dept.id,
                      name: dept.name,
                    })
                  }
                >
                  Edit
                </button>

                <button
                  className="btn btn-sm btn-danger"
                  onClick={() =>
                    setConfirmAction({ id: dept.id })
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* -------------------- MAIN RETURN -------------------- */
  return (
    <div className="page">
      <div className="container-fluid">
        <h3 className="mb-3">Departments</h3>

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
            Add Department
          </button>
        )}

        {showAddForm && (
          <div className="card shadow-sm p-3 mb-4">
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Department name"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
            />
            <div className="d-flex gap-2">
              <button className="btn btn-success" onClick={addDepartment}>
                Save
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowAddForm(false)}
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
              <h6>Edit Department</h6>
              <input
                type="text"
                className="form-control mb-2"
                value={editAction.name}
                onChange={(e) =>
                  setEditAction({ ...editAction, name: e.target.value })
                }
              />
              <div className="d-flex gap-2 justify-content-center mt-3">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setEditAction(null)}
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
              <p>You are about to delete this department.</p>
              <div className="d-flex gap-2 justify-content-center mt-3">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setConfirmAction(null)}
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
          items={departments}
          renderList={renderList}
          renderGrid={renderGrid}
        />
      </div>
    </div>
  );
}

export default Departments;