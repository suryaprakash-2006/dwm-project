import React from "react";

function EntriesTable() {
  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <h6 className="card-title mb-3">Detailed Entries</h6>
        <table className="table table-bordered table-striped">
          <thead className="table-light">
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Sub-Category</th>
              <th>Hours</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>01-01-2026</td>
              <td>General</td>
              <td>Documentation</td>
              <td>8</td>
              <td>P</td>
            </tr>
            <tr>
              <td>02-01-2026</td>
              <td>Supporting Activities</td>
              <td>Testing</td>
              <td>8</td>
              <td>P</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EntriesTable;
