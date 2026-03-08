import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthLayout from "./components/AuthLayout";

import Machines from "./pages/superadmin/Machines";
import EmployeeManagement from "./pages/admin/EmployeeManagement";
import Reports from "./pages/admin/Reports";
import Analytics from "./pages/superadmin/Analytics";
import TimeEntry from "./pages/user/TimeEntry";

import { ROLES } from "./roles";

function App() {

  const [user, setUser] = useState(null);

  useEffect(() => {

    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

  }, []);

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (

    <Router>

      <Routes>

        <Route
          path="/login"
          element={<Login setUser={setUser} />}
        />

        <Route
          path="/time-entry"
          element={
            <ProtectedRoute
              user={user}
              allowedRoles={[ROLES.OPERATOR, ROLES.STAFF]}
            >
              <AuthLayout user={user} onLogout={logout}>
                <TimeEntry user={user} />
              </AuthLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/machines"
          element={
            <ProtectedRoute
              user={user}
              allowedRoles={[ROLES.OPERATOR, ROLES.STAFF]}
            >
              <AuthLayout user={user} onLogout={logout}>
                <Machines user={user} />
              </AuthLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/employees"
          element={
            <ProtectedRoute
              user={user}
              allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}
            >
              <AuthLayout user={user} onLogout={logout}>
                <EmployeeManagement user={user} />
              </AuthLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute user={user}>
              <AuthLayout user={user} onLogout={logout}>
                <Reports user={user} />
              </AuthLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute
              user={user}
              allowedRoles={[ROLES.SUPER_ADMIN]}
            >
              <AuthLayout user={user} onLogout={logout}>
                <Analytics />
              </AuthLayout>
            </ProtectedRoute>
          }
        />

      </Routes>

    </Router>

  );

}

export default App;