import React, { useState } from "react";
import "../../styles/theme.css";

function EmployeeManagement() {
  const [employees, setEmployees] = useState([
    { id: 1, name: "Arjun Kumar", dept: "Engineering", active: true, pending: false },
    { id: 2, name: "Meera Iyer", dept: "HR", active: false, pending: false },
    { id: 3, name: "Rahul Sharma", dept: "Finance", active: true, pending: false },
  ]);

  /* -------- SEND APPROVAL REQUEST (UI DEMO ONLY) -------- */
  const requestToggle = (id) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === id
          ? { ...emp, pending: true }
          : emp
      )
    );
  };

  return (
    <div className="page">
      <div className="container-fluid">
        <h3 className="mb-3">Employee Management</h3>

        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-bordered align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Toggle</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td>{emp.name}</td>
                    <td>{emp.dept}</td>

                    <td>
                      {emp.pending ? (
                        <span className="text-warning fw-semibold">
                          Pending Approval
                        </span>
                      ) : emp.active ? (
                        <span className="text-success">Active</span>
                      ) : (
                        <span className="text-danger">Inactive</span>
                      )}
                    </td>

                    <td>
                      {!emp.pending ? (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => requestToggle(emp.id)}
                        >
                          {emp.active ? "Deactivate" : "Activate"}
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-secondary"
                          disabled
                        >
                          Request Sent
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info note for demo clarity */}
        <div className="mt-3 text-muted small">
          *Status changes require Super Admin approval.
        </div>
      </div>
    </div>
  );
}

export default EmployeeManagement;