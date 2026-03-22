import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/theme.css";
import credentials from "../data/credentials";

function Login({ setUser }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    const found = credentials.find(
      (c) => c.email === email && c.password === password
    );
    if (found) {
      setUser({ email: found.email, role: found.role, department: found.department });
      localStorage.setItem("user", JSON.stringify(found));
      if (found.role === "USER")        navigate("/time-entry");
      else if (found.role === "ADMIN")       navigate("/employees");
      else if (found.role === "SUPER_ADMIN") navigate("/employees");
      else if (found.role === "OPERATOR")    navigate("/time-entry");
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(37,99,235,0.35)",
          }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 16, letterSpacing: 0 }}>DW</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: 20, color: "#0f172a", letterSpacing: -0.5 }}>DWM Portal</span>
        </div>

        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>Daily Work Management System</p>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="mb-3" style={{ textAlign: "left" }}>
            <label>Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4" style={{ textAlign: "left" }}>
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100" style={{ padding: "11px", fontSize: 15, fontWeight: 700 }}>
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
