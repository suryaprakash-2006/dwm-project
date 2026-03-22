import React from "react";
import "../../styles/theme.css";
import ViewToggle from "../../components/ViewToggle";

const StatusPill = ({ active }) => (
  <div style={{
    display: "inline-flex", alignItems: "center", gap: 7,
    background: active ? "#16a34a" : "#94a3b8",
    borderRadius: 20, padding: "5px 14px",
    minWidth: 90, justifyContent: "center",
  }}>
    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.85)" }} />
    <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>
      {active ? "Active" : "Inactive"}
    </span>
  </div>
);

function Machines({ machines = [], readOnly = false }) {
  const renderList = (items) => (
    <div className="container-fluid">
      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="table table-bordered mb-0 align-middle">
            <thead>
              <tr>
                <th>MACHINE</th>
                <th>DEPARTMENT</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 600, color: "#0f172a" }}>{m.name}</td>
                  <td style={{ color: "#475569" }}>{m.dept}</td>
                  <td><StatusPill active={m.active} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderGrid = (items) => (
    <div className="container-fluid">
      <div className="row">
        {items.map((m) => (
          <div className="col-lg-4 col-md-6 mb-4" key={m.id}>
            <div className="dept-grid-card h-100">
              <h5 style={{ fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{m.name}</h5>
              <p style={{ fontSize: 13, color: "#475569", marginBottom: 12 }}>
                <strong>Department:</strong> {m.dept}
              </p>
              <StatusPill active={m.active} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="container-fluid">
        <div className="d-flex align-items-center mb-4">
          <h3 className="mb-0">Machines</h3>
          {readOnly && <span className="readonly-badge">🔒 View Only</span>}
        </div>
        <ViewToggle items={machines} renderList={renderList} renderGrid={renderGrid} />
      </div>
    </div>
  );
}

export default Machines;
