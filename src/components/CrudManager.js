import React, { useState } from "react";
import "../styles/theme.css";
import ViewToggle from "./ViewToggle";

function CrudManager({ title, initialItems, fields }) {
  const [items, setItems] = useState(initialItems);
  const [alert, setAlert] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { id }
  const [editAction, setEditAction] = useState(null); // { id, fieldValues }
  const [showAddForm, setShowAddForm] = useState(false);
  const [newValues, setNewValues] = useState(
    fields.reduce((acc, f) => ({ ...acc, [f.key]: "" }), {})
  );

  // CREATE
  const addItem = () => {
    if (fields.some((f) => !newValues[f.key].trim())) return;
    setItems([
      ...items,
      { id: Date.now(), ...newValues, active: true }
    ]);
    setNewValues(fields.reduce((acc, f) => ({ ...acc, [f.key]: "" }), {}));
    setShowAddForm(false);
    setAlert({ type: "success", message: `${title} added successfully.` });
    setTimeout(() => setAlert(null), 3000);
  };

  // UPDATE
  const handleEditConfirm = () => {
    if (!editAction) return;
    const { id, values } = editAction;
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...values } : item))
    );
    setEditAction(null);
    setAlert({ type: "success", message: `${title} updated successfully.` });
    setTimeout(() => setAlert(null), 3000);
  };

  // DELETE (Activate/Deactivate)
  const handleConfirm = () => {
    if (!confirmAction) return;
    const { id } = confirmAction;
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, active: !item.active } : item))
    );
    const item = items.find((i) => i.id === id);
    setAlert({
      type: item.active ? "warning" : "success",
      message: item.active
        ? `${title} "${item[fields[0].key]}" deactivated.`
        : `${title} "${item[fields[0].key]}" activated.`,
    });
    setConfirmAction(null);
    setTimeout(() => setAlert(null), 3000);
  };

  const renderList = (items) => (
    <div className="card">
      <table className="table table-bordered">
        <thead className="table-light">
          <tr>
            {fields.map((f) => (
              <th key={f.key}>{f.label}</th>
            ))}
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              {fields.map((f) => (
                <td key={f.key}>{item[f.key]}</td>
              ))}
              <td>
                {item.active ? (
                  <span className="badge bg-success">Active</span>
                ) : (
                  <span className="badge bg-secondary">Inactive</span>
                )}
              </td>
              <td>
                <button
                  className="btn btn-sm btn-warning me-2"
                  onClick={() =>
                    setEditAction({ id: item.id, values: { ...item } })
                  }
                >
                  Edit
                </button>
                <button
                  className={`btn btn-sm ${item.active ? "btn-danger" : "btn-success"}`}
                  onClick={() => setConfirmAction({ id: item.id })}
                >
                  {item.active ? "Deactivate" : "Activate"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderGrid = (items) => (
    <div className="row">
      {items.map((item) => (
        <div className="col-md-4 mb-3" key={item.id}>
          <div className="card p-3">
            {fields.map((f) => (
              <p key={f.key}>
                {f.label}: {item[f.key]}
              </p>
            ))}
            <p>
              Status:{" "}
              {item.active ? (
                <span className="badge bg-success">Active</span>
              ) : (
                <span className="badge bg-secondary">Inactive</span>
              )}
            </p>
            <button
              className="btn btn-sm btn-warning me-2"
              onClick={() => setEditAction({ id: item.id, values: { ...item } })}
            >
              Edit
            </button>
            <button
              className={`btn btn-sm ${item.active ? "btn-danger" : "btn-success"}`}
              onClick={() => setConfirmAction({ id: item.id })}
            >
              {item.active ? "Deactivate" : "Activate"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="page">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>{title}</h3>
        <div className="d-flex gap-2">
          {!showAddForm && (
            <button
              className="btn btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              Add {title}
            </button>
          )}
          <ViewToggle items={items} renderList={renderList} renderGrid={renderGrid} />
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <div
          className={`alert ${
            alert.type === "success" ? "alert-success" : "alert-warning"
          }`}
        >
          {alert.message}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="card p-3 mb-3">
          {fields.map((f) => (
            <input
              key={f.key}
              type="text"
              className="form-control mb-2"
              placeholder={f.label}
              value={newValues[f.key]}
              onChange={(e) =>
                setNewValues({ ...newValues, [f.key]: e.target.value })
              }
            />
          ))}
          <div className="d-flex gap-2">
            <button className="btn btn-success" onClick={addItem}>
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

      {/* Edit Box */}
      {editAction && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <h6>Edit {title}</h6>
            {fields.map((f) => (
              <input
                key={f.key}
                type="text"
                className="form-control mb-2"
                value={editAction.values[f.key]}
                onChange={(e) =>
                  setEditAction({
                    ...editAction,
                    values: { ...editAction.values, [f.key]: e.target.value },
                  })
                }
              />
            ))}
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

      {/* Confirmation Box */}
      {confirmAction && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <h6>Are you sure?</h6>
            <p>
              You are about to{" "}
              {items.find((i) => i.id === confirmAction.id)?.active
                ? "deactivate"
                : "activate"}{" "}
              this {title.toLowerCase()}.
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
    </div>
  );
}

export default CrudManager;
