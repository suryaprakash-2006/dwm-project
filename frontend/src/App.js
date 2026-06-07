import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar    from "./components/Navbar";
import Header    from "./components/Header";
import Sidebar   from "./components/Sidebar";
import Login     from "./components/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Profile   from "./pages/Profile";
import { NotificationProvider } from "./context/NotificationContext";
import config from "./config";

// User
import TimeEntry         from "./pages/user/TimeEntry";
import UserWorkAnalytics from "./pages/user/WorkAnalytics";
import UserReports       from "./pages/user/Reports";

// Admin
import EmployeeManagement from "./pages/admin/EmployeeManagement";
import AdminWorkAnalytics from "./pages/admin/WorkAnalytics";
import AdminReports       from "./pages/admin/Reports";

// Super Admin
import SAEmployees  from "./pages/superadmin/Employees";
import Departments  from "./pages/superadmin/Departments";
import SAMachines   from "./pages/superadmin/Machines";
import Analytics    from "./pages/superadmin/Analytics";
import SuperReports from "./pages/superadmin/Reports";

// Operator
import OperatorTimeEntry      from "./pages/operator/TimeEntry";
import OperatorWorkAnalytics  from "./pages/operator/WorkAnalytics";
import OperatorReports        from "./pages/operator/Reports";
import OperatorMachines       from "./pages/operator/Machines";

import "./styles/theme.css";

function App() {
  const [user,        setUser]        = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [workLog,     setWorkLog]     = useState({});
  const [collapsed,   setCollapsed]   = useState(false);

  const logout = () => { 
    setUser(null); 
    localStorage.removeItem("user"); 
    localStorage.removeItem("token");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${config.API_URL}/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Invalid token");
      })
      .then(data => {
        const userObj = { 
          id: data.id,
          empNo: data.empNo, 
          username: data.name, 
          role: data.role || "USER", 
          department: data.dept || "",
          email: data.email,
          designation: data.designation || "",
          shift: data.shift || "A",
          active: data.active !== false
        };
        setUser(userObj);
        localStorage.setItem("user", JSON.stringify(userObj));
      })
      .catch(err => {
        console.warn("Session recovery failed", err);
        logout();
      });
    }
  }, []);

  const handleWorkLogged = (date, regularMins, overtimeMins) => {
    setWorkLog((prev) => ({
      ...prev,
      [date]: {
        regularMins:  (prev[date]?.regularMins  || 0) + regularMins,
        overtimeMins: (prev[date]?.overtimeMins || 0) + overtimeMins,
      },
    }));
  };

  const AuthLayout = ({ children }) => (
    <>
      <Sidebar
        role={user.role}
        onLogout={logout}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        user={user}
      />
      <main className={`main-content${collapsed ? " sidebar-collapsed" : ""}`}>
        <Header user={user} workLog={workLog} />
        <div className="page">{children}</div>
      </main>
    </>
  );

  const defaultRoute = {
    USER: "/time-entry", ADMIN: "/employees",
    SUPER_ADMIN: "/employees", OPERATOR: "/time-entry",
  };

  const profileEl = (
    <AuthLayout>
      <Profile
        user={user}
      />
    </AuthLayout>
  );

  return (
    <NotificationProvider>
      <BrowserRouter>
        <Navbar />

        <Routes>
          <Route path="/login"           element={<Login setUser={setUser} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {user?.role === "USER" && (
            <>
              <Route path="/time-entry"     element={<AuthLayout><TimeEntry user={user} onWorkLogged={handleWorkLogged} /></AuthLayout>} />
              <Route path="/work-analytics" element={<AuthLayout><UserWorkAnalytics /></AuthLayout>} />
              <Route path="/reports"        element={<AuthLayout><UserReports /></AuthLayout>} />
              <Route path="/profile"        element={profileEl} />
            </>
          )}
          {user?.role === "ADMIN" && (
            <>
              <Route path="/employees"      element={<AuthLayout><EmployeeManagement adminUser={user} /></AuthLayout>} />
              <Route path="/work-analytics" element={<AuthLayout><AdminWorkAnalytics user={user} /></AuthLayout>} />
              <Route path="/reports"        element={<AuthLayout><AdminReports /></AuthLayout>} />
              <Route path="/profile"        element={profileEl} />
            </>
          )}
          {user?.role === "SUPER_ADMIN" && (
            <>
              <Route path="/employees"   element={<AuthLayout><SAEmployees superUser={user} /></AuthLayout>} />
              <Route path="/departments" element={<AuthLayout><Departments /></AuthLayout>} />
              <Route path="/machines"    element={<AuthLayout><SAMachines readOnly /></AuthLayout>} />
              <Route path="/analytics"   element={<AuthLayout><Analytics /></AuthLayout>} />
              <Route path="/reports"     element={<AuthLayout><SuperReports /></AuthLayout>} />
              <Route path="/profile"     element={profileEl} />
            </>
          )}
          {user?.role === "OPERATOR" && (
            <>
              <Route path="/time-entry"     element={<AuthLayout><OperatorTimeEntry user={user} onWorkLogged={handleWorkLogged} /></AuthLayout>} />
              <Route path="/work-analytics" element={<AuthLayout><OperatorWorkAnalytics /></AuthLayout>} />
              <Route path="/reports"        element={<AuthLayout><OperatorReports /></AuthLayout>} />
              <Route path="/machines"       element={<AuthLayout><OperatorMachines /></AuthLayout>} />
              <Route path="/profile"        element={profileEl} />
            </>
          )}

          {user  && <Route path="*" element={<Navigate to={defaultRoute[user.role] || "/login"} />} />}
          {!user && <Route path="*" element={<Navigate to="/login" />} />}
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;
