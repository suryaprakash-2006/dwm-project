import React, { useState, useEffect } from "react";
import { Pie, Bar, Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import "../../styles/theme.css";
import config from "../../config";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, ChartDataLabels);

const COLORS18 = [
  "#2563EB", "#1D4ED8", "#3B82F6", "#60A5FA", "#16a34a", "#22c55e",
  "#d97706", "#f59e0b", "#dc2626", "#ef4444", "#7c3aed", "#8b5cf6",
  "#0891b2", "#06b6d4", "#be185d", "#ec4899", "#475569", "#64748b"
];

const pieOpts = (sm = false) => ({
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { position: "bottom", labels: { font: { size: sm ? 10 : 11 }, boxWidth: 12, padding: 8 } },
    datalabels: {
      color: "#fff", font: { weight: "bold", size: sm ? 10 : 11 },
      formatter: (v, ctx) => { const t = ctx.dataset.data.reduce((a, b) => a + b, 0); return t > 0 ? `${Math.round((v / t) * 100)}%` : ""; }
    },
    tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed} hrs` } },
  },
});

const hbarOpts = {
  responsive: true, maintainAspectRatio: false, indexAxis: "y",
  plugins: {
    legend: { display: false },
    datalabels: { anchor: "end", align: "end", color: "#1e293b", font: { weight: "bold", size: 10 }, formatter: (v) => `${v}` },
    tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.x} hrs` } },
  },
  scales: {
    x: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { size: 10 } } },
    y: { grid: { display: false }, ticks: { font: { size: 10, weight: "600" } } },
  },
};

const lineOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    datalabels: { display: false },
    tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y} hrs` } },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { size: 11 } } },
  },
};

const groupedOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { position: "bottom", labels: { font: { size: 11 }, boxWidth: 12, padding: 8 } },
    datalabels: { anchor: "end", align: "end", color: "#1e293b", font: { weight: "bold", size: 9 }, formatter: (v) => `${v}` },
    tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} hrs` } },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
    y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { size: 10 } } },
  },
};

const GRAPH_TABS = [
  { key: "deptBar",  icon: "🏢", label: "Hours by Dept" },
  { key: "taskPie",  icon: "🥧", label: "Task Distribution" },
  { key: "subTaskPie", icon: "📊", label: "Sub Task Distribution" },
  { key: "trend",    icon: "📈", label: "Hours Trend" },
  { key: "deptPie",  icon: "🍩", label: "Dept Distribution" },
  { key: "topEmp",   icon: "🏆", label: "Top Employees" },
  { key: "overtime", icon: "⏱️", label: "OT Analytics" },
];

