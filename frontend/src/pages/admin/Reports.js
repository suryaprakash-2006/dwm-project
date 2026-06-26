import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import "../../styles/theme.css";
import config from "../../config";

const today = new Date().toISOString().split("T")[0];

const StatusBadge = ({ status }) => {
  const map = {
    P:  { label: "Present",  bg: "#16a34a", text: "#fff" },
    L:  { label: "Leave",    bg: "#dc2626", text: "#fff" },
    OD: { label: "On Duty",  bg: "#d97706", text: "#fff" },
    HD: { label: "Half Day", bg: "#2563eb", text: "#fff" },
  };
  const s = map[status] || { label: status, bg: "#64748b", text: "#fff" };
  return (
    <span style={{ display: "inline-block", background: s.bg, color: s.text, fontSize: 13, fontWeight: 700, padding: "5px 14px", borderRadius: 20, minWidth: 80, textAlign: "center" }}>
      {s.label}
    </span>
  );
};

const formatHours = (value) => {
  const hours = Number(value);
  return Number.isFinite(hours) ? hours.toFixed(2) : "0.00";
};

export default function Reports() {
  const [employees, setEmployees] = useState([]);
  const [workRows,  setWorkRows]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [dateError, setDateError] = useState("");

  const adminUser = JSON.parse(localStorage.getItem("user") || "{}");
  const dept = adminUser.department || adminUser.dept || "";

  // Temp filter inputs
  const [tempEmp,      setTempEmp]      = useState("all");
  const [tempDateFrom, setTempDateFrom] = useState("");
  const [tempDateTo,   setTempDateTo]   = useState("");

  // Active (applied) filter state
  const [filterEmp, setFilterEmp] = useState("all");
  const [dateFrom,  setDateFrom]  = useState("");
  const [dateTo,    setDateTo]    = useState("");

  // Load employees scoped to admin's department
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token   = localStorage.getItem("token");
        const headers = { "Authorization": `Bearer ${token}` };
        const empRes  = await fetch(`${config.API_URL}/employees`, { headers });
        if (empRes.ok && mounted) {
          const emps = await empRes.json();
          setEmployees(emps.filter(e => e.dept === dept));
        }
      } catch (err) {
        console.warn("Failed to load employees", err);
      }
    })();
    return () => { mounted = false; };
  }, [dept]);

  // Fetch work-summary with filters
  const fetchReports = async (empId, df, dt) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const qs    = new URLSearchParams();
      if (empId && empId !== "all") qs.set("emp_id", empId);
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

  useEffect(() => { fetchReports("all", "", ""); }, []);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    if (tempDateFrom && tempDateFrom > today) { setDateError("Start date cannot be in the future."); return false; }
    if (tempDateTo   && tempDateTo   > today) { setDateError("End date cannot be in the future.");   return false; }
    if (tempDateFrom && tempDateTo && tempDateFrom > tempDateTo) { setDateError("Start date must be ≤ end date."); return false; }
    setDateError("");
    return true;
  };

  // ── Search ──────────────────────────────────────────────────────────────────
  const handleSearch = () => {
    if (!validate()) return;
    setFilterEmp(tempEmp);
    setDateFrom(tempDateFrom);
    setDateTo(tempDateTo);
    fetchReports(tempEmp, tempDateFrom, tempDateTo);
  };

  // ── Reset ───────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setTempEmp("all"); setTempDateFrom(""); setTempDateTo(""); setDateError("");
    setFilterEmp("all"); setDateFrom(""); setDateTo("");
    fetchReports("all", "", "");
  };

  const filtered = filterEmp !== "all"
    ? workRows.filter(r => r.empId === filterEmp)
    : workRows;

  const selectedEmpInfo = filterEmp !== "all" ? employees.find(e => e.id === filterEmp) : null;
  const selectedEmpName = selectedEmpInfo?.name;

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filtered, null, 2));
    const a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `dwm_admin_report_${today}.json`);
    document.body.appendChild(a); a.click(); a.remove();
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const regularHours = filtered.reduce((sum, row) => sum + (Number(row.regularHours) || 0), 0);
    const overtimeHours = filtered.reduce((sum, row) => sum + (Number(row.overtimeHours) || 0), 0);
    const totalHours = filtered.reduce((sum, row) => sum + (Number(row.totalHours) || 0), 0);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Department Reports", 40, 40);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const employeeLines = selectedEmpInfo
      ? [
          `Employee: ${selectedEmpInfo.name || "—"}`,
          `Designation: ${selectedEmpInfo.designation || "—"}`,
          `Email: ${selectedEmpInfo.email || "—"}`,
          `Department: ${selectedEmpInfo.dept || dept || "—"}`,
        ]
      : [
          `Department: ${dept || "—"}`,
          `Employee: All Employees`,
        ];
    employeeLines.forEach((line, index) => doc.text(line, 40, 64 + (index * 14)));

    autoTable(doc, {
      startY: 130,
      head: [["DATE", "EMP NO", "EMPLOYEE", "DEPARTMENT", "DESIGNATION", "CATEGORY", "SUB CATEGORY", "REG HRS", "OT HRS", "TOTAL HRS", "STATUS", "REMARKS"]],
      body: filtered.map((row) => [
        row.date,
        row.empNo || row.empId,
        row.employee,
        row.dept,
        row.designation || "—",
        row.category,
        row.subCategory || "—",
        formatHours(row.regularHours),
        formatHours(row.overtimeHours),
        formatHours(row.totalHours),
        row.status,
        row.remarks || "—",
      ]),
      margin: { left: 40, right: 40 },
      styles: { fontSize: 6.5, cellPadding: 3, overflow: "linebreak", valign: "middle" },
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

    doc.save(`dwm_admin_report_${today}.pdf`);
  };

  const exportExcel = () => {
    const headers = ["DATE", "EMP NO", "EMPLOYEE", "DESIGNATION", "CATEGORY", "SUB CATEGORY", "REG HOURS", "OT HOURS", "TOTAL HOURS", "STATUS", "REMARKS"];
    const rows = filtered.map(r => [
      r.date || "", r.empNo || r.empId || "", r.employee || "",
      r.designation || "", r.category || "", r.subCategory || "",
      r.regularHours, r.overtimeHours, r.totalHours, r.status || "", r.remarks || ""
    ]);
    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    // Set column widths: auto-size based on max content length
    const colWidths = headers.map((h, ci) => {
      const maxLen = Math.max(
        h.length,
        ...rows.map(row => String(row[ci] ?? "").length)
      );
      return { wch: Math.min(Math.max(maxLen + 4, 12), 80) };
    });
    // Remarks column (index 10) should be significantly wider
    colWidths[10] = { wch: Math.max(colWidths[10].wch, 60) };
    ws["!cols"] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Admin Report");
    XLSX.writeFile(wb, `dwm_admin_report_${today}.xlsx`);
  };

  return (
    <div className="page">
      <h3>Department Reports</h3>

      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#dbeafe", border: "1px solid #bfdbfe", borderRadius: 8, padding: "6px 14px", marginBottom: 16 }}>
        <span>🏢</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1d4ed8" }}>Department: {dept}</span>
        <span style={{ fontSize: 11, color: "#93c5fd", marginLeft: 8 }}>— Showing Approved entries only</span>
      </div>

      {/* Employee info card */}
      {selectedEmpInfo && (
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 20px", marginBottom: 20, display: "flex", gap: 28, flexWrap: "wrap", alignItems: "center" }}>
          <div><span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Employee</span><p style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: 14 }}>{selectedEmpInfo.name}</p></div>
          <div><span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Designation</span><p style={{ margin: 0, fontWeight: 600, color: "#334155", fontSize: 13 }}>{selectedEmpInfo.designation}</p></div>
          <div><span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Email</span><p style={{ margin: 0, fontWeight: 600, color: "#334155", fontSize: 13 }}>{selectedEmpInfo.email}</p></div>
        </div>
      )}

      {/* Filters */}
      <div className="row mb-3 g-3">
        <div className="col-md-3">
          <label style={{ fontWeight: 600, fontSize: 12.5 }}>Employee</label>
          <select className="form-select" value={tempEmp} onChange={e => setTempEmp(e.target.value)}>
            <option value="all">— All Employees —</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.empNo})</option>)}
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
        <div className="col-md-3 d-flex align-items-end gap-2">
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
      {filterEmp !== "all" && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <span style={{ background: "#dbeafe", color: "#1d4ed8", fontSize: 12, fontWeight: 600, padding: "3px 12px", borderRadius: 20, display: "flex", alignItems: "center", gap: 6 }}>
            👤 {selectedEmpName}
            <button onClick={() => setFilterEmp("all")} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#1d4ed8", fontWeight: 900, padding: 0, fontSize: 14 }}>×</button>
          </span>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="table table-bordered mb-0 align-middle">
            <thead>
              <tr>
                <th>DATE</th><th>EMP NO</th><th>EMPLOYEE</th>
                <th>DESIGNATION</th><th>CATEGORY</th><th>SUB CATEGORY</th>
                <th>REG HRS</th><th>OT HRS</th><th>TOTAL HRS</th><th>STATUS</th><th>REMARKS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: 30 }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: "center", color: "#94a3b8", padding: "28px", fontSize: 14 }}>No records found.</td></tr>
              ) : filtered.map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: "#334155" }}>{r.date}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 12, color: "#94a3b8" }}>{r.empNo || r.empId}</td>
                  <td style={{ fontWeight: 600, color: "#0f172a" }}>{r.employee}</td>
                  <td style={{ fontSize: 12, color: "#475569" }}>{r.designation || "—"}</td>
                  <td style={{ fontSize: 12, color: "#475569" }}>{r.category}</td>
                  <td style={{ fontSize: 12, color: "#475569" }}>{r.subCategory || "—"}</td>
                  <td style={{ fontWeight: 600, fontFamily: "monospace" }}>{r.regularHours}</td>
                  <td style={{ fontWeight: 600, fontFamily: "monospace", color: r.overtimeHours > 0 ? "#d97706" : "#94a3b8" }}>{r.overtimeHours}</td>
                  <td style={{ fontWeight: 700, fontFamily: "monospace" }}>{r.totalHours}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td style={{ fontSize: 12, color: "#475569", maxWidth: 150, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={r.remarks}>{r.remarks || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="d-flex gap-2 mt-3">
        <button onClick={exportJSON}  className="btn btn-outline-primary btn-sm">Export JSON</button>
        <button onClick={exportPDF}   className="btn btn-outline-primary btn-sm">Export PDF</button>
        <button onClick={exportExcel} className="btn btn-outline-primary btn-sm">Export Excel (.xlsx)</button>
      </div>
    </div>
  );
}
