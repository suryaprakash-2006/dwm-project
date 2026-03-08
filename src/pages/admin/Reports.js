import React from "react";
import "../../styles/theme.css";

function Reports() {
  return (
    <div className="page">
      <h3>Reports (Admin)</h3>
      <div className="row mb-3">
        <div className="col-md-4">
          <label>Department:</label>
          <select className="form-select">
            <option>Engineering</option>
            <option>HR</option>
            <option>Finance</option>
          </select>
        </div>
        <div className="col-md-4">
          <label>Employee:</label>
          <select className="form-select">
            <option>Arjun Kumar</option>
            <option>Meera Iyer</option>
            <option>Rahul Sharma</option>
          </select>
        </div>
        <div className="col-md-4">
          <label>Month:</label>
          <select className="form-select">
            <option>January 2026</option>
            <option>February 2026</option>
            <option>March 2026</option>
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
              <th>Hours</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>01-02-2026</td><td>Arjun Kumar</td><td>Engineering</td><td>8</td><td>P</td></tr>
            <tr><td>02-02-2026</td><td>Meera Iyer</td><td>HR</td><td>7</td><td>P</td></tr>
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
