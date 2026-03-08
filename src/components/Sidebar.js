import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/theme.css";

function Sidebar({ role, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  return (
    <div className="sidebar">
      <h4 className="sidebar-title">DWM</h4>
      <ul>
        {role === "USER" && (
          <>
            <li><Link to="/time-entry">Time Entry</Link></li>
            <li><Link to="/work-analytics">Work Analytics</Link></li>
            <li><Link to="/reports">Reports</Link></li>
           
          </>
        )}
        {role === "ADMIN" && (
          <>
            <li><Link to="/employees">Employees</Link></li>
            <li><Link to="/work-analytics">Work Analytics</Link></li>
            <li><Link to="/reports">Reports</Link></li>
            
          </>
        )}
        {role === "SUPER_ADMIN" && (
          <>
            <li><Link to="/employees">Employees</Link></li>
            <li><Link to="/departments">Departments</Link></li>
            <li><Link to="/machines">Machines</Link></li>
            <li><Link to="/analytics">Analytics</Link></li>
            <li><Link to="/reports">Reports</Link></li>
            
          </>
        )}
      </ul>
      <button className="btn btn-danger w-100 mt-3" onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Sidebar;
