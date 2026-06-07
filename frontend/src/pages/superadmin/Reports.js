import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "../../styles/theme.css";
import config from "../../config";

const today = new Date().toISOString().split("T")[0];

const ApprovalBadge = ({ status }) => {
  const map = {
    Approved: { bg: "#dcfce7", c: "#16a34a" },
    Pending:  { bg: "#fef3c7", c: "#d97706" },
    Rejected: { bg: "#fee2e2", c: "#dc2626" },
  };
  const s = map[status] || { bg: "#e2e8f0", c: "#475569" };
  return (
    <span style={{ display: "inline-block", background: s.bg, color: s.c, fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>
      {status}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    P:  { label: "Present",  bg: "#16a34a", text: "#fff" },
    L:  { label: "Leave",    bg: "#dc2626", text: "#fff" },
    OD: { label: "On Duty",  bg: "#d97706", text: "#fff" },
    HD: { label: "Half Day", bg: "#2563eb", text: "#fff" },
  };
  const s = map[status] || { label: status, bg: "#64748b", text: "#fff" };
  return (
    <span style={{ display: "inline-block", background: s.bg, color: s.text, fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, minWidth: 76, textAlign: "center" }}>
      {s.label}
    </span>
  );
};

const formatHours = (value) => {
  const hours = Number(value);
  return Number.isFinite(hours) ? hours.toFixed(2) : "0.00";
};

export default function Reports() {
  const [departments, setDepartments] = useState([]);
  const [employees,   setEmployees]   = useState([]);
  const [workRows,    setWorkRows]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [dateError,   setDateError]   = useState("");

  // Temp filter inputs
  const [tempEmp,      setTempEmp]      = useState("all");
  const [tempDept,     setTempDept]     = useState("All Departments");
  const [tempDateFrom, setTempDateFrom] = useState("");
  const [tempDateTo,   setTempDateTo]   = useState("");

  // Active filter state (applied on Search)
  const [filterEmp,  setFilterEmp]  = useState("all");
  const [filterDept, setFilterDept] = useState("All Departments");
  const [dateFrom,   setDateFrom]   = useState("");
  const [dateTo,     setDateTo]     = useState("");

  // Fetch departments and employees on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token   = localStorage.getItem("token");
        const headers = { "Authorization": `Bearer ${token}` };

        const deptRes = await fetch(`${config.API_URL}/departments`, { headers });
        if (deptRes.ok && mounted) setDepartments(await deptRes.json());

        const empRes = await fetch(`${config.API_URL}/employees`, { headers });
        if (empRes.ok && mounted) setEmployees(await empRes.json());
      } catch (err) {
        console.warn("Failed to load dropdown data", err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Fetch work-summary from API with filters
  const fetchReports = async (dept, empId, df, dt) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const qs    = new URLSearchParams();
      // Backend only returns Approved entries for work-summary
      if (dept && dept !== "All Departments") qs.set("dept", dept);
      if (empId && empId !== "all")           qs.set("emp_id", empId);
      if (df) qs.set("date_from", df);
      if (dt) qs.set("date_to",   dt);
      const url = `${config.API_URL}/reports/work-summary${qs.toString() ? "?" + qs.toString() : ""}`;
      const res = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) setWorkRows(await res.json());
    } catch (err) {
      console.warn("Failed to load work summary", err);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => { fetchReports("All Departments", "all", "", ""); }, []);

  const empsForDept = tempDept === "All Departments"
    ? employees
    : employees.filter(e => e.dept === tempDept);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    if (tempDateFrom && tempDateFrom > today) { setDateError("Start date cannot be in the future."); return false; }
    if (tempDateTo   && tempDateTo   > today) { setDateError("End date cannot be in the future.");   return false; }
    if (tempDateFrom && tempDateTo && tempDateFrom > tempDateTo) { setDateError("Start date must be ≤ end date."); return false; }
    setDateError("");
    return true;
  };

  // ── Search: applies filters and re-fetches from API ─────────────────────────
  const handleSearch = () => {
    if (!validate()) return;
    setFilterEmp(tempEmp);
    setFilterDept(tempDept);
    setDateFrom(tempDateFrom);
    setDateTo(tempDateTo);
    fetchReports(tempDept, tempEmp, tempDateFrom, tempDateTo);
  };

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setTempEmp("all"); setTempDept("All Departments"); setTempDateFrom(""); setTempDateTo(""); setDateError("");
    setFilterEmp("all"); setFilterDept("All Departments"); setDateFrom(""); setDateTo("");
    fetchReports("All Departments", "all", "", "");
  };

  const handleDeptChange = (dept) => { setTempDept(dept); setTempEmp("all"); };

  // Client-side filtering (on top of API results) for emp filter when not sent to API
  const filtered = filterEmp !== "all"
    ? workRows.filter(r => r.empId === filterEmp)
    : workRows;

  const selectedEmpName = employees.find(e => e.id === filterEmp)?.name;
  const selectedEmpInfo = filterEmp !== "all" ? employees.find(e => e.id === filterEmp) : null;

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filtered, null, 2));
    const a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `dwm_report_${today}.json`);
    document.body.appendChild(a); a.click(); a.remove();
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const regularHours = filtered.reduce((sum, row) => sum + (Number(row.regularHours) || 0), 0);
    const overtimeHours = filtered.reduce((sum, row) => sum + (Number(row.overtimeHours) || 0), 0);
    const totalHours = filtered.reduce((sum, row) => sum + (Number(row.totalHours) || 0), 0);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Reports", 40, 40);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const employeeLines = selectedEmpInfo
      ? [
          `Employee: ${selectedEmpInfo.name || "—"}`,
          `Designation: ${selectedEmpInfo.designation || "—"}`,
          `Email: ${selectedEmpInfo.email || "—"}`,
          `Department: ${selectedEmpInfo.dept || "—"}`,
        ]
      : [
          `Department: All Departments`,
          `Employee: All Employees`,
        ];
    employeeLines.forEach((line, index) => doc.text(line, 40, 64 + (index * 14)));

    autoTable(doc, {
      startY: 130,
      head: [["DATE", "EMP NO", "EMPLOYEE", "DEPARTMENT", "DESIGNATION", "CATEGORY", "REG HRS", "OT HRS", "TOTAL HRS", "APPROVAL STATUS"]],
      body: filtered.map((row) => [
        row.date,
        row.empNo || row.empId,
        row.employee,
        row.dept,
        row.designation || "—",
        row.category,
        formatHours(row.regularHours),
        formatHours(row.overtimeHours),
        formatHours(row.totalHours),
        row.approvalStatus,
      ]),
      margin: { left: 40, right: 40 },
      styles: { fontSize: 7.5, cellPadding: 4, overflow: "linebreak", valign: "middle" },
      headStyles: { fillColor: [29, 78, 216], textColor: 255 },
    });

    const summaryStartY = doc.lastAutoTable.finalY + 18;
    autoTable(doc, {
      startY: summaryStartY,
      head: [["Summary", "Value"]],
      body: [
        ["Regular Hours", formatHours(regularHours)],
        ["Overtime Hours", formatHours(overtimeHours)],
        ["Total Hours", formatHours(totalHours)],
      ],
      margin: { left: 40, right: 40 },
      tableWidth: 260,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    });

    doc.save(`dwm_report_${today}.pdf`);
  };

  const exportExcel = () => {
    const headers = ["DATE", "EMP ID", "EMPLOYEE", "DEPARTMENT", "DESIGNATION", "CATEGORY", "REG HOURS", "OT HOURS", "TOTAL HOURS", "APPROVAL STATUS"];
    const rows = filtered.map(r => [
      r.date ? `="${r.date}"` : "", r.empNo || r.empId, r.employee, r.dept, r.designation || "—",
      r.category, r.regularHours, r.overtimeHours, r.totalHours, r.approvalStatus
    ]);
    const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const a = document.createElement("a");
    a.setAttribute("href", encodeURI(csv));
    a.setAttribute("download", `dwm_report_${today}.csv`);
    document.body.appendChild(a); a.click(); a.remove();
  };

  return (
    <div className="page">
      <h3>Reports</h3>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>Showing <strong>Approved</strong> entries only.</p>

      {/* Employee info card */}
      {selectedEmpInfo && (
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 20px", marginBottom: 20, display: "flex", gap: 28, flexWrap: "wrap", alignItems: "center" }}>
          <div><span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Employee</span><p style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: 14 }}>{selectedEmpInfo.name}</p></div>
          <div><span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Designation</span><p style={{ margin: 0, fontWeight: 600, color: "#334155", fontSize: 13 }}>{selectedEmpInfo.designation}</p></div>
          <div><span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Email</span><p style={{ margin: 0, fontWeight: 600, color: "#334155", fontSize: 13 }}>{selectedEmpInfo.email}</p></div>
          <div><span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Department</span><p style={{ margin: 0, fontWeight: 600, color: "#334155", fontSize: 13 }}>{selectedEmpInfo.dept}</p></div>
        </div>
      )}

      {/* Filter Row */}
      <div className="row mb-3 g-3">
        <div className="col-md-2">
          <label style={{ fontWeight: 600, fontSize: 12.5 }}>Department</label>
          <select className="form-select" value={tempDept} onChange={e => handleDeptChange(e.target.value)}>
            <option>All Departments</option>
            {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
        </div>
        <div className="col-md-2">
          <label style={{ fontWeight: 600, fontSize: 12.5 }}>Employee</label>
          <select className="form-select" value={tempEmp} onChange={e => setTempEmp(e.target.value)}>
            <option value="all">— All Employees —</option>
            {empsForDept.map(e => <option key={e.id} value={e.id}>{e.name} ({e.empNo})</option>)}
          </select>
        </div>
        <div className="col-md-2">
          <label style={{ fontWeight: 600, fontSize: 12.5 }}>From Date</label>
          <input type="date" className="form-control" max={today}
            value={tempDateFrom} onChange={e => { setTempDateFrom(e.target.value); setDateError(""); }} />
        </div>
        <div className="col-md-2">
          <label style={{ fontWeight: 600, fontSize: 12.5 }}>To Date</label>
          <input type="date" className="form-control" max={today}
            value={tempDateTo} onChange={e => { setTempDateTo(e.target.value); setDateError(""); }} />
        </div>
        <div className="col-md-2 d-flex align-items-end gap-2">
          <button className="btn btn-primary btn-sm w-50" onClick={handleSearch} disabled={loading}>
            {loading ? "…" : "Search"}
          </button>
          <button className="btn btn-secondary btn-sm w-50" onClick={handleReset} disabled={loading}>
            Reset
          </button>
        </div>
      </div>

      {dateError && (
        <div style={{ color: "#dc2626", fontSize: 12.5, marginBottom: 10, fontWeight: 600 }}>⚠️ {dateError}</div>
      )}

      {/* Active filter chips */}
      {(filterEmp !== "all" || filterDept !== "All Departments" || dateFrom || dateTo) && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
          {filterDept !== "All Departments" && (
            <span style={{ background: "#dcfce7", color: "#16a34a", fontSize: 12, fontWeight: 600, padding: "3px 12px", borderRadius: 20, display: "flex", alignItems: "center", gap: 6 }}>
              🏢 {filterDept}<button onClick={() => handleDeptChange("All Departments")} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#16a34a", fontWeight: 900, padding: 0 }}>×</button>
            </span>
          )}
          {filterEmp !== "all" && (
            <span style={{ background: "#dbeafe", color: "#1d4ed8", fontSize: 12, fontWeight: 600, padding: "3px 12px", borderRadius: 20, display: "flex", alignItems: "center", gap: 6 }}>
              👤 {selectedEmpName}<button onClick={() => setFilterEmp("all")} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#1d4ed8", fontWeight: 900, padding: 0 }}>×</button>
            </span>
          )}
          {dateFrom && <span style={{ background: "#f1f5f9", color: "#475569", fontSize: 12, fontWeight: 600, padding: "3px 12px", borderRadius: 20 }}>From: {dateFrom}</span>}
          {dateTo   && <span style={{ background: "#f1f5f9", color: "#475569", fontSize: 12, fontWeight: 600, padding: "3px 12px", borderRadius: 20 }}>To: {dateTo}</span>}
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="table table-bordered mb-0 align-middle">
            <thead>
              <tr>
                <th>DATE</th><th>EMP NO</th><th>EMPLOYEE</th>
                <th>DEPARTMENT</th><th>DESIGNATION</th>
                <th>CATEGORY</th>
                <th>REG HRS</th><th>OT HRS</th><th>TOTAL HRS</th>
                <th>ATTENDANCE</th><th>APPROVAL</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} style={{ textAlign: "center", padding: 30, color: "#94a3b8" }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={11} style={{ textAlign: "center", color: "#94a3b8", padding: "30px", fontSize: 14 }}>No records found for selected filters.</td></tr>
              ) : filtered.map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: "#334155" }}>{r.date}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 12, color: "#94a3b8" }}>{r.empNo}</td>
                  <td style={{ fontWeight: 600, color: "#0f172a" }}>{r.employee}</td>
                  <td style={{ color: "#475569", fontSize: 13 }}>{r.dept}</td>
                  <td style={{ fontSize: 12, color: "#475569" }}>{r.designation || "—"}</td>
                  <td style={{ fontSize: 12, color: "#475569" }}>{r.category}</td>
                  <td style={{ fontWeight: 600, fontFamily: "monospace" }}>{r.regularHours}</td>
                  <td style={{ fontWeight: 600, fontFamily: "monospace", color: r.overtimeHours > 0 ? "#d97706" : "#94a3b8" }}>{r.overtimeHours}</td>
                  <td style={{ fontWeight: 700, fontFamily: "monospace", color: "#0f172a" }}>{r.totalHours}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td><ApprovalBadge status={r.approvalStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="d-flex gap-2 mt-3">
        <button onClick={exportJSON}  className="btn btn-outline-primary btn-sm">Export JSON</button>
        <button onClick={exportPDF}   className="btn btn-outline-primary btn-sm">Export PDF</button>
        <button onClick={exportExcel} className="btn btn-outline-primary btn-sm">Export Excel (CSV)</button>
      </div>
    </div>
  );
}
