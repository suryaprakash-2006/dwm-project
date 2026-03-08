import React, { useState } from "react";
import "../../styles/theme.css";

function Reports() {

  const financialYears = [
    "2023-2024",
    "2024-2025",
    "2025-2026"
  ];

  const months = [
    "March","April","May","June",
    "July","August","September",
    "October","November","December",
    "January","February"
  ];

  const [year, setYear] = useState("2025-2026");
  const [month, setMonth] = useState("March");

  const entries = [
    { date: "01-03-2026", employee: "Arjun", hours: 8 },
    { date: "02-03-2026", employee: "Arjun", hours: 9 },
    { date: "03-03-2026", employee: "Arjun", hours: 7 },
    { date: "04-03-2026", employee: "Arjun", hours: 10 }
  ];

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

  const overtimeHours = entries
    .filter(e => e.hours > 8)
    .reduce((sum, e) => sum + (e.hours - 8), 0);

  return (

    <div className="page">

      <h3>Monthly Reports</h3>

      <div className="row mb-3">

        <div className="col-md-3">

          <label>Financial Year</label>

          <select
            className="form-select"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >

            {financialYears.map((y,i) => (
              <option key={i}>{y}</option>
            ))}

          </select>

        </div>

        <div className="col-md-3">

          <label>Month</label>

          <select
            className="form-select"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >

            {months.map((m,i) => (
              <option key={i}>{m}</option>
            ))}

          </select>

        </div>

      </div>

      <div className="row mb-4">

        <div className="col-md-3">
          <div className="card p-3">
            <p>Total Hours</p>
            <h4>{totalHours}</h4>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card p-3">
            <p>Overtime Hours</p>
            <h4>{overtimeHours}</h4>
          </div>
        </div>

      </div>

      <div className="card">

        <table className="table table-bordered">

          <thead>
            <tr>
              <th>Date</th>
              <th>Employee</th>
              <th>Hours</th>
            </tr>
          </thead>

          <tbody>

            {entries.map((e,i) => (

              <tr key={i}>
                <td>{e.date}</td>
                <td>{e.employee}</td>
                <td>{e.hours}</td>
              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default Reports;