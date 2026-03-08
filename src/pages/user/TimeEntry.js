import React, { useState } from "react";
import "../../styles/theme.css";

function TimeEntry({ user }) {
  const [regularHours, setRegularHours] = useState(0);
  const [overtimeHours, setOvertimeHours] = useState(0);

  const totalHours = regularHours + overtimeHours;

  /* -------- VALIDATION HANDLERS -------- */
  const handleRegularChange = (e) => {
    const value = Number(e.target.value);
    if (value >= 0 && value <= 8) {
      setRegularHours(value);
    }
  };

  const handleOvertimeChange = (e) => {
    const value = Number(e.target.value);
    if (value >= 0 && value <= 8) {
      setOvertimeHours(value);
    }
  };

  return (
    <div className="page">
      <div className="container-fluid">
        <h3 className="mb-3">Daily Time Entry</h3>

        <div className="row">
          {/* LEFT FORM */}
          <div className="col-md-8">
            <div className="card p-3 mb-4 shadow-sm">

              {/* Email */}
              <div className="mb-3">
                <label className="form-label">Employee Email</label>
                <input
                  type="text"
                  className="form-control"
                  value={user?.email || ""}
                  readOnly
                />
              </div>

              {/* Present Status */}
              <div className="mb-3">
                <label className="form-label">Employee Present Status</label>
                <select className="form-select">
                  <option>P (Present)</option>
                  <option>L (Leave)</option>
                  <option>OD (On Duty)</option>
                </select>
              </div>

              {/* Category */}
              <div className="mb-3">
                <label className="form-label">Category</label>
                <select className="form-select">
                  <option>Task against order</option>
                  <option>Improvements / Development</option>
                  <option>Complaints</option>
                  <option>New enquiry / RFQ</option>
                  <option>LBE</option>
                  <option>Supporting Activities</option>
                  <option>General</option>
                  <option>Travel / OD</option>
                </select>
              </div>

              {/* Sub Category */}
              <div className="mb-3">
                <label className="form-label">
                  Sub-Category (Assigned by Admin)
                </label>
                <select className="form-select">
                  <option>Sub Category 1</option>
                  <option>Sub Category 2</option>
                  <option>Sub Category 3</option>
                </select>
              </div>

              {/* Regular Hours */}
              <div className="mb-3">
                <label className="form-label">
                  Regular Working Hours (8-hour shift)
                </label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  max="8"
                  value={regularHours}
                  onChange={handleRegularChange}
                />
                <small className="text-muted">
                  Maximum allowed: 8 hours
                </small>
              </div>

              {/* Overtime Hours */}
              <div className="mb-3">
                <label className="form-label">Overtime Hours</label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  max="8"
                  value={overtimeHours}
                  onChange={handleOvertimeChange}
                />
                <small className="text-muted">
                  Maximum allowed: 8 hours
                </small>
              </div>

              {/* Submit Button */}
              <button className="btn btn-primary w-100">
                Save / Submit
              </button>
            </div>
          </div>

          {/* RIGHT SUMMARY */}
          <div className="col-md-4">
            <div className="card p-3 shadow-sm">
              <h6 className="mb-3">Daily Summary</h6>

              <ul className="list-group">
                <li className="list-group-item d-flex justify-content-between">
                  Regular Hours <span>{regularHours}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between">
                  Overtime Hours <span>{overtimeHours}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between">
                  Total Hours <span>{totalHours}</span>
                </li>
              </ul>

              <small className="text-muted d-block mt-2">
                * Every shift contains 8 regular hours
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimeEntry;