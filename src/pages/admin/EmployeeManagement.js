import React, { useState } from "react";
import "../../styles/theme.css";

// Simulated late entry approval requests (entries > 3 days old needing admin approval)
const INITIAL_REQUESTS = [
  { id: 1, employee: "Arjun Kumar", dept: "Engineering", date: "2026-03-10", category: "General",            hours: 8, submittedAt: "2026-03-18", status: "Pending" },
  { id: 2, employee: "Rahul Sharma", dept: "Finance",    date: "2026-03-08", category: "Task against order", hours: 6, submittedAt: "2026-03-17", status: "Pending" },
];

function daysSinceSubmit(submittedAt) {
  const d = new Date(submittedAt);
  const today = new Date();
  today.setHours(0,0,0,0);
  return Math.floor((today - d) / (1000*60*60*24));
}

const StatusBadge = ({ status }) => {
  const map = { Pending: { bg: "#fef3c7", color: "#d97706" }, Approved: { bg: "#dcfce7", color: "#16a34a" }, Rejected: { bg: "#fee2e2", color: "#dc2626" } };
  const s = map[status] || map.Pending;
  return (
    <span style={{ display: "inline-block", background: s.bg, color: s.color, fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>
      {status}
    </span>
  );
};

function EmployeeManagement() {
  const [employees, setEmployees] = useState([
    { id: 1, name: "Arjun Kumar",  dept: "Engineering", active: true,  pending: false },
    { id: 2, name: "Meera Iyer",   dept: "HR",          active: false, pending: false },
    { id: 3, name: "Rahul Sharma", dept: "Finance",     active: true,  pending: false },
  ]);
  const [lateRequests, setLateRequests] = useState(INITIAL_REQUESTS);
  const [alert, setAlert]   = useState(null);
  const [activeTab, setActiveTab] = useState("employees"); // employees | approvals

  const showMsg = (type, msg) => { setAlert({ type, msg }); setTimeout(() => setAlert(null), 3000); };

  const requestToggle = (id) => {
    setEmployees((prev) => prev.map((e) => e.id === id ? { ...e, pending: true } : e));
  };

  const approveRequest = (id) => {
    setLateRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "Approved" } : r));
    showMsg("success", "Entry approved — data will be stored.");
  };

  const rejectRequest = (id) => {
    setLateRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "Rejected" } : r));
    showMsg("warning", "Entry rejected.");
  };

  const pendingCount = lateRequests.filter((r) => r.status === "Pending").length;

  return (
    <div className="page">
      <div className="container-fluid">
        <h3 className="mb-1">Employee Management</h3>

        {alert && (
          <div className={`alert alert-${alert.type === "success" ? "success" : "warning"}`}>{alert.msg}</div>
        )}

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "2px solid #e2e8f0" }}>
          {[
            { key: "employees", label: "Employees" },
            { key: "approvals", label: `Late Entry Approvals${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: "10px 20px", fontSize: 13.5, fontWeight: 600, border: "none", background: "transparent", cursor: "pointer",
              color: activeTab === tab.key ? "#2563eb" : "#64748b",
              borderBottom: `3px solid ${activeTab === tab.key ? "#2563eb" : "transparent"}`,
              marginBottom: -2, transition: "all 0.15s",
            }}>
              {tab.label}
              {tab.key === "approvals" && pendingCount > 0 && (
                <span style={{ marginLeft: 6, background: "#dc2626", color: "#fff", fontSize: 10, fontWeight: 800, borderRadius: 10, padding: "1px 6px" }}>{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* EMPLOYEES TAB */}
        {activeTab === "employees" && (
          <>
            <div className="card" style={{ padding: 0 }}>
              <div className="table-responsive">
                <table className="table table-bordered align-middle mb-0">
                  <thead>
                    <tr><th>NAME</th><th>DEPARTMENT</th><th>STATUS</th><th>TOGGLE</th></tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp.id}>
                        <td style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>{emp.name}</td>
                        <td style={{ fontSize: 14, color: "#334155" }}>{emp.dept}</td>
                        <td>
                          {emp.pending
                            ? <span style={{ color: "#d97706", fontWeight: 700, fontSize: 14 }}>Pending Approval</span>
                            : emp.active
                              ? <span style={{ color: "#16a34a", fontWeight: 700, fontSize: 14 }}>Active</span>
                              : <span style={{ color: "#dc2626", fontWeight: 700, fontSize: 14 }}>Inactive</span>}
                        </td>
                        <td>
                          {!emp.pending
                            ? <button className="btn btn-primary btn-sm" style={{ minWidth: 100, fontWeight: 600 }} onClick={() => requestToggle(emp.id)}>
                                {emp.active ? "Deactivate" : "Activate"}
                              </button>
                            : <button className="btn btn-secondary btn-sm" disabled style={{ minWidth: 100 }}>Request Sent</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p style={{ marginTop: 12, fontSize: 12.5, color: "#94a3b8" }}>*Status changes require Super Admin approval.</p>
          </>
        )}

        {/* LATE ENTRY APPROVALS TAB */}
        {activeTab === "approvals" && (
          <>
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 16px", marginBottom: 16 }}>
              <p style={{ fontSize: 12.5, color: "#92400e", margin: 0, fontWeight: 500 }}>
                ℹ️ Employees can submit entries up to <strong>3 days</strong> late without approval. Entries older than 3 days need your approval. You have <strong>10 days</strong> to approve or reject each request.
              </p>
            </div>

            {lateRequests.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                <p style={{ fontSize: 15, fontWeight: 600 }}>No pending approval requests</p>
              </div>
            ) : (
              <div className="card" style={{ padding: 0 }}>
                <div className="table-responsive">
                  <table className="table table-bordered align-middle mb-0">
                    <thead>
                      <tr>
                        <th>EMPLOYEE</th>
                        <th>DEPT</th>
                        <th>ENTRY DATE</th>
                        <th>CATEGORY</th>
                        <th>HRS</th>
                        <th>SUBMITTED</th>
                        <th>EXPIRES IN</th>
                        <th>STATUS</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lateRequests.map((r) => {
                        const daysLeft = 10 - daysSinceSubmit(r.submittedAt);
                        const expired  = daysLeft <= 0;
                        return (
                          <tr key={r.id}>
                            <td style={{ fontWeight: 600, color: "#0f172a" }}>{r.employee}</td>
                            <td style={{ color: "#475569" }}>{r.dept}</td>
                            <td style={{ fontWeight: 600, color: "#334155" }}>{r.date}</td>
                            <td style={{ color: "#475569", fontSize: 13 }}>{r.category}</td>
                            <td style={{ fontWeight: 700, fontFamily: "monospace" }}>{r.hours}</td>
                            <td style={{ fontSize: 12.5, color: "#64748b" }}>{r.submittedAt}</td>
                            <td>
                              {r.status !== "Pending" ? "—" : (
                                <span style={{ fontWeight: 700, fontSize: 12.5, color: expired ? "#dc2626" : daysLeft <= 3 ? "#d97706" : "#16a34a" }}>
                                  {expired ? "Expired" : `${daysLeft}d left`}
                                </span>
                              )}
                            </td>
                            <td><StatusBadge status={r.status} /></td>
                            <td>
                              {r.status === "Pending" && !expired ? (
                                <div className="d-flex gap-2">
                                  <button className="btn btn-sm btn-success" style={{ fontWeight: 600 }} onClick={() => approveRequest(r.id)}>Approve</button>
                                  <button className="btn btn-sm btn-danger"  style={{ fontWeight: 600 }} onClick={() => rejectRequest(r.id)}>Reject</button>
                                </div>
                              ) : (
                                <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default EmployeeManagement;
