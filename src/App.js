import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Login from "./components/Login";

// import all role pages...
import TimeEntry from "./pages/user/TimeEntry";
import UserWorkAnalytics from "./pages/user/WorkAnalytics";
import UserReports from "./pages/user/Reports";

import EmployeeManagement from "./pages/admin/EmployeeManagement";
import AdminWorkAnalytics from "./pages/admin/WorkAnalytics";
import AdminReports from "./pages/admin/Reports";

import Employees from "./pages/superadmin/Employees";
import Departments from "./pages/superadmin/Departments";
import Machines from "./pages/superadmin/Machines";
import Analytics from "./pages/superadmin/Analytics";
import SuperReports from "./pages/superadmin/Reports";

import "./styles/theme.css";

function App() {
  const [user, setUser] = useState(null);

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const AuthLayout = ({ children }) => (
    <div className="d-flex">
      <Sidebar role={user.role} onLogout={logout} />
      <div className="main-content w-100">
        <Header user={user} />
        <div className="p-3">{children}</div>
      </div>
    </div>
  );

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />

        {user && user.role === "USER" && (
          <>
            <Route path="/time-entry" element={<AuthLayout><TimeEntry user={user} /></AuthLayout>} />
            <Route path="/work-analytics" element={<AuthLayout><UserWorkAnalytics /></AuthLayout>} />
            <Route path="/reports" element={<AuthLayout><UserReports /></AuthLayout>} />
          </>
        )}

        {user && user.role === "ADMIN" && (
          <>
            <Route path="/employees" element={<AuthLayout><EmployeeManagement /></AuthLayout>} />
            <Route path="/work-analytics" element={<AuthLayout><AdminWorkAnalytics /></AuthLayout>} />
            <Route path="/reports" element={<AuthLayout><AdminReports /></AuthLayout>} />
          </>
        )}

        {user && user.role === "SUPER_ADMIN" && (
          <>
            <Route path="/employees" element={<AuthLayout><Employees /></AuthLayout>} />
            <Route path="/departments" element={<AuthLayout><Departments /></AuthLayout>} />
            <Route path="/machines" element={<AuthLayout><Machines /></AuthLayout>} />
            <Route path="/analytics" element={<AuthLayout><Analytics /></AuthLayout>} />
            <Route path="/reports" element={<AuthLayout><SuperReports /></AuthLayout>} />
          </>
        )}

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
