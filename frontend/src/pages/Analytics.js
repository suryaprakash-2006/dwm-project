import React, { useEffect, useState } from "react";
import { Bar, Pie, Line } from "react-chartjs-2";
import "chart.js/auto";
import config from "../config";

const Analytics = () => {
  const today = new Date().toISOString().split("T")[0];

  const [entries,  setEntries]  = useState([]);
  const [filtered, setFiltered] = useState([]);

  // Pending filter state
  const [tempDateFrom, setTempDateFrom] = useState("");
  const [tempDateTo,   setTempDateTo]   = useState("");

  // Active filter state
  const [activeFilters, setActiveFilters] = useState({});
  const [loading,       setLoading]       = useState(false);
  const [dateError,     setDateError]     = useState("");

  // -------- Data fetch --------
  const fetchEntries = async (params = {}) => {
    setLoading(true);
    try {
      const token   = localStorage.getItem("token");
      const headers = { "Authorization": `Bearer ${token}` };
      const qs      = new URLSearchParams();
      if (params.dateFrom) qs.set("date_from", params.dateFrom);
      if (params.dateTo)   qs.set("date_to",   params.dateTo);
      const url = `${config.API_URL}/time-entries${qs.toString() ? "?" + qs.toString() : ""}`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
        setFiltered(data);
      }
    } catch (err) {
      console.warn("Failed to fetch analytics data", err);
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
    if (tempDateFrom) active["From"] = tempDateFrom;
    if (tempDateTo)   active["To"]   = tempDateTo;
    setActiveFilters(active);
    fetchEntries({ dateFrom: tempDateFrom, dateTo: tempDateTo });
  };

  // -------- Reset --------
  const handleReset = () => {
    setTempDateFrom("");
    setTempDateTo("");
    setDateError("");
    setActiveFilters({});
    fetchEntries();
  };

  // -------- Aggregations --------
  // Draft entries are excluded from all analytics calculations
  const nonDraftFiltered = filtered.filter(e => e.approvalStatus !== "Draft");
  const totalHours = nonDraftFiltered.reduce((acc, e) => acc + ((e.regularMins || 0) + (e.overtimeMins || 0)) / 60.0, 0);

  const deptCounts = nonDraftFiltered.reduce((acc, e) => {
    const key = e.category || "General";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const deptData = {
    labels: Object.keys(deptCounts),
    datasets: [{
      label: "Entries per Category",
      data: Object.values(deptCounts),
      backgroundColor: ["#2563EB","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899"],
    }],
  };

  const machineCounts = nonDraftFiltered.reduce((acc, e) => {
    (e.machineRows || []).forEach(m => {
      const name = m.machine || m.name || "Unknown";
      acc[name] = (acc[name] || 0) + 1;
    });
    return acc;
  }, {});
  const machineData = {
    labels: Object.keys(machineCounts),
    datasets: [{
      data: Object.values(machineCounts),
      backgroundColor: ["#2563EB","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899"],
    }],
  };

  // Group hours by date for trend line
  const dateMap = {};
  nonDraftFiltered.forEach(e => {
    const d = e.date || "Unknown";
    dateMap[d] = (dateMap[d] || 0) + ((e.regularMins || 0) + (e.overtimeMins || 0)) / 60.0;
  });
  const sortedDates = Object.keys(dateMap).sort();
  const hoursTrendData = {
    labels: sortedDates,
    datasets: [{
      label: "Work Hours Trend",
      data: sortedDates.map(d => Math.round(dateMap[d] * 100) / 100),
      borderColor: "#2563EB",
      fill: false,
    }],
  };

  return (
    <div className="page">
      <h3>Analytics Dashboard</h3>

      {/* Filters */}
      <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, padding:"14px 20px", marginBottom:16 }}>
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <label style={{ margin:0, fontWeight:600, fontSize:13, color:"#475569" }}>Date Range:</label>
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

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card p-3 text-center">
            <h6>Total Hours</h6>
            <h4>{Math.round(totalHours * 100) / 100}</h4>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card p-3 text-center">
            <h6>Categories</h6>
            <h4>{Object.keys(deptCounts).length}</h4>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card p-3 text-center">
            <h6>Machines Used</h6>
            <h4>{Object.keys(machineCounts).length}</h4>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="row g-3">
        <div className="col-md-6">
          <div className="card p-3">
            <h6>Entries per Category</h6>
            {Object.keys(deptCounts).length > 0 ? <Bar data={deptData} /> : <p style={{ color:"#94a3b8", textAlign:"center" }}>No data</p>}
          </div>
        </div>
        <div className="col-md-6">
          <div className="card p-3">
            <h6>Machine Usage</h6>
            {Object.keys(machineCounts).length > 0 ? <Pie data={machineData} /> : <p style={{ color:"#94a3b8", textAlign:"center" }}>No data</p>}
          </div>
        </div>
        <div className="col-md-12">
          <div className="card p-3">
            <h6>Work Hours Trend</h6>
            {sortedDates.length > 0 ? <Line data={hoursTrendData} /> : <p style={{ color:"#94a3b8", textAlign:"center" }}>No data</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
