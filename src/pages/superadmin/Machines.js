import React, { useState } from "react";
import "../../styles/theme.css";

function Machines() {

  const [machines, setMachines] = useState([
    { id: 1, name: "CNC Lathe", dept: "Engineering", active: true },
    { id: 2, name: "Hydraulic Press", dept: "Fabrication", active: false }
  ]);

  const [name, setName] = useState("");
  const [dept, setDept] = useState("");

  const addMachine = () => {

    if (!name || !dept) return;

    setMachines([
      ...machines,
      { id: Date.now(), name, dept, active: true }
    ]);

    setName("");
    setDept("");
  };

  const toggleMachine = (id) => {

    setMachines(
      machines.map((m) =>
        m.id === id ? { ...m, active: !m.active } : m
      )
    );
  };

  return (

    <div className="page">

      <h3>Machines</h3>

      <div className="card p-3 mb-3">

        <input
          className="form-control mb-2"
          placeholder="Machine name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="form-control mb-2"
          placeholder="Department"
          value={dept}
          onChange={(e) => setDept(e.target.value)}
        />

        <button className="btn btn-primary" onClick={addMachine}>
          Add Machine
        </button>

      </div>

      <div className="card">

        <table className="table">

          <thead>
            <tr>
              <th>Machine</th>
              <th>Department</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            {machines.map((m) => (

              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.dept}</td>
                <td>{m.active ? "Active" : "Inactive"}</td>

                <td>

                  <button
                    className="btn btn-warning btn-sm"
                    onClick={() => toggleMachine(m.id)}
                  >
                    Toggle
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

}

export default Machines;