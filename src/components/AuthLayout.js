import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Header from "./Header";

function AuthLayout({ user, onLogout, children }) {
  return (
    <div className="d-flex">
      {/* Sidebar */}
      <Sidebar role={user.role} onLogout={onLogout} />

      {/* Main content */}
      <div className="flex-grow-1">
        <Navbar />
        <Header user={user} />
        <div className="p-4" style={{ backgroundColor: "#f3f4f6", minHeight: "100vh" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
