import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/theme.css";

function Sidebar({ role, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const a = (path) => location.pathname === path ? "active" : "";
<<<<<<< HEAD
=======

>>>>>>> 5ab23cc1e1d41bdb87e83040f6bae0b812622797
  const handleLogout = () => { onLogout(); navigate("/login"); };

  return (
    <div className="sidebar">
<<<<<<< HEAD
      {/* No DWM title here — navbar already has it */}
      <ul style={{ marginTop: 8 }}>
=======
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28, padding: "0 4px" }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 10px rgba(37,99,235,0.4)", flexShrink: 0,
        }}>
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 13, letterSpacing: 0 }}>DW</span>
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#e2e8f0", lineHeight: 1, letterSpacing: 0.5 }}>DWM</div>
          <div style={{ width: 28, height: 2.5, background: "linear-gradient(90deg,#2563eb,#60a5fa)", borderRadius: 2, marginTop: 4 }} />
        </div>
      </div>

      <ul>
>>>>>>> 5ab23cc1e1d41bdb87e83040f6bae0b812622797
        {role === "USER" && (
          <>
            <li><Link to="/time-entry"     className={a("/time-entry")}>📋 Time Entry</Link></li>
            <li><Link to="/work-analytics" className={a("/work-analytics")}>📊 Work Analytics</Link></li>
            <li><Link to="/reports"        className={a("/reports")}>📄 Reports</Link></li>
          </>
        )}
        {role === "ADMIN" && (
          <>
            <li><Link to="/employees"      className={a("/employees")}>👥 Employees</Link></li>
            <li><Link to="/work-analytics" className={a("/work-analytics")}>📊 Work Analytics</Link></li>
            <li><Link to="/reports"        className={a("/reports")}>📄 Reports</Link></li>
          </>
        )}
        {role === "SUPER_ADMIN" && (
          <>
            <li><Link to="/employees"   className={a("/employees")}>👥 Employees</Link></li>
            <li><Link to="/departments" className={a("/departments")}>🏢 Departments</Link></li>
            <li><Link to="/machines"    className={a("/machines")}>⚙️ Machines</Link></li>
            <li><Link to="/analytics"   className={a("/analytics")}>📊 Analytics</Link></li>
            <li><Link to="/reports"     className={a("/reports")}>📄 Reports</Link></li>
          </>
        )}
        {role === "OPERATOR" && (
          <>
            <li><Link to="/time-entry"     className={a("/time-entry")}>📋 Time Entry</Link></li>
            <li><Link to="/work-analytics" className={a("/work-analytics")}>📊 Work Analytics</Link></li>
            <li><Link to="/reports"        className={a("/reports")}>📄 Reports</Link></li>
            <li><Link to="/machines"       className={a("/machines")}>⚙️ Machines</Link></li>
          </>
        )}
      </ul>
      <button className="btn btn-danger w-100 mt-3" onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Sidebar;
