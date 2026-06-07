import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "../../styles/theme.css";
import config from "../../config";

const StatusBadge = ({ status }) => {
  const m = { P:{label:"Present",bg:"#16a34a"}, L:{label:"Leave",bg:"#dc2626"}, OD:{label:"On Duty",bg:"#d97706"}, HD:{label:"Half Day",bg:"#2563eb"} };
  const s = m[status] || { label: status, bg: "#64748b" };
  return <span style={{ display:"inline-block", background:s.bg, color:"#fff", fontSize:12, fontWeight:700, padding:"4px 12px", borderRadius:20, minWidth:76, textAlign:"center" }}>{s.label}</span>;
};

const ShiftBadge = ({ shift }) => {
  const c = { A:"#2563eb", B:"#16a34a", C:"#d97706" };
  return <span style={{ display:"inline-block", background:c[shift]||"#64748b", color:"#fff", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20 }}>Shift {shift}</span>;
};

const MachineBadge = ({ machine }) => (
  <span style={{ display:"inline-block", background:"#f1f5f9", border:"1px solid #e2e8f0", color:"#334155", fontSize:11.5, fontWeight:600, padding:"3px 10px", borderRadius:6 }}>
    ⚙️ {machine}
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

  // temp (pending) filter state — nothing fires until Apply is clicked
  const [tempMachine,  setTempMachine]  = useState("All");
  const [tempDateFrom, setTempDateFrom] = useState("");
  const [tempDateTo,   setTempDateTo]   = useState("");

  // active (applied) filter state
  const [activeFilters, setActiveFilters] = useState({});
  const [loading,       setLoading]       = useState(false);
  const [dateError,     setDateError]     = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Load all entries on mount (default view)
  const fetchEntries = async (params = {}) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { "Authorization": `Bearer ${token}` };
      const qs = new URLSearchParams();
      qs.set("approvalStatus", "Approved");
      if (params.dateFrom) qs.set("date_from", params.dateFrom);
      if (params.dateTo)   qs.set("date_to",   params.dateTo);
      if (params.machine && params.machine !== "All") qs.set("machine", params.machine);
      const url = `${config.API_URL}/time-entries${qs.toString() ? "?" + qs.toString() : ""}`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setTimeEntries(data);
        // client-side machine filter (machine not yet a backend param)
        applyClientFilter(data, params.machine || "All", params.dateFrom || "", params.dateTo || "");
      }
    } catch (err) {
      console.warn("Failed to fetch time entries:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyClientFilter = (entries, machine, dateFrom, dateTo) => {
    const result = entries.filter(r => {
      if (machine !== "All" && !(r.machineRows || []).some(m => (m.machine || m.name) === machine)) return false;
      if (dateFrom && r.date < dateFrom) return false;
      if (dateTo   && r.date > dateTo)   return false;
      return true;
    });
    setFiltered(result);
  };

  useEffect(() => { fetchEntries(); }, []); // eslint-disable-line

  const allMachines = ["All", ...Array.from(new Set(timeEntries.flatMap(r => (r.machineRows || []).map(m => m.machine || m.name))))];

  // ---------- Validation ----------
  const validate = () => {
    if (tempDateFrom && tempDateFrom > today) { setDateError("Start date cannot be in the future."); return false; }
    if (tempDateTo   && tempDateTo   > today) { setDateError("End date cannot be in the future.");   return false; }
    if (tempDateFrom && tempDateTo && tempDateFrom > tempDateTo) { setDateError("Start date must be ≤ end date."); return false; }
    setDateError("");
    return true;
  };

  // ---------- Apply ----------
  const handleApply = () => {
    if (!validate()) return;
    const active = {};
    if (tempMachine  && tempMachine !== "All") active["Machine"] = tempMachine;
    if (tempDateFrom) active["From"] = tempDateFrom;
    if (tempDateTo)   active["To"]   = tempDateTo;
    setActiveFilters(active);
    fetchEntries({ dateFrom: tempDateFrom, dateTo: tempDateTo, machine: tempMachine });
  };

  // ---------- Reset ----------
  const handleReset = () => {
    setTempMachine("All");
    setTempDateFrom("");
    setTempDateTo("");
    setDateError("");
    setActiveFilters({});
    fetchEntries();
  };

  // ---------- Exports ----------
  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filtered, null, 2));
    const a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `dwm_operator_report_${today}.json`);
    document.body.appendChild(a); a.click(); a.remove();
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const regularHours = filtered.reduce((sum, row) => sum + (Number(row.regularMins) || 0), 0) / 60;
    const overtimeHours = filtered.reduce((sum, row) => sum + (Number(row.overtimeMins) || 0), 0) / 60;
    const totalHours = regularHours + overtimeHours;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("My Reports", 40, 40);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const employeeLines = [
      `Employee: ${user.username || user.name || "—"}`,
      `Emp ID: ${user.id || "—"}`,
      `Designation: ${user.designation || "—"}`,
      `Email: ${user.email || "—"}`,
      `Department: ${user.department || "—"}`,
    ];
    employeeLines.forEach((line, index) => doc.text(line, 40, 64 + (index * 14)));

    autoTable(doc, {
      startY: 144,
      head: [["DATE", "SHIFT", "CATEGORY", "MACHINES OPERATED", "MACHINE HRS", "REG HRS", "OT HRS", "STATUS"]],
      body: filtered.map((row) => {
        const machineRows = row.machineRows || [];
        const machineNames = machineRows.length > 0
          ? machineRows.map((machine) => machine.machine || machine.name).join(", ")
          : "—";
        const machineHours = machineRows.length > 0
          ? machineRows.map((machine) => {
              const hours = Number(machine.machineHrs) || 0;
              const mins = Number(machine.machineMins) || 0;
              return `${machine.machine || machine.name}: ${hours}h${mins > 0 ? ` ${mins}m` : ""}`;
            }).join(" | ")
          : "—";

        return [
          row.date,
          `Shift ${row.shift}`,
          `${row.category} - ${row.subCategory}`,
          machineNames,
          machineHours,
          formatHours((Number(row.regularMins) || 0) / 60),
          formatHours((Number(row.overtimeMins) || 0) / 60),
          row.status,
        ];
      }),
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

    doc.save(`dwm_operator_report_${today}.pdf`);
  };

  const exportExcel = () => {
    const hdrs = ["DATE","SHIFT","CATEGORY","SUB-CATEGORY","REG HOURS","OT HOURS","STATUS","REMARKS"];
    const csv = "data:text/csv;charset=utf-8," + [
      hdrs.join(","),
      ...filtered.map(r => [
        r.date ? `="${r.date}"` : "", r.shift, r.category, r.subCategory,
        (r.regularMins / 60.0).toFixed(2),
        (r.overtimeMins / 60.0).toFixed(2),
        r.status, `"${(r.remarks || "").replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");
    const a = document.createElement("a");
    a.setAttribute("href", encodeURI(csv));
    a.setAttribute("download", `dwm_operator_report_${today}.csv`);
    document.body.appendChild(a); a.click(); a.remove();
  };

  return (
    <div className="page">
      <h3>My Reports</h3>

      {/* Employee info card */}
      <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, padding:"14px 20px", marginBottom:20, display:"flex", gap:28, flexWrap:"wrap", alignItems:"center" }}>
        {[
          { label:"Employee",    value: user.username || user.name },
          { label:"Emp ID",      value: user.id, mono:true },
          { label:"Designation", value: user.designation },
          { label:"Email",       value: user.email },
          { label:"Department",  value: user.department },
        ].map((f) => (
          <div key={f.label}>
            <span style={{ fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", display:"block" }}>{f.label}</span>
            <p style={{ margin:0, fontWeight:f.label==="Employee"?700:600, color:f.mono?"#94a3b8":"#334155", fontSize:13, fontFamily:f.mono?"monospace":"inherit" }}>{f.value || "—"}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, padding:"14px 20px", marginBottom:16 }}>
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <label style={{ margin:0, fontWeight:600, fontSize:13, color:"#475569" }}>Machine:</label>
          <select className="form-select" style={{ width:180 }} value={tempMachine} onChange={e => setTempMachine(e.target.value)}>
            {allMachines.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <label style={{ margin:"0 0 0 8px", fontWeight:600, fontSize:13, color:"#475569" }}>From:</label>
          <input type="date" className="form-control" style={{ width:150 }} max={today}
            value={tempDateFrom} onChange={e => { setTempDateFrom(e.target.value); setDateError(""); }} />

          <span style={{ fontSize:12.5, color:"#94a3b8" }}>to</span>
          <input type="date" className="form-control" style={{ width:150 }} max={today}
            value={tempDateTo} onChange={e => { setTempDateTo(e.target.value); setDateError(""); }} />

          <button className="btn btn-primary btn-sm" onClick={handleApply} disabled={loading}>
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

        {/* Validation error */}
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
      <div className="card" style={{ padding:0 }}>
        <div className="table-responsive">
          <table className="table table-bordered mb-0 align-middle">
            <thead>
              <tr>
                <th>DATE</th>
                <th>SHIFT</th>
                <th>CATEGORY</th>
                <th>MACHINES OPERATED</th>
                <th>MACHINE HRS</th>
                <th>REG HRS</th>
                <th>OT HRS</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign:"center", padding:28, color:"#94a3b8" }}>
                    {loading ? "Loading…" : "No work logs found."}
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => {
                  const machineRows = r.machineRows || [];
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight:600, color:"#334155" }}>{r.date}</td>
                      <td><ShiftBadge shift={r.shift} /></td>
                      <td style={{ color:"#475569", fontSize:13 }}>{r.category} - {r.subCategory}</td>
                      <td>
                        {machineRows.length === 0
                          ? <span style={{ fontSize:12, color:"#94a3b8" }}>—</span>
                          : <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                              {machineRows.map((m, mi) => <MachineBadge key={mi} machine={m.machine || m.name} />)}
                            </div>
                        }
                      </td>
                      <td>
                        {machineRows.length === 0
                          ? <span style={{ fontSize:12, color:"#94a3b8", fontFamily:"monospace" }}>—</span>
                          : <div style={{ fontSize:12 }}>
                              {machineRows.map((m, mi) => {
                                const hours = Number(m.machineHrs) || 0;
                                const mins  = Number(m.machineMins) || 0;
                                return (
                                  <div key={mi} style={{ color:"#334155" }}>
                                    <span style={{ color:"#64748b" }}>{m.machine || m.name}:</span>{" "}
                                    <strong style={{ fontFamily:"monospace", color:"#2563eb" }}>{hours}h{mins > 0 ? ` ${mins}m` : ""}</strong>
                                  </div>
                                );
                              })}
                            </div>
                        }
                      </td>
                      <td style={{ fontWeight:600, fontFamily:"monospace" }}>{(r.regularMins / 60.0).toFixed(2)}</td>
                      <td style={{ fontWeight:600, fontFamily:"monospace", color:r.overtimeMins>0?"#d97706":"#94a3b8" }}>{(r.overtimeMins / 60.0).toFixed(2)}</td>
                      <td><StatusBadge status={r.status} /></td>
                    </tr>
                  );
                })
              )}
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
