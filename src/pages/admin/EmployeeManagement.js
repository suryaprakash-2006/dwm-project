import React, { useState } from "react";
import "../../styles/theme.css";
import { ROLES } from "../../roles";

function EmployeeManagement({ user }) {

  const departments = ["Engineering", "HR", "Finance"];

  const [selectedDept, setSelectedDept] = useState(
    user.role === ROLES.ADMIN ? user.department : "Engineering"
  );

  const [employees] = useState([
    { id: 1, name: "Arjun Kumar", dept: "Engineering", active: true },
    { id: 2, name: "Meera Iyer", dept: "HR", active: false },
    { id: 3, name: "Rahul Sharma", dept: "Finance", active: true }
  ]);

  const filteredEmployees =
    user.role === ROLES.ADMIN
      ? employees.filter(e => e.dept === user.department)
      : employees.filter(e => e.dept === selectedDept);

  return (

    <div className="page">

      <h3>Employee Management</h3>

      {user.role === ROLES.SUPER_ADMIN && (

        <div className="mb-3">

          <label>Select Department</label>

          <select
            className="form-select"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >

            {departments.map((d, i) => (
              <option key={i}>{d}</option>
            ))}

          </select>

        </div>

      )}

      <div className="card">

        <table className="table table-bordered">

          <thead>
            <tr>
              <th>Name</th>
              <th>Department</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>

            {filteredEmployees.map(emp => (

              <tr key={emp.id}>
                <td>{emp.name}</td>
                <td>{emp.dept}</td>
                <td>{emp.active ? "Active" : "Inactive"}</td>
              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default EmployeeManagement;