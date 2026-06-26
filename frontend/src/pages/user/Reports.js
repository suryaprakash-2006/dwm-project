import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import "../../styles/theme.css";
import config from "../../config";

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

const ShiftBadge = ({ shift }) => (
  <span style={{ display: "inline-block", background: "#dbeafe", color: "#1d4ed8", fontSize: 12, fontWeight: 700, padding: "3px 12px", borderRadius: 20 }}>
    Shift {shift}
  </span>
);

const formatHours = (value) => {
  const hours = Number(value);
  return Number.isFinite(hours) ? hours.toFixed(2) : "0.00";
};

export default function Reports() {
  const today = new Date().toISOString().split("T")[0];

  const [timeEntries, setTimeEntries] = useState([]);
  const [filtered, setFiltered] = useState([]);

  // Pending (temp) filter state
  const [tempShift,    setTempShift]    = useState("all");
  const [tempDateFrom, setTempDateFrom] = useState("");
  const [tempDateTo,   setTempDateTo]   = useState("");

  // Active filter state
  const [activeFilters, setActiveFilters] = useState({});
  const [loading,       setLoading]       = useState(false);
  const [dateError,     setDateError]     = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // -------- Data fetch --------
  const fetchEntries = async (params = {}) => {
    setLoading(true);
    try {
      const token   = localStorage.getItem("token");
      const headers = { "Authorization": `Bearer ${token}` };
      const qs      = new URLSearchParams();
      qs.set("approvalStatus", "Approved");
      if (params.dateFrom) qs.set("date_from", params.dateFrom);
      if (params.dateTo)   qs.set("date_to",   params.dateTo);
      if (params.shift && params.shift !== "all") qs.set("shift", params.shift);
      const url = `${config.API_URL}/time-entries${qs.toString() ? "?" + qs.toString() : ""}`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setTimeEntries(data);
        setFiltered(data);
      }
    } catch (err) {
      console.warn("Failed to fetch time entries for user reports", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEntries(); }, []); // eslint-disable-line

  // -------- Validation --------
  const validate = () => {
    if (tempDateFrom && tempDateFrom > today) { setDateError("Start date cannot be in the future."); return false; }
    if (tempDateTo   && tempDateTo   > today) { setDateError("End date cannot be in the future.");   return false; }
    if (tempDateFrom && tempDateTo && tempDateFrom > tempDateTo) { setDateError("Start date must be ≤ end date."); return false; }
    setDateError("");
    return true;
  };

  // -------- Search --------
  const handleSearch = () => {
    if (!validate()) return;
    const active = {};
    if (tempShift && tempShift !== "all") active["Shift"] = tempShift;
    if (tempDateFrom) active["From"] = tempDateFrom;
    if (tempDateTo)   active["To"]   = tempDateTo;
    setActiveFilters(active);
    fetchEntries({ dateFrom: tempDateFrom, dateTo: tempDateTo, shift: tempShift });
  };

  // -------- Reset --------
  const handleReset = () => {
    setTempShift("all");
    setTempDateFrom("");
    setTempDateTo("");
    setDateError("");
    setActiveFilters({});
    fetchEntries();
  };

  // -------- Exports --------
  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filtered, null, 2));
    const a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `dwm_my_report_${today}.json`);
    document.body.appendChild(a); a.click(); a.remove();
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const regularHours = filtered.reduce((sum, row) => sum + (Number(row.regularMins) || 0), 0) / 60;
    const overtimeHours = filtered.reduce((sum, row) => sum + (Number(row.overtimeMins) || 0), 0) / 60;
    const totalHours = regularHours + overtimeHours;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Monthly Reports", 40, 40);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const employeeLines = [
      `Employee: ${user.username || user.name || "—"}`,
      `Designation: ${user.designation || "—"}`,
      `Email: ${user.email || "—"}`,
      `Department: ${user.department || user.dept || "—"}`,
      `Emp ID: ${user.id || "—"}`,
    ];
    employeeLines.forEach((line, index) => doc.text(line, 40, 64 + (index * 14)));

    autoTable(doc, {
      startY: 144,
      head: [["DATE", "EMP NO", "SHIFT", "CATEGORY", "SUB CATEGORY", "REG HOURS", "OT HOURS", "STATUS", "REMARKS"]],
      body: filtered.map((row) => [
        row.date,
        row.empNo || row.empId || user.empNo || user.id,
        `Shift ${row.shift}`,
        row.category,
        row.subCategory || "—",
        formatHours((Number(row.regularMins) || 0) / 60),
        formatHours((Number(row.overtimeMins) || 0) / 60),
        row.status,
        row.remarks || "—",
      ]),
      margin: { left: 40, right: 40 },
      styles: { fontSize: 7, cellPadding: 4, overflow: "linebreak", valign: "middle" },
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

    doc.save(`dwm_my_report_${today}.pdf`);
  };

  const exportExcel = () => {
    const hdrs = ["DATE","EMP NO","SHIFT","CATEGORY","SUB CATEGORY","REG HOURS","OT HOURS","STATUS","REMARKS"];
    const rows = filtered.map(r => [
      r.date || "",
      r.empNo || r.empId || user.empNo || user.id || "",
      r.shift || "", r.category || "", r.subCategory || "",
      (r.regularMins / 60.0).toFixed(2),
      (r.overtimeMins / 60.0).toFixed(2),
      r.status || "", r.remarks || ""
    ]);
    const wsData = [hdrs, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const colWidths = hdrs.map((h, ci) => {
      const maxLen = Math.max(h.length, ...rows.map(row => String(row[ci] ?? "").length));
      return { wch: Math.min(Math.max(maxLen + 4, 12), 80) };
    });
    // Remarks column (index 8) should be significantly wider
    colWidths[8] = { wch: Math.max(colWidths[8].wch, 60) };
    ws["!cols"] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "My Report");
    XLSX.writeFile(wb, `dwm_my_report_${today}.xlsx`);
  };

  return (
    <div className="page">
      <h3>Monthly Reports</h3>

      {/* Employee info card */}
      <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, padding:"14px 20px", marginBottom:20, display:"flex", gap:28, flexWrap:"wrap", alignItems:"center" }}>
        <div>
          <span style={{ fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase" }}>Employee</span>
          <p style={{ margin:0, fontWeight:700, color:"#0f172a", fontSize:14 }}>{user.username || user.name}</p>
        </div>
        <div>
          <span style={{ fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase" }}>Designation</span>
          <p style={{ margin:0, fontWeight:600, color:"#334155", fontSize:13 }}>{user.designation || "—"}</p>
        </div>
        <div>
          <span style={{ fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase" }}>Email</span>
          <p style={{ margin:0, fontWeight:600, color:"#334155", fontSize:13 }}>{user.email || "—"}</p>
        </div>
        <div>
          <span style={{ fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase" }}>Department</span>
          <p style={{ margin:0, fontWeight:600, color:"#334155", fontSize:13 }}>{user.department || user.dept || "—"}</p>
        </div>
        <div>
          <span style={{ fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase" }}>Emp ID</span>
          <p style={{ margin:0, fontFamily:"monospace", fontWeight:600, color:"#94a3b8", fontSize:13 }}>{user.id || "—"}</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, padding:"14px 20px", marginBottom:16 }}>
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <label style={{ margin:0, fontWeight:600, fontSize:13, color:"#475569" }}>Shift:</label>
          <select className="form-select" style={{ width:160 }} value={tempShift} onChange={e => setTempShift(e.target.value)}>
            <option value="all">All Shifts</option>
            <option value="A">Shift A</option>
            <option value="B">Shift B</option>
            <option value="C">Shift C</option>
          </select>

          <label style={{ margin:"0 0 0 8px", fontWeight:600, fontSize:13, color:"#475569" }}>From:</label>
          <input type="date" className="form-control" style={{ width:150 }} max={today}
            value={tempDateFrom} onChange={e => { setTempDateFrom(e.target.value); setDateError(""); }} />

          <span style={{ fontSize:12.5, color:"#94a3b8" }}>to</span>
          <input type="date" className="form-control" style={{ width:150 }} max={today}
            value={tempDateTo} onChange={e => { setTempDateTo(e.target.value); setDateError(""); }} />

          <button className="btn btn-primary btn-sm" onClick={handleSearch} disabled={loading}>
            {loading ? "Loading…" : "Search"}
          </button>
          <button className="btn btn-outline-secondary btn-sm" onClick={handleReset} disabled={loading}>
            Reset
          </button>
          {loading && (
            <div className="spinner-border spinner-border-sm text-primary ms-1" role="status">
              <span className="visually-hidden">Loading…</span>
            </div>
          )}
        </div>

        {dateError && (
          <div style={{ color:"#dc2626", fontSize:12.5, marginTop:8, fontWeight:600 }}>
            ⚠️ {dateError}
          </div>
        )}
      </div>

      {/* Active filter summary */}
      {Object.keys(activeFilters).length > 0 && (
        <div style={{ marginBottom:14, padding:"10px 16px", background:"#dbeafe", borderRadius:8, border:"1px solid #93c5fd", fontSize:13, color:"#1d4ed8" }}>
          <strong>Showing data for:</strong>{" "}
          {Object.entries(activeFilters).map(([k, v]) => `${k}: ${v}`).join(" | ")}
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="table table-bordered mb-0 align-middle">
            <thead>
              <tr>
                <th>DATE</th>
                <th>EMP NO</th>
                <th>SHIFT</th>
                <th>CATEGORY</th>
                <th>SUB CATEGORY</th>
                <th>REG HOURS</th>
                <th>OT HOURS</th>
                <th>STATUS</th>
                <th>REMARKS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign:"center", color:"#94a3b8", padding:28 }}>
                    {loading ? "Loading…" : "No records found."}
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight:600, color:"#334155" }}>{r.date}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 12, color: "#94a3b8" }}>{r.empNo || r.empId || user.empNo || user.id}</td>
                    <td><ShiftBadge shift={r.shift} /></td>
                    <td style={{ color:"#475569" }}>{r.category}</td>
                    <td style={{ color:"#475569" }}>{r.subCategory || "—"}</td>
                    <td style={{ fontWeight:600, fontFamily:"monospace", color:"#0f172a" }}>{(r.regularMins / 60.0).toFixed(2)}</td>
                    <td style={{ fontWeight:600, fontFamily:"monospace", color:r.overtimeMins > 0 ? "#d97706" : "#94a3b8" }}>{(r.overtimeMins / 60.0).toFixed(2)}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td style={{ fontSize: 12, color: "#475569", maxWidth: 150, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={r.remarks}>{r.remarks || "—"}</td>
                  </tr>
                ))
              )}
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
