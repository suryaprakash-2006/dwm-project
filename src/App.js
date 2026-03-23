import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Login from "./components/Login";

// User pages
import TimeEntry from "./pages/user/TimeEntry";
import UserWorkAnalytics from "./pages/user/WorkAnalytics";
import UserReports from "./pages/user/Reports";

// Admin pages
import EmployeeManagement from "./pages/admin/EmployeeManagement";
import AdminWorkAnalytics from "./pages/admin/WorkAnalytics";
import AdminReports from "./pages/admin/Reports";

// Super Admin pages
import SAEmployees from "./pages/superadmin/Employees";
import Departments from "./pages/superadmin/Departments";
import SAMachines from "./pages/superadmin/Machines";
import Analytics from "./pages/superadmin/Analytics";
import SuperReports from "./pages/superadmin/Reports";

// Operator pages
import OperatorTimeEntry from "./pages/operator/TimeEntry";
import OperatorWorkAnalytics from "./pages/operator/WorkAnalytics";
import OperatorReports from "./pages/operator/Reports";
import OperatorMachines from "./pages/operator/Machines";

import "./styles/theme.css";

const INITIAL_MACHINES = [
  { id: 1, name: "CNC Lathe",       dept: "Engineering", active: true  },
  { id: 2, name: "Hydraulic Press", dept: "Fabrication", active: false },
  { id: 3, name: "PLC Panel",       dept: "Automation",  active: true  },
];

function App() {
  const [user, setUser]           = useState(null);
  const [machines, setMachines]   = useState(INITIAL_MACHINES);

  const logout = () => { setUser(null); localStorage.removeItem("user"); };

  const AuthLayout = ({ children }) => (
    <div className="d-flex">
      <Sidebar role={user.role} onLogout={logout} />
      <div className="main-content w-100">
        <Header user={user} />
        <div className="p-3">{children}</div>
      </div>
    </div>
  );

  const defaultRoute = {
    USER: "/time-entry", ADMIN: "/employees",
    SUPER_ADMIN: "/employees", OPERATOR: "/time-entry",
  };

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />

        {user?.role === "USER" && (
          <>
            <Route path="/time-entry"     element={<AuthLayout><TimeEntry user={user} /></AuthLayout>} />
            <Route path="/work-analytics" element={<AuthLayout><UserWorkAnalytics /></AuthLayout>} />
            <Route path="/reports"        element={<AuthLayout><UserReports /></AuthLayout>} />
          </>
        )}

        {user?.role === "ADMIN" && (
          <>
            <Route path="/employees"      element={<AuthLayout><EmployeeManagement /></AuthLayout>} />
            <Route path="/work-analytics" element={<AuthLayout><AdminWorkAnalytics user={user} /></AuthLayout>} />
            <Route path="/reports"        element={<AuthLayout><AdminReports /></AuthLayout>} />
          </>
        )}

        {user?.role === "SUPER_ADMIN" && (
          <>
            <Route path="/employees"   element={<AuthLayout><SAEmployees /></AuthLayout>} />
            <Route path="/departments" element={<AuthLayout><Departments /></AuthLayout>} />
            <Route path="/machines"    element={<AuthLayout><SAMachines machines={machines} readOnly /></AuthLayout>} />
            <Route path="/analytics"   element={<AuthLayout><Analytics /></AuthLayout>} />
            <Route path="/reports"     element={<AuthLayout><SuperReports /></AuthLayout>} />
          </>
        )}

        {user?.role === "OPERATOR" && (
          <>
            <Route path="/time-entry"     element={<AuthLayout><OperatorTimeEntry user={user} /></AuthLayout>} />
            <Route path="/work-analytics" element={<AuthLayout><OperatorWorkAnalytics /></AuthLayout>} />
            <Route path="/reports"        element={<AuthLayout><OperatorReports /></AuthLayout>} />
            <Route path="/machines"       element={<AuthLayout><OperatorMachines machines={machines} setMachines={setMachines} /></AuthLayout>} />
          </>
        )}

        {user  && <Route path="*" element={<Navigate to={defaultRoute[user.role] || "/login"} />} />}
        {!user && <Route path="*" element={<Navigate to="/login" />} />}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
