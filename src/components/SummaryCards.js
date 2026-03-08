import React from "react";

function SummaryCards() {
  return (
    <div className="row g-3 mb-4">
      <div className="col-md-3">
        <div className="card shadow-sm">
          <div className="card-body">
            <p className="text-muted mb-1">Total Hours</p>
            <h5>176</h5>
          </div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card shadow-sm">
          <div className="card-body">
            <p className="text-muted mb-1">Avg Hours / Day</p>
            <h5>8</h5>
          </div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card shadow-sm">
          <div className="card-body">
            <p className="text-muted mb-1">Working Days</p>
            <h5>22</h5>
          </div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card shadow-sm">
          <div className="card-body">
            <p className="text-muted mb-1">Top Category</p>
            <h5>General</h5>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SummaryCards;
