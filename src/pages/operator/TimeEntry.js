import React, { useState } from "react";
import "../../styles/theme.css";

const CATEGORIES = [
<<<<<<< HEAD
  "Task against order", "Improvements / Development", "Complaints",
  "New enquiry / RFQ", "LBE", "Supporting Activities", "General", "Travel / OD",
];
const SUB_CATEGORIES = ["Sub Category 1", "Sub Category 2", "Sub Category 3"];
const STATUS_OPTIONS = [
  { value: "P",  label: "Present"  },
  { value: "HD", label: "Half Day" },
  { value: "L",  label: "Leave"    },
  { value: "OD", label: "On Duty"  },
];

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function daysDiff(dateStr) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.floor((TODAY - d) / (1000 * 60 * 60 * 24));
}

function formatDate(d) {
  return d.toISOString().split("T")[0];
}

function getLast14Days() {
  const days = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(TODAY);
    d.setDate(TODAY.getDate() - i);
    days.push(formatDate(d));
  }
  return days;
}

export default function TimeEntry({ user }) {
  const [selectedDate, setSelectedDate] = useState(formatDate(TODAY));
  const [form, setForm] = useState({
    status: "P", category: CATEGORIES[0],
    subCategory: SUB_CATEGORIES[0],
    regularHours: "", overtimeHours: "", remarks: "",
  });
  const [submitted, setSubmitted]             = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const total = (Number(form.regularHours) || 0) + (Number(form.overtimeHours) || 0);
  const diff  = daysDiff(selectedDate);

  // 0-3 days = direct, 4-10 = needs approval, >10 = blocked
  const entryMode = diff <= 3 ? "direct" : diff <= 10 ? "approval" : "blocked";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (entryMode === "blocked") return;
    if (entryMode === "approval") {
      setPendingRequests((prev) => [...prev, {
        id: Date.now(), date: selectedDate, ...form, total,
        submittedAt: formatDate(TODAY), status: "Pending",
      }]);
      setSubmitted("approval");
    } else {
      setSubmitted("direct");
    }
    setTimeout(() => setSubmitted(null), 4000);
    setForm({ status: "P", category: CATEGORIES[0], subCategory: SUB_CATEGORIES[0], regularHours: "", overtimeHours: "", remarks: "" });
  };

  return (
    <div className="page">
      <div className="container-fluid">
        <h3 style={{ marginBottom: 20 }}>Daily Time Entry</h3>

        {/* Pending requests — compact strip */}
        {pendingRequests.length > 0 && (
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 16px", marginBottom: 16 }}>
            <p style={{ fontWeight: 700, fontSize: 12.5, color: "#d97706", margin: "0 0 6px" }}>
              ⏳ {pendingRequests.length} late entr{pendingRequests.length > 1 ? "ies" : "y"} sent to admin for approval
            </p>
            {pendingRequests.map((r) => (
              <div key={r.id} style={{ fontSize: 12, color: "#92400e", display: "flex", gap: 14, padding: "3px 0", borderTop: "1px solid #fde68a" }}>
                <span><strong>Date:</strong> {r.date}</span>
                <span><strong>Category:</strong> {r.category}</span>
                <span><strong>Hours:</strong> {r.total}</span>
                <span style={{ marginLeft: "auto", background: "#fef3c7", color: "#d97706", borderRadius: 10, padding: "1px 8px", fontWeight: 700, fontSize: 11 }}>Pending</span>
              </div>
            ))}
          </div>
        )}

        {submitted === "direct" && <div className="alert alert-success">✅ Time entry submitted successfully!</div>}
        {submitted === "approval" && <div className="alert alert-warning">⏳ Late entry — approval request sent to admin.</div>}

        <form onSubmit={handleSubmit}>
          <div className="row g-4">
            {/* LEFT FORM */}
            <div className="col-lg-8">
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "24px 28px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>

                {/* Email */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#475569", marginBottom: 6 }}>Employee Email</label>
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "9px 12px", fontSize: 13.5, color: "#64748b", display: "flex", alignItems: "center", gap: 8 }}>
                    <span>👤</span> {user?.email || "—"}
                  </div>
                </div>

                {/* Date */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#475569", marginBottom: 6 }}>Entry Date</label>
                  <select className="form-select" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
                    {getLast14Days().map((d) => {
                      const df = daysDiff(d);
                      const lbl = df === 0 ? "Today" : df === 1 ? "Yesterday" : `${df} days ago`;
                      return <option key={d} value={d}>{d} — {lbl}</option>;
                    })}
                  </select>

                  {/* Only show warning if late — no extra info boxes otherwise */}
                  {entryMode === "approval" && (
                    <div style={{ marginTop: 7, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 7, padding: "7px 12px", fontSize: 12.5, color: "#d97706", fontWeight: 600 }}>
                      ⏳ This is a late entry — it will be sent to admin for approval.
                    </div>
                  )}
                  {entryMode === "blocked" && (
                    <div style={{ marginTop: 7, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, padding: "7px 12px", fontSize: 12.5, color: "#dc2626", fontWeight: 600 }}>
                      🚫 This date is too old. Contact your admin.
                    </div>
                  )}
                </div>

                {entryMode !== "blocked" && (
                  <>
                    {/* Status */}
                    <div style={{ marginBottom: 18 }}>
                      <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#475569", marginBottom: 6 }}>Attendance Status</label>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {STATUS_OPTIONS.map((opt) => (
                          <label key={opt.value} style={{
                            display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                            borderRadius: 8, cursor: "pointer",
                            border: `2px solid ${form.status === opt.value ? "#2563eb" : "#e2e8f0"}`,
                            background: form.status === opt.value ? "#dbeafe" : "#fff",
                            fontSize: 13, fontWeight: form.status === opt.value ? 700 : 500,
                            color: form.status === opt.value ? "#1d4ed8" : "#334155",
                            transition: "all 0.15s",
                          }}>
                            <input type="radio" name="status" value={opt.value} checked={form.status === opt.value}
                              onChange={() => set("status", opt.value)} style={{ display: "none" }} />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Category */}
                    <div style={{ marginBottom: 18 }}>
                      <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#475569", marginBottom: 6 }}>Work Category</label>
                      <select className="form-select" value={form.category} onChange={(e) => set("category", e.target.value)}>
                        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>

                    {/* Sub Category */}
                    <div style={{ marginBottom: 18 }}>
                      <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#475569", marginBottom: 6 }}>Sub-Category</label>
                      <select className="form-select" value={form.subCategory} onChange={(e) => set("subCategory", e.target.value)}>
                        {SUB_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>

                    {/* Hours */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
                      {[{ key: "regularHours", label: "Regular Hours" }, { key: "overtimeHours", label: "Overtime Hours" }].map(({ key, label }) => (
                        <div key={key}>
                          <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#475569", marginBottom: 6 }}>{label}</label>
                          <div style={{ position: "relative" }}>
                            <input type="number" className="form-control" min="0" max="8" placeholder="0"
                              value={form[key]}
                              onChange={(e) => { const v = e.target.value; if (v === "" || (Number(v) >= 0 && Number(v) <= 8)) set(key, v); }}
                              style={{ paddingRight: 40 }} />
                            <span style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>hrs</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Remarks */}
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#475569", marginBottom: 6 }}>Remarks (optional)</label>
                      <textarea className="form-control" rows={2} placeholder="Add any notes..."
                        value={form.remarks} onChange={(e) => set("remarks", e.target.value)} />
                    </div>

                    <button type="submit" className="btn btn-primary w-100" style={{ padding: "11px", fontSize: 14, fontWeight: 700 }}>
                      {entryMode === "approval" ? "⏳ Send for Approval" : "✓ Save & Submit"}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* RIGHT SUMMARY */}
            <div className="col-lg-4">
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 14 }}>
                <h6 style={{ fontWeight: 700, fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #f1f5f9" }}>
                  Summary
                </h6>
                {[
                  { label: "Regular Hours",  value: form.regularHours  || 0, color: "#2563eb" },
                  { label: "Overtime Hours", value: form.overtimeHours || 0, color: "#d97706" },
                  { label: "Total Hours",    value: total,                   color: "#16a34a", bold: true },
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #f8fafc" }}>
                    <span style={{ fontSize: 13, color: "#475569", fontWeight: row.bold ? 700 : 500 }}>{row.label}</span>
                    <span style={{ fontSize: row.bold ? 20 : 15, fontWeight: 800, color: row.color, fontFamily: "monospace" }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Attendance indicator */}
              <div style={{
                background: form.status === "P" ? "#f0fdf4" : form.status === "HD" ? "#eff6ff" : form.status === "L" ? "#fef2f2" : "#fffbeb",
                border: `1px solid ${form.status === "P" ? "#bbf7d0" : form.status === "HD" ? "#bfdbfe" : form.status === "L" ? "#fecaca" : "#fde68a"}`,
                borderRadius: 10, padding: "14px 16px",
              }}>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase", margin: "0 0 4px" }}>Status</p>
                <p style={{ fontSize: 18, fontWeight: 800, margin: 0, color: form.status === "P" ? "#16a34a" : form.status === "HD" ? "#2563eb" : form.status === "L" ? "#dc2626" : "#d97706" }}>
=======
  "Task against order",
  "Improvements / Development",
  "Complaints",
  "New enquiry / RFQ",
  "LBE",
  "Supporting Activities",
  "General",
  "Travel / OD",
];

const SUB_CATEGORIES = ["Sub Category 1", "Sub Category 2", "Sub Category 3"];

const STATUS_OPTIONS = [
  { value: "P",  label: "P — Present" },
  { value: "L",  label: "L — Leave"   },
  { value: "OD", label: "OD — On Duty" },
];

function TimeEntry({ user }) {
  const [form, setForm] = useState({
    status: "P",
    category: CATEGORIES[0],
    subCategory: SUB_CATEGORIES[0],
    regularHours: "",
    overtimeHours: "",
    remarks: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const total = (Number(form.regularHours) || 0) + (Number(form.overtimeHours) || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const Field = ({ label, children, hint }) => (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#475569", marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 4, marginBottom: 0 }}>{hint}</p>}
    </div>
  );

  return (
    <div className="page">
      <div className="container-fluid">
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 4 }}>Daily Time Entry</h3>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {submitted && (
          <div className="alert alert-success">✅ Time entry submitted successfully!</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row g-4">
            {/* LEFT — Main Form */}
            <div className="col-lg-8">
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "28px 28px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>

                {/* Employee email — readonly */}
                <Field label="Employee Email">
                  <div style={{
                    background: "#f8fafc", border: "1px solid #e2e8f0",
                    borderRadius: 6, padding: "9px 12px", fontSize: 13.5, color: "#64748b",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span style={{ fontSize: 15 }}>👤</span> {user?.email || "—"}
                  </div>
                </Field>

                {/* Attendance Status */}
                <Field label="Attendance Status">
                  <div style={{ display: "flex", gap: 10 }}>
                    {STATUS_OPTIONS.map((opt) => (
                      <label key={opt.value} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "9px 16px", borderRadius: 8, cursor: "pointer",
                        border: `2px solid ${form.status === opt.value ? "#2563eb" : "#e2e8f0"}`,
                        background: form.status === opt.value ? "#dbeafe" : "#fff",
                        fontSize: 13.5, fontWeight: form.status === opt.value ? 700 : 500,
                        color: form.status === opt.value ? "#1d4ed8" : "#334155",
                        transition: "all 0.15s",
                      }}>
                        <input type="radio" name="status" value={opt.value} checked={form.status === opt.value}
                          onChange={() => set("status", opt.value)} style={{ display: "none" }} />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </Field>

                {/* Category */}
                <Field label="Work Category">
                  <select className="form-select" value={form.category} onChange={(e) => set("category", e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>

                {/* Sub Category */}
                <Field label="Sub-Category (Assigned by Admin)">
                  <select className="form-select" value={form.subCategory} onChange={(e) => set("subCategory", e.target.value)}>
                    {SUB_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>

                {/* Hours row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#475569", marginBottom: 6 }}>
                      Regular Hours
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="number" className="form-control" min="0" max="8" placeholder="0"
                        value={form.regularHours}
                        onChange={(e) => { const v = e.target.value; if (v === "" || (Number(v) >= 0 && Number(v) <= 8)) set("regularHours", v); }}
                        style={{ paddingRight: 44 }}
                      />
                      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>hrs</span>
                    </div>
                    <p style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 4, marginBottom: 0 }}>Max 8 hrs per shift</p>
                  </div>
                  <div>
                    <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#475569", marginBottom: 6 }}>
                      Overtime Hours
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="number" className="form-control" min="0" max="8" placeholder="0"
                        value={form.overtimeHours}
                        onChange={(e) => { const v = e.target.value; if (v === "" || (Number(v) >= 0 && Number(v) <= 8)) set("overtimeHours", v); }}
                        style={{ paddingRight: 44 }}
                      />
                      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>hrs</span>
                    </div>
                    <p style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 4, marginBottom: 0 }}>Max 8 hrs overtime</p>
                  </div>
                </div>

                {/* Remarks */}
                <Field label="Remarks (optional)">
                  <textarea className="form-control" rows={3} placeholder="Add any notes or remarks..."
                    value={form.remarks} onChange={(e) => set("remarks", e.target.value)} />
                </Field>

                <button type="submit" className="btn btn-primary w-100" style={{ padding: "12px", fontSize: 15, fontWeight: 700 }}>
                  ✓ Save & Submit Entry
                </button>
              </div>
            </div>

            {/* RIGHT — Summary */}
            <div className="col-lg-4">
              {/* Daily Summary card */}
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "22px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 16 }}>
                <h6 style={{ fontWeight: 700, fontSize: 13, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #f1f5f9" }}>
                  Today's Summary
                </h6>

                {[
                  { label: "Regular Hours", value: form.regularHours || 0, color: "#2563eb" },
                  { label: "Overtime Hours", value: form.overtimeHours || 0, color: "#d97706" },
                  { label: "Total Hours", value: total, color: "#16a34a", bold: true },
                ].map((row) => (
                  <div key={row.label} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 0", borderBottom: "1px solid #f8fafc",
                  }}>
                    <span style={{ fontSize: 13.5, color: "#475569", fontWeight: row.bold ? 700 : 500 }}>{row.label}</span>
                    <span style={{ fontSize: row.bold ? 20 : 16, fontWeight: 800, color: row.color, fontFamily: "monospace" }}>
                      {row.value}
                    </span>
                  </div>
                ))}

                <p style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 12, marginBottom: 0 }}>
                  * Every shift contains 8 regular hours
                </p>
              </div>

              {/* Status indicator */}
              <div style={{
                background: form.status === "P" ? "#f0fdf4" : form.status === "L" ? "#fef2f2" : "#fffbeb",
                border: `1px solid ${form.status === "P" ? "#bbf7d0" : form.status === "L" ? "#fecaca" : "#fde68a"}`,
                borderRadius: 10, padding: "14px 16px",
              }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 4px" }}>Attendance</p>
                <p style={{
                  fontSize: 20, fontWeight: 800, margin: 0,
                  color: form.status === "P" ? "#16a34a" : form.status === "L" ? "#dc2626" : "#d97706",
                }}>
>>>>>>> 5ab23cc1e1d41bdb87e83040f6bae0b812622797
                  {STATUS_OPTIONS.find((s) => s.value === form.status)?.label}
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
<<<<<<< HEAD
=======

export default TimeEntry;
>>>>>>> 5ab23cc1e1d41bdb87e83040f6bae0b812622797
