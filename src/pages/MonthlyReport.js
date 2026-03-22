import React from "react";

function MonthlyReport() {
  return (
    <div className="page">
      <h3>Monthly Report</h3>

      <div className="filter-row mb-3">
        <label className="me-2">Select Month:</label>
        <select>
          <option>August 2025</option>
          <option>September 2025</option>
          <option>October 2025</option>
          <option>November 2025</option>
          <option>December 2025</option>
          <option>January 2026</option>
          <option>February 2026</option>
        </select>
      </div>

      <p>Download the monthly performance report for the selected month.</p>

      <button className="btn btn-primary">Download Report</button>
    </div>
  );
}

export default MonthlyReport;
