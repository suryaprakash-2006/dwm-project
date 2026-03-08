import React, { useState } from "react";
import "../../styles/theme.css";

function TimeEntry({ user }) {

  const machines = [
    "CNC Lathe",
    "Hydraulic Press",
    "PLC Panel"
  ];

  const [machine, setMachine] = useState("");
  const [category, setCategory] = useState("");
  const [hours, setHours] = useState("");
  const [overtime, setOvertime] = useState("");

  const handleSubmit = (e) => {

    e.preventDefault();

    const entry = {
      email: user.email,
      machine,
      category,
      hours,
      overtime,
      date: new Date().toLocaleDateString()
    };

    console.log("Saved Entry:", entry);

    alert("Time entry submitted");

    setMachine("");
    setCategory("");
    setHours("");
    setOvertime("");
  };

  return (

    <div className="page">

      <h3>Daily Time Entry</h3>

      <div className="card p-4">

        <form onSubmit={handleSubmit}>

          <label>Employee Email</label>

          <input
            className="form-control mb-3"
            value={user.email}
            readOnly
          />

          <label>Machine Worked On</label>

          <select
            className="form-control mb-3"
            value={machine}
            onChange={(e) => setMachine(e.target.value)}
            required
          >

            <option value="">Select Machine</option>

            {machines.map((m, i) => (
              <option key={i}>{m}</option>
            ))}

          </select>

          <label>Task Category</label>

          <select
            className="form-control mb-3"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >

            <option value="">Select Task</option>
            <option>Machine Work</option>
            <option>Maintenance</option>
            <option>Inspection</option>
            <option>Reporting</option>

          </select>

          <label>Regular Working Hours</label>

          <input
            type="number"
            className="form-control mb-3"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="Enter hours"
          />

          <label>Overtime Hours</label>

          <input
            type="number"
            className="form-control mb-3"
            value={overtime}
            onChange={(e) => setOvertime(e.target.value)}
            placeholder="Enter overtime"
          />

          <button className="btn btn-primary w-100">
            Submit Entry
          </button>

        </form>

      </div>

    </div>

  );

}

export default TimeEntry;