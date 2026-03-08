import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/theme.css";
import credentials from "../data/credentials";

function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    const found = credentials.find(
      (cred) => cred.email === email && cred.password === password
    );

    if (found) {
      setUser({ email: found.email, role: found.role, department: found.department });
      localStorage.setItem("user", JSON.stringify(found));

      // Redirect based on role
      if (found.role === "USER") navigate("/time-entry");
      if (found.role === "ADMIN") navigate("/employees");
      if (found.role === "SUPER_ADMIN") navigate("/employees");
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Welcome to DWM Portal</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label>Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
