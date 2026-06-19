import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/theme.css";
import config from "../config";
import { useNotifications } from "../context/NotificationContext";

const DEFAULT_PASSWORD = "dwm@1234";

function Login({ setUser }) {
  const [empNo,    setEmpNo]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [errorType, setErrorType] = useState("danger"); // "danger" | "warning" | "info"
  const navigate = useNavigate();
  const notif = useNotifications();

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    setErrorType("danger");
    // Try backend login first
    (async () => {
      try {
        const res = await fetch(`${config.API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ empNo, password }),
        });

        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("token", data.access_token);
          
          // Fetch full profile info
          const meRes = await fetch(`${config.API_URL}/auth/me`, {
            headers: { "Authorization": `Bearer ${data.access_token}` }
          });
          if (meRes.ok) {
            const fullUser = await meRes.json();
            const userObj = { 
              id: fullUser.id,
              empNo: fullUser.empNo, 
              username: fullUser.name, 
              role: fullUser.role || "USER", 
              department: fullUser.dept || "",
              email: fullUser.email,
              designation: fullUser.designation || "",
              shift: fullUser.shift || "A",
              active: fullUser.active !== false
            };
            setUser(userObj);
            localStorage.setItem("user", JSON.stringify(userObj));
            if (userObj.role === "ADMIN" || userObj.role === "SUPER_ADMIN") navigate("/employees");
            else navigate("/time-entry");
            return;
          }
          setError("Failed to load user profile. Please try again.");
          return;
        } else {
          const errData = await res.json();
          setError(errData.detail || "Invalid ID or password. Please check and try again.");
          return;
        }
      } catch (err) {
        console.warn("Backend login connection failed", err);
      }

      // Check if user is attempting with the default password (forgot-password flow)
      if (password === DEFAULT_PASSWORD) {
        try {
          const statusRes = await fetch(`${config.API_URL}/auth/reset-status/${empNo}`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            const status = statusData.status;
            if (status === "pending") {
              setErrorType("warning");
              setError(" Waiting for admin approval. Please try again after your admin approves your password reset request.");
              return;
            }
            if (status === "expired") {
              setErrorType("info");
              setError(" Approval time exceeded (3 days). Please submit a new password reset request or contact your admin directly.");
              return;
            }
          }
        } catch (err) {
          console.warn("Failed to check reset status", err);
        }
      }

      setError("Connection to server failed. Please ensure the backend is running.");
    })();
  };

  const alertClass = errorType === "warning"
    ? "alert alert-warning"
    : errorType === "info"
    ? "alert alert-info"
    : "alert alert-danger";

  return (
    /* Covers the FULL viewport including behind the fixed navbar */
    <div className="login-bg" style={{ marginTop: "-44px", paddingTop: "44px" }}>
      <div className="login-card">

        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, marginBottom:8 }}>
          <div style={{
            width:46, height:46, borderRadius:12, flexShrink:0,
            background:"linear-gradient(135deg,#2563eb,#1d4ed8)",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 6px 18px rgba(37,99,235,0.4)",
          }}>
            <span style={{ color:"#fff", fontWeight:900, fontSize:17 }}>DW</span>
          </div>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ fontWeight:900, fontSize:21, color:"#0f172a", letterSpacing:-0.5, lineHeight:1.1 }}>DWM Portal</div>
              <div style={{ width:1, height:18, background:"#e2e8f0", flexShrink:0 }} />
              <div style={{ fontSize:11.5, color:"#64748b", fontWeight:600, letterSpacing:0.2, whiteSpace:"nowrap" }}>Daily Work Management</div>
            </div>
          </div>
        </div>

        <div style={{ height:1, background:"linear-gradient(90deg,transparent,#e2e8f0,transparent)", margin:"18px 0 20px" }} />

        {error && (
          <div className={alertClass} style={{ fontSize:13, marginBottom:16 }}>{error}</div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-3" style={{ textAlign:"left" }}>
            <label style={{ fontWeight:700, fontSize:11.5, color:"#475569", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.5px" }}>
              Employee / Admin No
            </label>
            <input
              type="text" inputMode="numeric" pattern="[0-9]*"
              className="form-control"
              placeholder="Enter your numeric ID"
              value={empNo}
              onChange={(e) => { setError(""); setEmpNo(e.target.value.replace(/\D/g,"")); }}
              maxLength={10} required
              style={{ fontSize:15, padding:"11px 14px", letterSpacing:1 }}
            />
            <span style={{ fontSize:11, color:"#94a3b8", marginTop:4, display:"block" }}>Numbers only — works for all roles</span>
          </div>

          <div className="mb-2" style={{ textAlign:"left" }}>
            <label style={{ fontWeight:700, fontSize:11.5, color:"#475569", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.5px" }}>
              Password
            </label>
            <input
              type="password" className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => { setError(""); setPassword(e.target.value); }}
              required
              style={{ fontSize:15, padding:"11px 14px" }}
            />
          </div>

          <div style={{ textAlign:"right", marginBottom:22 }}>
            <Link to="/forgot-password" style={{ fontSize:12.5, color:"#2563eb", fontWeight:600, textDecoration:"none" }}>
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="btn btn-primary w-100"
            style={{ padding:"13px", fontSize:15, fontWeight:800, borderRadius:10, letterSpacing:0.3 }}>
            Login →
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
