import React, { useState, useEffect } from "react";
import { Pie, Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import "../../styles/theme.css";
import config from "../../config";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, ChartDataLabels);

const GRAD_COLORS = ["#2563EB","#3B82F6","#60A5FA","#93C5FD","#10B981","#F59E0B"];
const PIE_COLORS  = ["#2563EB","#1D4ED8","#60A5FA","#93C5FD","#10B981","#34D399","#F59E0B","#FBBF24"];

const pieOpts = {
  responsive:true, maintainAspectRatio:false,
  plugins:{
    legend:{ position:"bottom", labels:{ font:{ size:11, family:"'Plus Jakarta Sans',sans-serif" }, boxWidth:13, padding:10 } },
    datalabels:{ color:"#fff", font:{ weight:"bold", size:12 }, formatter:(v,ctx) => {
      const t = ctx.dataset.data.reduce((a,b) => a+b, 0);
      return t > 0 ? `${Math.round((v/t)*100)}%` : "";
    }},
    tooltip:{ callbacks:{ label:(ctx) => `${ctx.label}: ${ctx.parsed} hrs` } },
  },
};

const barOpts = {
  responsive:true, maintainAspectRatio:false, indexAxis:"y",
  plugins:{
    legend:{ display:false },
    datalabels:{ anchor:"end", align:"end", color:"#1e293b", font:{ weight:"bold", size:11 }, formatter:(v) => `${v} hrs` },
    tooltip:{ callbacks:{ label:(ctx) => `${ctx.parsed.x} hrs` } },
  },
  scales:{
    x:{ beginAtZero:true, grid:{ color:"rgba(0,0,0,0.04)" }, ticks:{ font:{ size:11 } } },
    y:{ grid:{ display:false }, ticks:{ font:{ size:12, weight:"600" } } },
  },
};

const GRAPH_TABS = [
  { key:"pie", icon:"🥧", label:"Task Distribution" },
  { key:"bar", icon:"📊", label:"Hours (High → Low)" },
  { key:"subTaskPie", icon:"📊", label:"Sub Task Distribution" },
];

