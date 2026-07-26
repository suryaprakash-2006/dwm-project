import React, { useState, useEffect } from "react";
import config from "../config";

const SHIFT_OPTIONS = ["A", "B", "C"];
const STATUS_OPTIONS = [
  { value: "P",  label: "Present" },
  { value: "HD", label: "Half Day" },
  { value: "L",  label: "Leave" },
  { value: "OD", label: "On Duty" },
  { value: "AB", label: "Absent" }
];

export default function EditEntryModal({ entry, onClose, onSave }) {
  const [formData, setFormData] = useState({
    shift: entry.shift || "A",
    status: entry.status || "P",
    workCategoryId: entry.workCategoryId || "",
    category: entry.category || "",
    subCategoryId: entry.subCategoryId || "",
    subCategory: entry.subCategory || "",
    regularMins: entry.regularMins || 0,
    overtimeMins: entry.overtimeMins || 0,
    remarks: entry.remarks || ""
  });

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  // Load Work Categories
  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${config.API_URL}/work-categories`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setCategories(data))
      .catch(() => {});
  }, []);

  // Load Sub Categories dynamically based on selected workCategoryId
  useEffect(() => {
    if (!formData.workCategoryId) {
      setSubCategories([]);
      return;
    }
    const token = localStorage.getItem("token");
    fetch(`${config.API_URL}/sub-categories?workCategoryId=${formData.workCategoryId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setSubCategories(data))
      .catch(() => {});
  }, [formData.workCategoryId]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (e) => {
    const wcId = e.target.value;
    const cat = categories.find(c => String(c.id) === String(wcId));
    setFormData(prev => ({
      ...prev,
      workCategoryId: wcId ? Number(wcId) : "",
      category: cat ? cat.name : "",
      subCategoryId: "",
      subCategory: ""
    }));
  };

  const handleSubCategoryChange = (e) => {
    const scId = e.target.value;
    const sub = subCategories.find(s => String(s.id) === String(scId));
    setFormData(prev => ({
      ...prev,
      subCategoryId: scId ? Number(scId) : "",
      subCategory: sub ? sub.name : ""
    }));
  };

  const isAbsent = formData.status === "AB";

  // Inline Validation Logic
  const errors = {};
  if (!isAbsent) {
    if (!formData.workCategoryId) {
      errors.workCategoryId = "Work Category is required.";
    }
    if (!formData.subCategoryId || !formData.subCategory) {
      errors.subCategoryId = "Sub Category is required.";
    }
    if (formData.regularMins === undefined || formData.regularMins === null || formData.regularMins < 0) {
      errors.regularMins = "Regular mins must be at least 0.";
    } else if (formData.regularMins > 480) {
      errors.regularMins = "Maximum allowed is 480 minutes (8 hours).";
    }
    if (formData.overtimeMins === undefined || formData.overtimeMins === null || formData.overtimeMins < 0) {
      errors.overtimeMins = "Overtime mins must be at least 0.";
    } else if (formData.overtimeMins > 480) {
      errors.overtimeMins = "Maximum allowed is 480 minutes (8 hours).";
    }
    const totalMins = (formData.regularMins || 0) + (formData.overtimeMins || 0);
    if (totalMins === 0) {
      errors.hours = "Please enter at least some hours worked.";
    } else if (totalMins > 960) {
      errors.hours = "Total daily hours cannot exceed 960 minutes (16 hours).";
    }
  }
  if (!formData.remarks || !formData.remarks.trim()) {
    errors.remarks = "Remarks are required.";
  }

  const hasErrors = Object.keys(errors).length > 0;

  const handleSubmit = async () => {
    if (hasErrors) return;
    setLoading(true);
    setSubmitError("");
    setSubmitSuccess("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${config.API_URL}/time-entries/${entry.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSubmitSuccess("Entry updated successfully.");
        setTimeout(() => {
          onSave();
        }, 1200);
      } else {
        const err = await res.json();
        setSubmitError(err.detail || "Failed to update entry.");
      }
    } catch (error) {
      setSubmitError("Error updating entry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
    }}>
      <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", width: "600px", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h5 style={{ margin: 0 }}>Edit Time Entry</h5>
          <button onClick={onClose} style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}>&times;</button>
        </div>

        {submitError && (
          <div className="alert alert-danger" style={{ fontSize: 13.5, padding: "8px 12px", marginBottom: 16 }}>
            ⚠️ {submitError}
          </div>
        )}
        {submitSuccess && (
          <div className="alert alert-success" style={{ fontSize: 13.5, padding: "8px 12px", marginBottom: 16 }}>
            ✅ {submitSuccess}
          </div>
        )}

        <div className="row g-3">
          <div className="col-md-6">
            <label style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Shift</label>
            <select className="form-select" value={formData.shift} onChange={e => handleChange("shift", e.target.value)}>
              {SHIFT_OPTIONS.map(s => <option key={s} value={s}>Shift {s}</option>)}
            </select>
          </div>
          <div className="col-md-6">
            <label style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Status</label>
            <select className="form-select" value={formData.status} onChange={e => handleChange("status", e.target.value)}>
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div className="col-md-6">
            <label style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Work Category</label>
            <select
              className="form-select"
              style={errors.workCategoryId ? { borderColor: "#dc2626" } : {}}
              value={formData.workCategoryId || ""}
              onChange={handleCategoryChange}
              disabled={isAbsent}
            >
              <option value="">-- Select --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.workCategoryId && (
              <div style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>
                ❌ {errors.workCategoryId}
              </div>
            )}
          </div>
          <div className="col-md-6">
            <label style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Sub Category</label>
            <select
              className="form-select"
              style={errors.subCategoryId ? { borderColor: "#dc2626" } : {}}
              value={formData.subCategoryId || ""}
              onChange={handleSubCategoryChange}
              disabled={isAbsent || !formData.workCategoryId}
            >
              <option value="">-- Select --</option>
              {subCategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {errors.subCategoryId && (
              <div style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>
                ❌ {errors.subCategoryId}
              </div>
            )}
          </div>

          <div className="col-md-6">
            <label style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Regular Hours (Mins)</label>
            <input
              type="number"
              className="form-control"
              style={errors.regularMins ? { borderColor: "#dc2626" } : {}}
              value={formData.regularMins}
              onChange={e => handleChange("regularMins", Number(e.target.value))}
              disabled={isAbsent}
            />
            {errors.regularMins && (
              <div style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>
                ❌ {errors.regularMins}
              </div>
            )}
          </div>
          <div className="col-md-6">
            <label style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Overtime Hours (Mins)</label>
            <input
              type="number"
              className="form-control"
              style={errors.overtimeMins ? { borderColor: "#dc2626" } : {}}
              value={formData.overtimeMins}
              onChange={e => handleChange("overtimeMins", Number(e.target.value))}
              disabled={isAbsent}
            />
            {errors.overtimeMins && (
              <div style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>
                ❌ {errors.overtimeMins}
              </div>
            )}
          </div>

          {errors.hours && (
            <div className="col-12" style={{ color: "#dc2626", fontSize: 12, marginTop: 0 }}>
              ❌ {errors.hours}
            </div>
          )}

          <div className="col-12">
            <label style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Remarks</label>
            <textarea
              className="form-control"
              style={errors.remarks ? { borderColor: "#dc2626" } : {}}
              rows={4}
              value={formData.remarks}
              onChange={e => handleChange("remarks", e.target.value)}
            ></textarea>
            {errors.remarks && (
              <div style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>
                ❌ {errors.remarks}
              </div>
            )}
          </div>
        </div>

        <div className="d-flex justify-content-end gap-2 mt-4">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || hasErrors}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
