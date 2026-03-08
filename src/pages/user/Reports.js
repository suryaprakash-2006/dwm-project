import React from "react";
import "../../styles/theme.css";

function Reports() {
  return (
    <div className="page">
      <h3>Monthly Reports</h3>
      <div className="mb-3">
        <label>Select Month:</label>
        <select className="form-select w-auto d-inline-block ms-2">
          <option>January 2026</option>
          <option>February 2026</option>
          <option>March 2026</option>
        </select>
      </div>

      <div className="card mb-3">
        <table className="table table-bordered">
          <thead className="table-light">
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Hours</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>01-02-2026</td>
              <td>General</td>
              <td>8</td>
              <td>P</td>
            </tr>
            <tr>
              <td>02-02-2026</td>
              <td>Supporting Activities</td>
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
