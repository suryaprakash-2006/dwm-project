import React from "react";
import "../styles/theme.css";

function Navbar({ user }) {

  return (
    <div className="navbar">

      {/* Left side title */}
      <div className="navbar-left">
        <h4 className="navbar-title">
          Daily Work Management
        </h4>
      </div>

      {/* Right side user info */}
      <div className="navbar-right">

        <span className="navbar-info">
          Email: {user?.email}
        </span>

        <span className="navbar-info">
          Role: {user?.role}
        </span>

        <span className="navbar-info">
          Dept: {user?.department}
        </span>

      </div>

    </div>
  );

}

export default Navbar;