import React from "react";
import "../../styles/theme.css";

function Reports() {
  return (
    <div className="page">
      <h3>Reports </h3>
      <div className="row mb-3">
        <div className="col-md-3">
          <label>Department:</label>
          <select className="form-select">
            <option>Engineering</option>
            <option>HR</option>
            <option>Finance</option>
          </select>
        </div>
        <div className="col-md-3">
          <label>Employee:</label>
          <select className="form-select">
            <option>Arjun</option>
            <option>Meera</option>
            <option>Rahul</option>
          </select>
        </div>
        <div className="col-md-3">
          <label>Date Range:</label>
          <input type="date" className="form-control mb-2" />
          <input type="date" className="form-control" />
        </div>
        <div className="col-md-3">
          <label>Machine:</label>
          <select className="form-select">
            <option>CNC Lathe</option>
            <option>Hydraulic Press</option>
            <option>PLC Panel</option>
          </select>
        </div>
      </div>

      <div className="card mb-3">
        <table className="table table-bordered">
          <thead className="table-light">
            <tr>
              <th>Date</th>
              <th>Employee</th>
              <th>Department</th>
              <th>Machine</th>
              <th>Hours</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>01-02-2026</td>
              <td>Arjun</td>
              <td>Engineering</td>
              <td>CNC Lathe</td>
              <td>8</td>
              <td>P</td>
            </tr>
            <tr>
              <td>02-02-2026</td>
              <td>Meera</td>
              <td>HR</td>
              <td>Hydraulic Press</td>
              <td>7</td>
              <td>P</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="d-flex gap-2">
        <button className="btn btn-outline-primary">Export JSON</button>
        <button className="btn btn-outline-primary">Export PDF</button>
        <button className="btn btn-outline-primary">Export Excel</button>
      </div>
    </div>
  );
}

export default Reports;
