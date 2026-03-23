import React, { useState } from "react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: integrate backend email service
    setSubmitted(true);
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100" style={{ backgroundColor: "#f9fafb" }}>
      <div className="card shadow-sm p-4" style={{ width: "380px" }}>
        <h3 className="text-center mb-4">Forgot Password</h3>

        {submitted ? (
          <div className="alert alert-success">
            Password reset link has been sent to {email}.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Enter your email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">
              Send Reset Link
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
