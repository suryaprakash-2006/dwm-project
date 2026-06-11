import React, { useState, useEffect } from "react";
import "../../styles/theme.css";
import config from "../../config";

const EMPTY_FORM = { name: "", description: "", active: true };

export default function WorkCategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [editId, setEditId]         = useState(null);
  const [errors, setErrors]         = useState({});
  const [success, setSuccess]       = useState("");
  const [error, setError]           = useState("");

  const token = () => localStorage.getItem("token");
  const headers = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token()}`
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${config.API_URL}/work-categories`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (res.ok) setCategories(await res.json());
    } catch {
      setError("Failed to load work categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (form.name.trim().length < 2) e.name = "Name must be at least 2 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSuccess(""); setError("");

    try {
      const method = editId ? "PUT" : "POST";
      const url    = editId
        ? `${config.API_URL}/work-categories/${editId}`
        : `${config.API_URL}/work-categories`;

      const res = await fetch(url, {
        method,
        headers: headers(),
        body: JSON.stringify({ name: form.name.trim(), description: form.description.trim(), active: form.active })
      });

      if (res.ok) {
        setSuccess(editId ? "Work category updated." : "Work category created.");
        setForm(EMPTY_FORM); setEditId(null); setErrors({});
        await fetchCategories();
        setTimeout(() => setSuccess(""), 4000);
      } else {
        const data = await res.json();
        setError(data.detail || "Operation failed.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
  };

  const handleEdit = (cat) => {
    setEditId(cat.id);
    setForm({ name: cat.name, description: cat.description || "", active: cat.active ?? true });
    setSuccess(""); setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggle = async (cat) => {
    try {
      const res = await fetch(`${config.API_URL}/work-categories/${cat.id}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({ active: !cat.active })
      });
      if (res.ok) { await fetchCategories(); }
      else { const d = await res.json(); setError(d.detail || "Toggle failed."); }
    } catch {
      setError("Network error during toggle.");
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete work category "${cat.name}"?\nThis cannot be undone.`)) return;
    try {
      const res = await fetch(`${config.API_URL}/work-categories/${cat.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (res.ok) { setSuccess(`"${cat.name}" deleted.`); await fetchCategories(); }
      else { const d = await res.json(); setError(d.detail || "Delete failed."); }
    } catch {
      setError("Network error during delete.");
    }
  };

  const handleCancel = () => { setEditId(null); setForm(EMPTY_FORM); setErrors({}); setSuccess(""); setError(""); };

  return (
    <div className="page">
      <div className="container-fluid">
        <h3 style={{ marginBottom: 4 }}>Work Category Management</h3>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
          Global work categories — managed by <strong>Super Admin</strong> only.
          Sub-categories assigned by department admins reference these categories.
        </p>

        {/* Info Banner */}
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontSize: 13, color: "#1e40af" }}>
          ℹ️ <strong>Business Hierarchy:</strong> Work Category → Sub Category → Time Entry → Reports → Analytics
        </div>

        {success && <div className="alert alert-success">✅ {success}</div>}
        {error   && <div className="alert alert-danger">⚠️ {error}</div>}

        {/* Form Card */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "24px 28px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 24 }}>
          <h6 style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 18 }}>
            {editId ? "✏️ Edit Work Category" : "➕ Add New Work Category"}
          </h6>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-4">
                <label style={{ fontWeight: 600, fontSize: 12.5, display: "block", marginBottom: 5, color: "#475569" }}>
                  Name <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  id="wc-name"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Improvements / Development"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={{ borderColor: errors.name ? "#dc2626" : undefined }}
                />
                {errors.name && <p style={{ fontSize: 12, color: "#dc2626", margin: "4px 0 0", fontWeight: 600 }}>⚠️ {errors.name}</p>}
              </div>
              <div className="col-md-5">
                <label style={{ fontWeight: 600, fontSize: 12.5, display: "block", marginBottom: 5, color: "#475569" }}>
                  Description
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Optional description..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="col-md-2" style={{ display: "flex", alignItems: "flex-end" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", paddingBottom: 6 }}>
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: "#2563eb" }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Active</span>
                </label>
              </div>
              <div className="col-md-1 d-flex align-items-end gap-2">
                <button id="wc-submit-btn" type="submit" className="btn btn-primary btn-sm">
                  {editId ? "Update" : "Add"}
                </button>
                {editId && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleCancel}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h6 style={{ fontWeight: 700, margin: 0, fontSize: 14, color: "#0f172a" }}>
              Work Categories ({categories.length})
            </h6>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>
              {categories.filter(c => c.active).length} active
            </span>
          </div>
          <div className="table-responsive">
            <table className="table table-bordered mb-0 align-middle">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>ID</th>
                  <th>NAME</th>
                  <th>DESCRIPTION</th>
                  <th style={{ width: 90, textAlign: "center" }}>STATUS</th>
                  <th style={{ width: 160, textAlign: "center" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: 30, color: "#94a3b8" }}>Loading…</td></tr>
                ) : categories.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: 30, color: "#94a3b8" }}>No work categories found. Add one above.</td></tr>
                ) : categories.map(cat => (
                  <tr key={cat.id} style={{ opacity: cat.active ? 1 : 0.55 }}>
                    <td style={{ fontFamily: "monospace", fontSize: 12, color: "#94a3b8" }}>{cat.id}</td>
                    <td style={{ fontWeight: 600, color: "#0f172a" }}>{cat.name}</td>
                    <td style={{ fontSize: 13, color: "#64748b" }}>{cat.description || <em style={{ color: "#cbd5e1" }}>—</em>}</td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{
                        display: "inline-block",
                        background: cat.active ? "#dcfce7" : "#fee2e2",
                        color: cat.active ? "#16a34a" : "#dc2626",
                        fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20
                      }}>
                        {cat.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        <button
                          className="btn btn-outline-primary btn-sm"
                          style={{ fontSize: 11, padding: "3px 10px" }}
                          onClick={() => handleEdit(cat)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          style={{ fontSize: 11, padding: "3px 10px" }}
                          onClick={() => handleToggle(cat)}
                        >
                          {cat.active ? "Deactivate" : "Activate"}
                        </button>
                        {cat.name !== "Unassigned" && (
                          <button
                            className="btn btn-outline-danger btn-sm"
                            style={{ fontSize: 11, padding: "3px 10px" }}
                            onClick={() => handleDelete(cat)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Canonical List Note */}
        <div style={{ marginTop: 16, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 16px", fontSize: 12.5, color: "#64748b" }}>
          <strong>Canonical Work Categories:</strong> Task Against Order · Improvements / Development ·
          Training · Complaints · New Enquiry / RFQ · Travel / OD · Internal Activities · LBE · Unassigned
        </div>
      </div>
    </div>
  );
}
