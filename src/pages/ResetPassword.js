import React, { useState } from "react";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const handleReset = (e) => {
    e.preventDefault();
    // TODO: integrate backend reset logic
    setConfirmed(true);
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: "#f9fafb" }}>
      <div className="card shadow-sm p-4" style={{ width: "380px" }}>
        <h3 className="text-center mb-4">Reset Password</h3>

        {confirmed ? (
          <div className="alert alert-success">
            Password reset successful! You may now login.
          </div>
        ) : (
          <form onSubmit={handleReset}>
            <div className="mb-3">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">
              Reset Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