export default function Analytics() {
  const today = new Date().toISOString().split("T")[0];

  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees]     = useState([]);

  // Temp filter state (not applied until Search clicked)
  const [tempDept,    setTempDept]    = useState("all");
  const [tempEmp,     setTempEmp]     = useState("all");
  const [tempDateFrom, setTempDateFrom] = useState("");
  const [tempDateTo,   setTempDateTo]   = useState("");
  const [dateError,    setDateError]    = useState("");

  // Active filter state
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedEmp,  setSelectedEmp]  = useState("all");
  const [dateFrom,     setDateFrom]     = useState("");
  const [dateTo,       setDateTo]       = useState("");

  const [activeGraph, setActiveGraph] = useState("deptBar");
  const [loading,     setLoading]     = useState(false);

  const [kpis, setKpis] = useState({
    totalEmployees: 0, activeEmployees: 0, departmentsCount: 0,
    machinesCount: 0, activeMachinesCount: 0, totalTimeEntries: 0,
    pendingApprovals: 0, approvedEntries: 0, rejectedEntries: 0,
    totalRegularHours: 0, totalOvertimeHours: 0, employeesWithOvertime: 0
  });

  const [chartData, setChartData] = useState({
    deptProductivity: [],
    shiftProductivity: [],
    employeeProductivity: [],
    dailyTrends: [],
    taskDistribution: [],
    subTaskDistribution: [],
    machineUtilization: { total: 0, active: 0, activePercent: 0 },
    totalRegularHours: 0,
    overtimeSummary: { totalOvertimeHours: 0, employeesWithOvertime: 0 },
    deptOvertimeList: [],
    employeeOvertimeList: [],
  });

  // Fetch KPIs (not filterable — global)
  const fetchKpis = async (token) => {
    try {
      const res = await fetch(`${config.API_URL}/reports/dashboard-kpis`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setKpis(await res.json());
    } catch (err) {
      console.warn("Failed to load KPIs", err);
    }
  };

  // Fetch chart data with optional filters
  const fetchCharts = async (token, dept, emp, df, dt) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (dept && dept !== "all") qs.set("dept", dept);
      if (emp && emp !== "all")   qs.set("emp_id", emp);
      if (df) qs.set("date_from", df);
      if (dt) qs.set("date_to", dt);
      const url = `${config.API_URL}/reports/analytics-charts${qs.toString() ? "?" + qs.toString() : ""}`;
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setChartData(await res.json());
    } catch (err) {
      console.warn("Failed to load analytics charts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { "Authorization": `Bearer ${token}` };

        const deptRes = await fetch(`${config.API_URL}/departments`, { headers });
        if (deptRes.ok && mounted) setDepartments(await deptRes.json());
        const empRes = await fetch(`${config.API_URL}/employees`, { headers });
        if (empRes.ok && mounted) setEmployees(await empRes.json());

        await fetchKpis(token);
        await fetchCharts(token, "all", "all", "", "");
      } catch (err) {
        console.warn("Failed to load analytics", err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    if (tempDateFrom && tempDateFrom > today) { setDateError("Start date cannot be in the future."); return false; }
    if (tempDateTo   && tempDateTo   > today) { setDateError("End date cannot be in the future.");   return false; }
    if (tempDateFrom && tempDateTo && tempDateFrom > tempDateTo) { setDateError("Start date must be ≤ end date."); return false; }
    setDateError("");
    return true;
  };

  // ── Search ───────────────────────────────────────────────────────────────────
  const handleSearch = () => {
    if (!validate()) return;
    setSelectedDept(tempDept);
    setSelectedEmp(tempEmp);
    setDateFrom(tempDateFrom);
    setDateTo(tempDateTo);
    const token = localStorage.getItem("token");
    fetchCharts(token, tempDept, tempEmp, tempDateFrom, tempDateTo);
  };

  // ── Reset ────────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setTempDept("all"); setTempEmp("all"); setTempDateFrom(""); setTempDateTo(""); setDateError("");
    setSelectedDept("all"); setSelectedEmp("all"); setDateFrom(""); setDateTo("");
    const token = localStorage.getItem("token");
    fetchCharts(token, "all", "all", "", "");
  };

  const hasFilter = selectedDept !== "all" || selectedEmp !== "all" || dateFrom || dateTo;
  
  const handleDeptChange = (e) => {
    setTempDept(e.target.value);
    setTempEmp("all");
  };

  const filteredEmployees = tempDept === "all" ? employees : employees.filter(e => e.dept === tempDept);

  // ── Chart data preparation ── PRODUCTIVITY = REGULAR HOURS ONLY ──────────────

  // Department bar: regular hours only
  const deptSorted = [...chartData.deptProductivity]
    .map(d => ({ l: d.dept, v: d.regular }))  // regular only — NEVER mix OT
    .sort((a, b) => b.v - a.v);

  const deptBarData = {
    labels: deptSorted.map(d => d.l.length > 14 ? d.l.slice(0, 13) + "…" : d.l),
    datasets: [{ label: "Regular Hours", data: deptSorted.map(d => d.v), backgroundColor: COLORS18, borderRadius: 5, borderSkipped: false }]
  };

  const deptPieData = {
    labels: deptSorted.map(d => d.l),
    datasets: [{ data: deptSorted.map(d => d.v), backgroundColor: COLORS18, borderWidth: 2, borderColor: "#fff", hoverOffset: 6 }]
  };

  const taskSorted = [...chartData.taskDistribution].sort((a, b) => b.hours - a.hours);
  const taskPieData = {
    labels: taskSorted.map(d => d.category),
    datasets: [{ data: taskSorted.map(d => d.hours), backgroundColor: ["#2563EB","#3B82F6","#60A5FA","#93C5FD","#10B981","#34D399","#F59E0B","#FBBF24"], borderWidth: 2, borderColor: "#fff", hoverOffset: 6 }]
  };

  const subTaskSorted = [...chartData.subTaskDistribution].sort((a, b) => b.hours - a.hours);
  const subTaskPieData = {
    labels: subTaskSorted.map(d => d.category),
    datasets: [{ data: subTaskSorted.map(d => d.hours), backgroundColor: COLORS18, borderWidth: 2, borderColor: "#fff", hoverOffset: 6 }]
  };

  // Top employees: regular hours only (productivity ranking — no OT inflation)
  const empBarData = {
    labels: chartData.employeeProductivity.map(e => e.name),
    datasets: [{ label: "Regular Hours", data: chartData.employeeProductivity.map(e => e.regular), backgroundColor: COLORS18, borderRadius: 5, borderSkipped: false }]
  };

  // Daily trend: regular hours only
  const lineTrendsFiltered = chartData.dailyTrends.filter(t => {
    if (dateFrom && t.date < dateFrom) return false;
    if (dateTo   && t.date > dateTo)   return false;
    return true;
  });
  const lineData = {
    labels: lineTrendsFiltered.map(t => t.date),
    datasets: [{ data: lineTrendsFiltered.map(t => t.regular), borderColor: "#2563EB", backgroundColor: "rgba(37,99,235,0.08)", tension: 0.4, fill: true, pointRadius: 5, pointBackgroundColor: "#2563EB", pointBorderColor: "#fff", pointBorderWidth: 2 }]
  };

  // OT Analytics: from dedicated overtime data — separate from productivity
  const otSummary = chartData.overtimeSummary || { totalOvertimeHours: 0, employeesWithOvertime: 0 };
  const deptOTList = chartData.deptOvertimeList || [];
  const empOTList  = chartData.employeeOvertimeList || [];

  const deptOTBarData = {
    labels: deptOTList.map(d => d.dept.length > 14 ? d.dept.slice(0, 13) + "…" : d.dept),
    datasets: [{ label: "OT Hours", data: deptOTList.map(d => d.overtime), backgroundColor: "#f59e0b", borderRadius: 5, borderSkipped: false }]
  };

  const empOTBarData = {
    labels: empOTList.map(e => e.name),
    datasets: [{ label: "OT Hours", data: empOTList.map(e => e.overtime), backgroundColor: "#dc2626", borderRadius: 5, borderSkipped: false }]
  };

  // Grouped OT vs Regular for top employees — using separate data sources
  const groupedData = {
    labels: chartData.employeeProductivity.map(e => e.name),
    datasets: [
      { label: "Regular", data: chartData.employeeProductivity.map(e => e.regular), backgroundColor: "#2563EB", borderRadius: 4, borderSkipped: false },
      { label: "Overtime", data: chartData.employeeProductivity.map(e => {
        const ot = empOTList.find(o => o.empId === e.empId || o.name === e.name);
        return ot ? ot.overtime : 0;
      }), backgroundColor: "#f59e0b", borderRadius: 4, borderSkipped: false },
    ]
  };

  const H = 300;

  return (
    <div className="page">
      <h3>Analytics</h3>

      {/* Summary KPI Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: "Total Employees",    value: kpis.totalEmployees },
          { label: "Regular Hours",      value: Math.round(kpis.totalRegularHours || chartData.totalRegularHours || 0) },
          { label: "Overtime Hours",     value: Math.round(kpis.totalOvertimeHours || otSummary.totalOvertimeHours || 0) },
          { label: "Active Departments", value: kpis.departmentsCount }
        ].map((c, i) => (
          <div className="col-md-3" key={i}>
            <div className="summary-card">
              <p>{c.label}</p>
              <h5>{c.value}</h5>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar — Search & Reset buttons */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 20px", marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div className="row g-3 align-items-end">
          <div className="col-md-2">
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>Department</label>
            <select className="form-select" value={tempDept} onChange={handleDeptChange}>
              <option value="all">— All Departments —</option>
              {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>Employee</label>
            <select className="form-select" value={tempEmp} onChange={e => setTempEmp(e.target.value)}>
              <option value="all">— All Employees —</option>
              {filteredEmployees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.empNo})</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>From</label>
            <input type="date" className="form-control" max={today}
              value={tempDateFrom} onChange={e => { setTempDateFrom(e.target.value); setDateError(""); }} />
          </div>
          <div className="col-md-2">
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>To</label>
            <input type="date" className="form-control" max={today}
              value={tempDateTo} onChange={e => { setTempDateTo(e.target.value); setDateError(""); }} />
          </div>
          <div className="col-md-3 d-flex gap-2 align-items-end">
            <button className="btn btn-primary btn-sm" onClick={handleSearch} disabled={loading} style={{ flex: 1 }}>
              {loading ? "Loading…" : "Search"}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleReset} disabled={loading} style={{ flex: 1 }}>
              Reset
            </button>
            {loading && (
              <div className="spinner-border spinner-border-sm text-primary ms-1" role="status">
                <span className="visually-hidden">Loading…</span>
              </div>
            )}
          </div>
        </div>
        {dateError && (
          <div style={{ color: "#dc2626", fontSize: 12.5, marginTop: 8, fontWeight: 600 }}>
            ⚠️ {dateError}
          </div>
        )}
        {hasFilter && (
          <div style={{ marginTop: 10, fontSize: 12.5, color: "#2563eb", fontWeight: 600 }}>
            Filters active:{selectedDept !== "all" && ` Dept: ${selectedDept}`}{selectedEmp !== "all" && ` | Emp: ${selectedEmp}`}{dateFrom && ` | From: ${dateFrom}`}{dateTo && ` | To: ${dateTo}`}
          </div>
        )}
      </div>

      {/* Info note: productivity uses regular hours only */}
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "8px 14px", marginBottom: 16, fontSize: 12.5, color: "#1e40af" }}>
        ℹ️ <strong>Productivity charts use APPROVED REGULAR HOURS ONLY.</strong> Overtime is tracked separately in the OT Analytics tab — it never inflates productivity metrics.
      </div>

      {/* Graph tab switcher */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {GRAPH_TABS.map(t => (
          <button key={t.key} onClick={() => setActiveGraph(t.key)} style={{
            display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 10, border: "2px solid",
            borderColor: activeGraph === t.key ? "#2563eb" : "#e2e8f0",
            background: activeGraph === t.key ? "#dbeafe" : "#fff",
            color: activeGraph === t.key ? "#1d4ed8" : "#64748b",
            fontWeight: 700, fontSize: 12.5, cursor: "pointer", transition: "all 0.15s",
            boxShadow: activeGraph === t.key ? "0 2px 8px rgba(37,99,235,0.2)" : "none",
          }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div className="chart-card" style={{ minHeight: H + 60 }}>
        {/* Dept Bar — REGULAR ONLY */}
        {activeGraph === "deptBar" && (
          <>
            <h6>Regular Hours by Department — High to Low <span style={{ fontSize: 11, fontWeight: 500, color: "#64748b" }}>(Approved Regular Hours Only)</span></h6>
            {deptSorted.length === 0 ? (
              <p style={{ textAlign: "center", padding: 50, color: "#94a3b8" }}>No time logs found for the selection.</p>
            ) : (
              <div style={{ height: H }}><Bar data={deptBarData} options={hbarOpts} /></div>
            )}
          </>
        )}

        {/* Task Distribution */}
        {activeGraph === "taskPie" && (
          <>
            <h6>Task Distribution <span style={{ fontSize: 11, fontWeight: 500, color: "#64748b" }}>(Regular Hours)</span></h6>
            {chartData.taskDistribution.length === 0 ? (
              <p style={{ textAlign: "center", padding: 50, color: "#94a3b8" }}>No time logs found.</p>
            ) : (
              <div style={{ height: H }}><Pie data={taskPieData} options={pieOpts()} /></div>
            )}
          </>
        )}

        {/* Sub Task Distribution */}
        {activeGraph === "subTaskPie" && (
          <>
            <h6>Sub Category Distribution <span style={{ fontSize: 11, fontWeight: 500, color: "#64748b" }}>(Regular Hours)</span></h6>
            {chartData.subTaskDistribution.length === 0 ? (
              <p style={{ textAlign: "center", padding: 50, color: "#94a3b8" }}>No time logs found.</p>
            ) : (
              <div style={{ height: H }}><Pie data={subTaskPieData} options={pieOpts()} /></div>
            )}
          </>
        )}

        {/* Daily Trend — REGULAR ONLY */}
        {activeGraph === "trend" && (
          <>
            <h6>Daily Regular Hours Trend <span style={{ fontSize: 11, fontWeight: 500, color: "#64748b" }}>(Approved Regular Hours Only)</span></h6>
            {lineTrendsFiltered.length === 0 ? (
              <p style={{ textAlign: "center", padding: 50, color: "#94a3b8" }}>No daily trends found for selected range.</p>
            ) : (
              <div style={{ height: H }}><Line data={lineData} options={lineOpts} /></div>
            )}
          </>
        )}

        {/* Dept Pie — REGULAR ONLY */}
        {activeGraph === "deptPie" && (
          <>
            <h6>Department Distribution <span style={{ fontSize: 11, fontWeight: 500, color: "#64748b" }}>(Regular Hours)</span></h6>
            {deptSorted.length === 0 ? (
              <p style={{ textAlign: "center", padding: 50, color: "#94a3b8" }}>No department data available.</p>
            ) : (
              <div style={{ height: H }}><Pie data={deptPieData} options={pieOpts()} /></div>
            )}
          </>
        )}

        {/* Top Employees — REGULAR ONLY (productivity ranking) */}
        {activeGraph === "topEmp" && (
          <>
            <h6>Top Employee Productivity — Regular Hours Only <span style={{ fontSize: 11, fontWeight: 500, color: "#64748b" }}>(OT excluded from ranking)</span></h6>
            {chartData.employeeProductivity.length === 0 ? (
              <p style={{ textAlign: "center", padding: 50, color: "#94a3b8" }}>No employee productivity records found.</p>
            ) : (
              <div style={{ height: H }}><Bar data={empBarData} options={hbarOpts} /></div>
            )}
          </>
        )}

        {/* OT Analytics — DEDICATED OVERTIME SECTION */}
        {activeGraph === "overtime" && (
          <>
            <h6>Overtime Analytics <span style={{ fontSize: 11, fontWeight: 500, color: "#64748b" }}>(Separate from productivity)</span></h6>

            {/* OT Summary KPI cards */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "16px 20px", textAlign: "center" }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#92400e", margin: "0 0 8px", textTransform: "uppercase" }}>Total OT Hours</p>
                  <h4 style={{ color: "#d97706", fontWeight: 800, margin: 0 }}>{otSummary.totalOvertimeHours || 0}</h4>
                </div>
              </div>
              <div className="col-md-4">
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "16px 20px", textAlign: "center" }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#991b1b", margin: "0 0 8px", textTransform: "uppercase" }}>Employees With OT</p>
                  <h4 style={{ color: "#dc2626", fontWeight: 800, margin: 0 }}>{otSummary.employeesWithOvertime || 0}</h4>
                </div>
              </div>
              <div className="col-md-4">
                <div style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 10, padding: "16px 20px", textAlign: "center" }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#5b21b6", margin: "0 0 8px", textTransform: "uppercase" }}>Departments with OT</p>
                  <h4 style={{ color: "#7c3aed", fontWeight: 800, margin: 0 }}>{deptOTList.length}</h4>
                </div>
              </div>
            </div>

            {/* Department OT Breakdown */}
            {deptOTList.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h6 style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Department OT Breakdown</h6>
                <div style={{ height: Math.max(180, deptOTList.length * 40) }}>
                  <Bar data={deptOTBarData} options={hbarOpts} />
                </div>
              </div>
            )}

            {/* Top OT Contributors */}
            {empOTList.length > 0 && (
              <div>
                <h6 style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Top OT Contributors</h6>
                <div style={{ height: Math.max(180, empOTList.length * 40) }}>
                  <Bar data={empOTBarData} options={hbarOpts} />
                </div>
              </div>
            )}

            {deptOTList.length === 0 && empOTList.length === 0 && (
              <p style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No overtime recorded for the selected period.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
