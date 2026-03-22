import React from "react";
import "../styles/theme.css";

function Header({ user }) {
  return (
    <div className="header">
      <span>Email: {user?.email || "N/A"}</span>
      <span>Role: {user?.role || "User"}</span>
      <span>Department: {user?.department || "N/A"}</span>
    </div>
  );
}

export default Header;
