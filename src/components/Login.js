import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import credentials from "../data/credentials";
import "../styles/theme.css";

function Login({ setUser }) {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {

    e.preventDefault();

    const user = credentials.find(
      (c) => c.email === email && c.password === password
    );

    if (!user) {
      setError("Invalid login credentials");
      return;
    }

    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);

    if (user.role === "MACHINE_OPERATOR" || user.role === "STAFF")
      navigate("/machines");

    if (user.role === "ADMIN")
      navigate("/employees");

    if (user.role === "SUPER_ADMIN")
      navigate("/analytics");
  };

  return (

    <div className="login-container">

      <div className="login-card">

        <h2>DWM Login</h2>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>

          <input
            type="email"
            className="form-control mb-3"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="form-control mb-3"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="btn btn-primary w-100">
            Login
          </button>

        </form>

      </div>

    </div>

  );

}

export default Login;