export default function WorkAnalytics() {
  const today = new Date().toISOString().split("T")[0];

  const [timeEntries, setTimeEntries] = useState([]);
  const [filtered,    setFiltered]    = useState([]);

  // Pending (temp) filter state — nothing fires until Search is clicked
  const [tempDateFrom,  setTempDateFrom]  = useState("");
  const [tempDateTo,    setTempDateTo]    = useState("");
  const [tempShift,     setTempShift]     = useState("all");

  // Active filter state
  const [activeFilters, setActiveFilters] = useState({});
  const [loading,       setLoading]       = useState(false);
  const [dateError,     setDateError]     = useState("");
  const [activeGraph,   setActiveGraph]   = useState("pie");

  // -------- Data fetch --------
  const fetchEntries = async (params = {}) => {
    setLoading(true);
    try {
      const token   = localStorage.getItem("token");
      const headers = { "Authorization": `Bearer ${token}` };
      const qs      = new URLSearchParams();
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
      console.warn("Failed to fetch time entries for user analytics", err);
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
    setTempDateFrom("");
    setTempDateTo("");
    setTempShift("all");
    setDateError("");
    setActiveFilters({});
    fetchEntries();
  };

  // -------- Aggregations --------
  const totalRegularHours  = filtered.reduce((s, r) => s + (r.regularMins  || 0) / 60.0, 0);
  const totalOvertimeHours = filtered.reduce((s, r) => s + (r.overtimeMins || 0) / 60.0, 0);
  const totalHours         = totalRegularHours + totalOvertimeHours;

  const taskMap = {};
  filtered.forEach(r => {
    const cat = r.category || "General";
    taskMap[cat] = (taskMap[cat] || 0) + ((r.regularMins + r.overtimeMins) / 60.0);
  });
  const taskSorted = Object.entries(taskMap)
    .map(([l, v]) => ({ label: l, value: Math.round(v * 100) / 100 }))
    .sort((a, b) => b.value - a.value);

  const subTaskMap = {};
  filtered.forEach(r => {
    if (r.approvalStatus === "Approved") {
      const scat = r.subCategory || "General";
      subTaskMap[scat] = (subTaskMap[scat] || 0) + ((r.regularMins + r.overtimeMins) / 60.0);
    }
  });
  const subTaskSorted = Object.entries(subTaskMap)
    .map(([l, v]) => ({ label: l, value: Math.round(v * 100) / 100 }))
    .sort((a, b) => b.value - a.value);

  const pieData = { labels:taskSorted.map(d=>d.label), datasets:[{ data:taskSorted.map(d=>d.value), backgroundColor:PIE_COLORS, borderWidth:2, borderColor:"#fff", hoverOffset:6 }] };
  const barData = { labels:taskSorted.map(d=>d.label), datasets:[{ label:"Hours", data:taskSorted.map(d=>d.value), backgroundColor:GRAD_COLORS, borderRadius:6, borderSkipped:false }] };
  const subTaskPieData = { labels:subTaskSorted.map(d=>d.label), datasets:[{ data:subTaskSorted.map(d=>d.value), backgroundColor:PIE_COLORS, borderWidth:2, borderColor:"#fff", hoverOffset:6 }] };

  return (
    <div className="page">
      <h3>Work Analytics</h3>

      {/* Filters */}
      <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, padding:"14px 20px", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <label style={{ fontSize:12.5, fontWeight:600, color:"#475569", margin:0 }}>Shift:</label>
          <select className="form-select" style={{ width:130 }} value={tempShift} onChange={e => setTempShift(e.target.value)}>
            <option value="all">All Shifts</option>
            <option value="A">Shift A</option>
            <option value="B">Shift B</option>
            <option value="C">Shift C</option>
          </select>

          <label style={{ fontSize:12.5, fontWeight:600, color:"#475569", margin:"0 0 0 8px" }}>Date Range:</label>
          <input type="date" className="form-control" style={{ width:155 }} max={today}
            value={tempDateFrom} onChange={e => { setTempDateFrom(e.target.value); setDateError(""); }} />
          <span style={{ fontSize:12.5, color:"#94a3b8" }}>to</span>
          <input type="date" className="form-control" style={{ width:155 }} max={today}
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

      {/* Summary cards */}
      <div className="row g-3 mb-4">
        {[
          { label:"Regular Hours",  value: Math.round(totalRegularHours  * 100) / 100 },
          { label:"Overtime Hours", value: Math.round(totalOvertimeHours * 100) / 100 },
          { label:"Total Hours",    value: Math.round(totalHours         * 100) / 100 },
        ].map((c,i) => (
          <div className="col-md-4" key={i}><div className="summary-card"><p>{c.label}</p><h5>{c.value}</h5></div></div>
        ))}
      </div>

      {/* Graph tabs */}
      <div style={{ display:"flex", gap:10, marginBottom:16 }}>
        {GRAPH_TABS.map(t => (
          <button key={t.key} onClick={() => setActiveGraph(t.key)} style={{
            display:"flex", alignItems:"center", gap:8, padding:"10px 22px", borderRadius:10, border:"2px solid",
            borderColor:activeGraph===t.key?"#2563eb":"#e2e8f0",
            background:activeGraph===t.key?"#dbeafe":"#fff",
            color:activeGraph===t.key?"#1d4ed8":"#64748b",
            fontWeight:700, fontSize:13, cursor:"pointer", transition:"all 0.15s",
            boxShadow:activeGraph===t.key?"0 2px 8px rgba(37,99,235,0.2)":"none",
          }}>
            <span style={{ fontSize:20 }}>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div className="chart-card" style={{ minHeight:320 }}>
        {filtered.length === 0 ? (
          <p style={{ textAlign:"center", padding:50, color:"#94a3b8" }}>
            {loading ? "Loading…" : "No work logs found matching selected criteria."}
          </p>
        ) : (
          <>
            {activeGraph==="pie" && (<><h6>Task Distribution</h6><div style={{ height:280 }}><Pie data={pieData} options={pieOpts} /></div></>)}
            {activeGraph==="bar" && (<><h6>Hours by Category — High to Low</h6><div style={{ height:280 }}><Bar data={barData} options={barOpts} /></div></>)}
            {activeGraph==="subTaskPie" && (<><h6>Sub Category Distribution <span style={{ fontSize: 11, fontWeight: 500, color: "#64748b" }}>(Approved Only)</span></h6><div style={{ height:280 }}><Pie data={subTaskPieData} options={pieOpts} /></div></>)}
          </>
        )}
      </div>
    </div>
  );
}
