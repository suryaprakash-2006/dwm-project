import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import "../styles/theme.css";

function AuthLayout({ user, onLogout, children }) {

  return (

    <div className="app-layout">

      <Sidebar role={user.role} onLogout={onLogout} />

      <div className="content-area">

        <Navbar user={user} />

        <div className="page-container">
          {children}
        </div>

      </div>

    </div>

  );

}

export default AuthLayout;