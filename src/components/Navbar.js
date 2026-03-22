import React from "react";
import "../styles/theme.css";

function Navbar() {
  return (
    <div className="navbar">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 6px rgba(37,99,235,0.4)", flexShrink: 0,
        }}>
          <span style={{ color: "#fff", fontWeight: 900, fontSize: 11 }}>DW</span>
        </div>
        <h5 className="navbar-title">Daily Work Management</h5>
      </div>
    </div>
  );
}

export default Navbar;
