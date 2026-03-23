import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/theme.css";

function Sidebar({ role, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const a = (path) => location.pathname === path ? "active" : "";
  const handleLogout = () => { onLogout(); navigate("/login"); };

  return (
    <div className="sidebar">
      {/* No DWM title here — navbar already has it */}
      <ul style={{ marginTop: 8 }}>
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
