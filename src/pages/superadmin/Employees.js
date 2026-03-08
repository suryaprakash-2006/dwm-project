import React, { useState } from "react";
import "../../styles/theme.css";
import ViewToggle from "../../components/ViewToggle";

function Employees() {
  const [employees, setEmployees] = useState([
    { id: 1, name: "Arjun Kumar", dept: "Engineering", active: true },
    { id: 2, name: "Meera Iyer", dept: "HR", active: false },
    { id: 3, name: "Rahul Sharma", dept: "Finance", active: true },
  ]);

  const [alert, setAlert] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [editAction, setEditAction] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDept, setNewDept] = useState("");

  /* -------------------- CREATE -------------------- */
  const addEmployee = () => {
    if (!newName.trim() || !newDept.trim()) return;

    setEmployees([
      ...employees,
      { id: Date.now(), name: newName, dept: newDept, active: true },
    ]);

    setNewName("");
    setNewDept("");
    setShowAddForm(false);

    setAlert({ type: "success", message: "Employee added successfully." });
    setTimeout(() => setAlert(null), 3000);
  };

  /* -------------------- UPDATE -------------------- */
  const handleEditConfirm = () => {
    if (!editAction) return;

    const { id, name, dept } = editAction;

    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, name, dept } : e))
    );

    setEditAction(null);

    setAlert({ type: "success", message: "Employee updated successfully." });
    setTimeout(() => setAlert(null), 3000);
  };

  /* -------------------- ACTIVATE / DEACTIVATE -------------------- */
  const handleConfirm = () => {
    if (!confirmAction) return;

    const emp = employees.find((e) => e.id === confirmAction.id);

    setEmployees((prev) =>
      prev.map((e) =>
        e.id === confirmAction.id ? { ...e, active: !e.active } : e
      )
    );

    setAlert({
      type: emp.active ? "warning" : "success",
      message: emp.active
        ? `${emp.name} deactivated.`
        : `${emp.name} activated.`,
    });

    setConfirmAction(null);
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
                <th>Name</th>
                <th>Department</th>
                <th>Status</th>
                <th style={{ width: "180px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.name}</td>
                  <td>{emp.dept}</td>
                  <td>
                    {emp.active ? (
                      <span className="badge bg-success">Active</span>
                    ) : (
                      <span className="badge bg-secondary">Inactive</span>
                    )}
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() =>
                          setEditAction({
                            id: emp.id,
                            name: emp.name,
                            dept: emp.dept,
                          })
                        }
                      >
                        Edit
                      </button>

                      <button
                        className={`btn btn-sm ${
                          emp.active ? "btn-danger" : "btn-success"
                        }`}
                        onClick={() =>
                          setConfirmAction({ id: emp.id })
                        }
                      >
                        {emp.active ? "Deactivate" : "Activate"}
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
        {items.map((emp) => (
          <div className="col-lg-4 col-md-6 mb-4" key={emp.id}>
            <div className="card shadow-sm h-100 p-3">
              <h5 className="mb-2">{emp.name}</h5>
              <p className="mb-1">
                <strong>Department:</strong> {emp.dept}
              </p>
              <p className="mb-3">
                <strong>Status:</strong>{" "}
                {emp.active ? (
                  <span className="badge bg-success">Active</span>
                ) : (
                  <span className="badge bg-secondary">Inactive</span>
                )}
              </p>

              <div className="mt-auto d-flex gap-2">
                <button
                  className="btn btn-sm btn-warning"
                  onClick={() =>
                    setEditAction({
                      id: emp.id,
                      name: emp.name,
                      dept: emp.dept,
                    })
                  }
                >
                  Edit
                </button>

                <button
                  className={`btn btn-sm ${
                    emp.active ? "btn-danger" : "btn-success"
                  }`}
                  onClick={() =>
                    setConfirmAction({ id: emp.id })
                  }
                >
                  {emp.active ? "Deactivate" : "Activate"}
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
        <h3 className="mb-3">Employees</h3>

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
            Add Employee
          </button>
        )}

        {showAddForm && (
          <div className="card shadow-sm p-3 mb-4">
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Employee name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Department"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
            />
            <div className="d-flex gap-2">
              <button className="btn btn-success" onClick={addEmployee}>
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
              <h6>Edit Employee</h6>
              <input
                type="text"
                className="form-control mb-2"
                value={editAction.name}
                onChange={(e) =>
                  setEditAction({ ...editAction, name: e.target.value })
                }
              />
              <input
                type="text"
                className="form-control mb-2"
                value={editAction.dept}
                onChange={(e) =>
                  setEditAction({ ...editAction, dept: e.target.value })
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
              <p>
                You are about to{" "}
                {employees.find(
                  (e) => e.id === confirmAction.id
                )?.active
                  ? "deactivate"
                  : "activate"}{" "}
                this employee.
              </p>
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
          items={employees}
          renderList={renderList}
          renderGrid={renderGrid}
        />
      </div>
    </div>
  );
}

export default Employees;