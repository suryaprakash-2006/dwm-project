import React from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ user, allowedRoles, children }) {

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" />;
  }

  return children;

}

export default ProtectedRoute;