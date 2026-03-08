import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ROLES } from "../roles";
import "../styles/theme.css";

function Sidebar({ role, onLogout }) {

  const navigate = useNavigate();

  const logout = () => {
    onLogout();
    navigate("/login");
  };

  return (

    <div className="sidebar">

      <h4 className="sidebar-title">DWM</h4>

      <ul>

        {(role === ROLES.OPERATOR || role === ROLES.STAFF) && (
          <>
            <li><Link to="/time-entry">Time Entry</Link></li>
            <li><Link to="/machines">Machines</Link></li>
            <li><Link to="/reports">Reports</Link></li>
          </>
        )}

        {role === ROLES.ADMIN && (
          <>
            <li><Link to="/employees">Employees</Link></li>
            <li><Link to="/reports">Reports</Link></li>
          </>
        )}

        {role === ROLES.SUPER_ADMIN && (
          <>
            <li><Link to="/analytics">Analytics</Link></li>
            <li><Link to="/employees">Employees</Link></li>
            <li><Link to="/departments">Departments</Link></li>
          </>
        )}

      </ul>

      <button
        className="btn btn-danger w-100 mt-3"
        onClick={logout}
      >
        Logout
      </button>

    </div>

  );

}

export default Sidebar;