import React from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ user, allowedRoles, children }) {
  if (!user) return <Navigate to="/" />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/work-analytics" />;
  return children;
}

export default ProtectedRoute;
