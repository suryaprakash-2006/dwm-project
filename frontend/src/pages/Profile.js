import React, { useState } from "react";
import "../styles/theme.css";
import config from "../config";

// Role display helper
function roleLabel(role) {
  return { USER: "User", ADMIN: "Admin", SUPER_ADMIN: "Super Admin", OPERATOR: "Operator" }[role] || role;
}
// Single detail row
function DetailRow({ label, value, accent }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start",
      padding: "13px 0",
      borderBottom: "1px solid #f1f5f9",
    }}>
      <span style={{
        width: 160, flexShrink: 0,
        fontSize: 11.5, fontWeight: 700,
        color: "#94a3b8",
        textTransform: "uppercase", letterSpacing: "0.6px",
        paddingTop: 1,
      }}>{label}</span>
      <span style={{
        fontSize: 14, fontWeight: 600,
        color: accent ? "#2563eb" : "#0f172a",
        flex: 1,
      }}>{value || "—"}</span>
    </div>
  );
}

export default function Profile({ user }) {
  const emp = { ...user, name: user?.username };

  const [tab, setTab]               = useState("info"); // "info" | "password"
  const [currentPw, setCurrentPw]   = useState("");
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [pwError, setPwError]       = useState("");
  const [pwSuccess, setPwSuccess]   = useState(false);
  const [showCur, setShowCur]       = useState(false);
  const [showNew, setShowNew]       = useState(false);
  const [showCon, setShowCon]       = useState(false);

  const handleChangePassword = (e) => {
    e.preventDefault();
    setPwError("");
    if (newPw.length < 6) { setPwError("New password must be at least 6 characters."); return; }
    if (newPw !== confirmPw) { setPwError("Passwords do not match."); return; }

    const token = localStorage.getItem("token");
    if (!token) { setPwError("Not authenticated."); return; }

    (async () => {
      try {
        const res = await fetch(`${config.API_URL}/auth/change-password`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw })
        });
        if (res.ok) {
          setPwSuccess(true);
          setCurrentPw(""); setNewPw(""); setConfirmPw("");
          setTimeout(() => {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            window.location.href = "/login";
          }, 2000);
        } else {
          const errData = await res.json();
          setPwError(errData.detail || "Failed to update password. Please check your current password.");
        }
      } catch (err) {
        setPwError("Server error. Please try again.");
      }
    })();
  };

  // Avatar initials
  const initials = emp?.name
    ? emp.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : (user?.email?.[0] || "U").toUpperCase();

  const statusActive = emp?.active !== false;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>

      {/* Profile card header */}
      <div style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
        marginBottom: 20,
      }}>
        {/* Accent band */}
        <div style={{
          height: 5,
          background: "linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)",
        }} />

        <div style={{
          display: "flex", alignItems: "center", gap: 24,
          padding: "28px 32px",
        }}>
          {/* Avatar */}
          <div style={{
            width: 72, height: 72, borderRadius: 16, flexShrink: 0,
            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
          }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 24 }}>{initials}</span>
          </div>

          {/* Name + role */}
          <div style={{ flex: 1 }}>
            <h4 style={{ fontWeight: 800, color: "#0f172a", margin: "0 0 4px", fontSize: 20 }}>
              {emp?.name || user?.email}
            </h4>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{
                background: "#dbeafe", color: "#1d4ed8",
                fontSize: 11.5, fontWeight: 700,
                padding: "3px 12px", borderRadius: 20,
              }}>
                {roleLabel(user?.role)}
              </span>
              {emp?.designation && (
                <span style={{
                  background: "#f1f5f9", color: "#475569",
                  fontSize: 11.5, fontWeight: 600,
                  padding: "3px 12px", borderRadius: 20,
                }}>
                  {emp.designation}
                </span>
              )}
              <span style={{
                background: statusActive ? "#f0fdf4" : "#f8fafc",
                border: `1px solid ${statusActive ? "#bbf7d0" : "#e2e8f0"}`,
                color: statusActive ? "#16a34a" : "#94a3b8",
                fontSize: 11.5, fontWeight: 700,
                padding: "3px 12px", borderRadius: 20,
                display: "inline-flex", alignItems: "center", gap: 5,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusActive ? "#16a34a" : "#cbd5e1", display: "inline-block" }} />
                {statusActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Emp ID badge */}
          {emp?.id && (
            <div style={{
              background: "#f8fafc", border: "1px solid #e2e8f0",
              borderRadius: 10, padding: "10px 18px", textAlign: "center",
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 3 }}>Employee ID</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", fontFamily: "monospace" }}>{emp.id}</div>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div style={{
          display: "flex",
          borderTop: "1px solid #f1f5f9",
          background: "#fafbfc",
        }}>
          {[
            { id: "info", label: "Profile Details" },
            { id: "password", label: "Change Password" },
          ].map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); setPwError(""); setPwSuccess(false); }}
              style={{
                padding: "12px 24px",
                fontSize: 13, fontWeight: 700,
                background: "none", border: "none", cursor: "pointer",
                color: tab === t.id ? "#2563eb" : "#64748b",
                borderBottom: tab === t.id ? "2px solid #2563eb" : "2px solid transparent",
                transition: "all 0.15s",
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB: Profile Details */}
      {tab === "info" && (
        <div style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          padding: "8px 32px 24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}>
          <DetailRow label="Full Name"    value={emp?.name} />
          <DetailRow label="Employee ID"  value={emp?.id} accent />
          <DetailRow label="Email"        value={user?.email} />
          <DetailRow label="Role"         value={roleLabel(user?.role)} />
          <DetailRow label="Department"   value={emp?.dept || user?.department} />
          <DetailRow label="Designation"  value={emp?.designation} />
          <DetailRow label="Shift"        value={emp?.shift ? `Shift ${emp.shift}` : "—"} />
          <DetailRow label="Login ID"     value={user?.empNo} />
          <DetailRow label="Account Status" value={statusActive ? "Active" : "Inactive"} accent={statusActive} />
        </div>
      )}

      {/* TAB: Change Password */}
      {tab === "password" && (
        <div style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          padding: "28px 32px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}>
          <h6 style={{
            fontWeight: 800, fontSize: 14, color: "#0f172a",
            margin: "0 0 6px", textTransform: "none", letterSpacing: 0,
          }}>Change Password</h6>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 24px" }}>
            Enter your current password to set a new one. Minimum 6 characters.
          </p>

          {pwSuccess && (
            <div className="alert alert-success" style={{ marginBottom: 20 }}>
              ✅ Password changed successfully.
            </div>
          )}
          {pwError && (
            <div className="alert alert-danger" style={{ marginBottom: 20 }}>
              ⚠️ {pwError}
            </div>
          )}

          <form onSubmit={handleChangePassword} style={{ maxWidth: 400 }}>
            {[
              { label: "Current Password", value: currentPw, set: setCurrentPw, show: showCur, setShow: setShowCur },
              { label: "New Password",     value: newPw,     set: setNewPw,     show: showNew, setShow: setShowNew },
              { label: "Confirm Password", value: confirmPw, set: setConfirmPw, show: showCon, setShow: setShowCon },
            ].map(({ label, value, set, show, setShow }) => (
              <div key={label} style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#475569", marginBottom: 6 }}>
                  {label}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={show ? "text" : "password"}
                    className="form-control"
                    value={value}
                    onChange={(e) => { set(e.target.value); setPwError(""); }}
                    required
                    placeholder={`Enter ${label.toLowerCase()}`}
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShow((s) => !s)}
                    style={{
                      position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 14, color: "#94a3b8", padding: 4,
                    }}>
                    {show ? "🙈" : "👁"}
                  </button>
                </div>
              </div>
            ))}

            <button type="submit" className="btn btn-primary"
              style={{ padding: "10px 28px", fontWeight: 700, marginTop: 8 }}>
              Update Password
            </button>
          </form>

          {/* Default password hint */}

        </div>
      )}
    </div>
  );
}
