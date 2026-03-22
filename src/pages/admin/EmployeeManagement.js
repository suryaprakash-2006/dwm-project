import React, { useState } from "react";
import "../../styles/theme.css";

function EmployeeManagement() {
  const [employees, setEmployees] = useState([
    { id: 1, name: "Arjun Kumar",  dept: "Engineering", active: true,  pending: false },
    { id: 2, name: "Meera Iyer",   dept: "HR",          active: false, pending: false },
    { id: 3, name: "Rahul Sharma", dept: "Finance",     active: true,  pending: false },
  ]);

  const requestToggle = (id) => {
    setEmployees((prev) =>
      prev.map((emp) => emp.id === id ? { ...emp, pending: true } : emp)
    );
  };

  return (
    <div className="page">
      <div className="container-fluid">
        <h3 className="mb-4">Employee Management</h3>

        <div className="card" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="table table-bordered align-middle mb-0">
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>DEPARTMENT</th>
                  <th>STATUS</th>
                  <th>TOGGLE</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td style={{ fontWeight: 600, fontSize: 15, color: "#0f172a" }}>{emp.name}</td>
                    <td style={{ fontSize: 15, color: "#334155" }}>{emp.dept}</td>
                    <td>
                      {emp.pending ? (
                        <span style={{ color: "#d97706", fontWeight: 700, fontSize: 15 }}>Pending Approval</span>
                      ) : emp.active ? (
                        <span style={{ color: "#16a34a", fontWeight: 700, fontSize: 15 }}>Active</span>
                      ) : (
                        <span style={{ color: "#dc2626", fontWeight: 700, fontSize: 15 }}>Inactive</span>
                      )}
                    </td>
                    <td>
                      {!emp.pending ? (
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ minWidth: 100, fontWeight: 600 }}
                          onClick={() => requestToggle(emp.id)}
                        >
                          {emp.active ? "Deactivate" : "Activate"}
                        </button>
                      ) : (
                        <button className="btn btn-secondary btn-sm" disabled style={{ minWidth: 100 }}>
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

        <p style={{ marginTop: 14, fontSize: 13, color: "#94a3b8" }}>
          *Status changes require Super Admin approval.
        </p>
      </div>
    </div>
  );
}

export default EmployeeManagement;
