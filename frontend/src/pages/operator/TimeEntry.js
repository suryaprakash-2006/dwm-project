import React, { useState, useEffect } from "react";
import "../../styles/theme.css";
import config from "../../config";


const STATUS_OPTIONS = [
  { value:"P",  label:"Present"  },
  { value:"HD", label:"Half Day" },
  { value:"L",  label:"Leave"    },
  { value:"OD", label:"On Duty"  },
  { value:"AB", label:"Absent"   },
];
const SHIFT_OPTIONS = ["A","B","C"];
const DAILY_STD_MINS = 8 * 60;

const TODAY = new Date(); TODAY.setHours(0,0,0,0);
function daysDiff(dateStr) { const d=new Date(dateStr); d.setHours(0,0,0,0); return Math.floor((TODAY-d)/(1000*60*60*24)); }
function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function getLast14Days() {
  const days=[];
  for(let i=0;i<14;i++) { const d=new Date(TODAY); d.setDate(TODAY.getDate()-i); days.push(formatDate(d)); }
  return days;
}
function minsToHM(mins) {
  const h=Math.floor(mins/60); const m=mins%60;
  return m===0?`${h}h`:`${h}h ${m}m`;
}

function HrMinInput({ label, hours, minutes, onHoursChange, onMinutesChange, maxHours=24 }) {
  return (
    <div>
      <label style={{ display:"block", fontWeight:600, fontSize:13, color:"#475569", marginBottom:6 }}>{label}</label>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
        <div style={{ position:"relative" }}>
          <input type="number" className="form-control" min="0" max={maxHours} placeholder="0"
            value={hours}
            onChange={(e)=>{ const v=e.target.value; if(v===""||Number(v)>=0) onHoursChange(v); }}
            style={{ paddingRight:36 }} />
          <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", fontSize:11, color:"#94a3b8", fontWeight:600 }}>hrs</span>
        </div>
        <div style={{ position:"relative" }}>
          <input type="number" className="form-control" min="0" max="59" placeholder="0"
            value={minutes}
            onChange={(e)=>{ const v=e.target.value; if(v===""||Number(v)>=0) onMinutesChange(v); }}
            style={{ paddingRight:36 }} />
          <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", fontSize:11, color:"#94a3b8", fontWeight:600 }}>min</span>
        </div>
      </div>
    </div>
  );
}

// ── Searchable Sub-Category Combobox ─────────────────────────────────────────
function SearchableSelect({ options, value, onChange, disabled, error, placeholder }) {
  const [search, setSearch] = useState("");
  const [open, setOpen]     = useState(false);
  const ref = React.useRef(null);

  const selectedLabel = options.find(o => o.name === value)?.name || "";
  const filtered = options.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInputFocus = () => { setOpen(true); setSearch(""); };
  const handleInputChange = (e) => { setSearch(e.target.value); setOpen(true); };
  const handleSelect = (sc) => {
    onChange(sc);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        className="form-control"
        readOnly={!open}
        value={open ? search : selectedLabel}
        placeholder={placeholder || "-- Search Sub Category --"}
        disabled={disabled}
        onFocus={handleInputFocus}
        onChange={handleInputChange}
        style={{ borderColor: error ? "#dc2626" : undefined, cursor: disabled ? "not-allowed" : "text" }}
      />
      {!disabled && value && !open && (
        <span style={{ position:"absolute", right:32, top:"50%", transform:"translateY(-50%)", fontSize:10, color:"#64748b" }}>▼</span>
      )}
      {open && (
        <div style={{
          position:"absolute", zIndex:999, width:"100%", maxHeight:200, overflowY:"auto",
          background:"#fff", border:"1px solid #e2e8f0", borderRadius:6,
          boxShadow:"0 4px 16px rgba(0,0,0,0.12)", marginTop:2,
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding:"10px 12px", color:"#94a3b8", fontSize:13 }}>No matches found</div>
          ) : filtered.map(sc => (
            <div
              key={sc.id || sc.name}
              onMouseDown={() => handleSelect(sc)}
              style={{
                padding:"9px 12px", fontSize:13, cursor:"pointer",
                background: value === sc.name ? "#dbeafe" : undefined,
                color: value === sc.name ? "#1d4ed8" : "#334155",
                fontWeight: value === sc.name ? 700 : 400,
                borderBottom:"1px solid #f1f5f9",
              }}
            >
              {sc.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const MACHINE_STD_MINS = 8 * 60; // 8h cap per machine

// Compute regular + overtime split for a single machine row
function machineSplit(row) {
  const total = (Number(row.machineHrs)||0)*60 + (Number(row.machineMins)||0);
  const regular  = Math.min(total, MACHINE_STD_MINS);
  const overtime = Math.max(0, total - MACHINE_STD_MINS);
  return { total, regular, overtime };
}

export default function OperatorTimeEntry({ user, onWorkLogged }) {
  const [workCategories, setWorkCategories]   = useState([]);
  const [subCategories, setSubCategories]     = useState([]);
  const [machinesList, setMachinesList]       = useState([]);
  const [selectedDate, setSelectedDate]       = useState(formatDate(TODAY));
  const [calendarDate, setCalendarDate]       = useState(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const [dateStatusMap, setDateStatusMap]     = useState({}); // single source of truth: date -> totalMins
  const [form, setForm] = useState({
    shift:"B", status:"P",
    workCategoryId: null, category:"",
    subCategoryId: null, subCategory:"",
    regularHrs:"", regularMins:"",
    overtimeHrs:"", overtimeMins:"",
    remarks:"",
  });
  const [machineRows, setMachineRows] = useState([]);
  const [submitted, setSubmitted] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [errors, setErrors] = useState({});

  const loadDropdowns = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      // Load Work Categories
      const wcRes = await fetch(`${config.API_URL}/work-categories?active=true`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (wcRes.ok) {
        const wcData = await wcRes.json();
        setWorkCategories(wcData);
      }

      // Machines
      const mRes = await fetch(`${config.API_URL}/machines`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (mRes.ok) {
        const mData = await mRes.json();
        setMachinesList(mData);
        if (mData.length > 0) {
          setMachineRows([{ machine: mData[0].name, machineHrs: "", machineMins: "" }]);
        }
      }

      // Pending entries
      const teRes = await fetch(`${config.API_URL}/time-entries?approvalStatus=Pending`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (teRes.ok) {
        const teData = await teRes.json();
        setPendingRequests(teData);
      }
    } catch (err) {
      console.warn("Failed to load operator dropdowns", err);
    }
  };

  // Fetch ALL entries for the viewed month and build dateStatusMap (for calendar cells and dropdown icon).
  // Always uses all approval statuses so the calendar and the entry-date dropdown always agree.
  const fetchCalendarMonth = async (date) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const y = date.getFullYear();
      const m = date.getMonth();
      const firstDay = new Date(y, m, 1);
      let lastDay  = new Date(y, m + 1, 0);
      if (firstDay > TODAY) return;
      if (lastDay > TODAY) lastDay = TODAY;
      const res = await fetch(
        `${config.API_URL}/time-entries?date_from=${formatDate(firstDay)}&date_to=${formatDate(lastDay)}`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      if (res.ok) {
        const entries = await res.json();
        const map = {};
        entries.forEach(e => {
          const d = e.date;
          const mins = (e.regularMins || 0) + (e.overtimeMins || 0);
          map[d] = (map[d] || 0) + mins;
        });
        setDateStatusMap(prev => ({ ...prev, ...map }));
      }
    } catch (err) {
      console.warn("Failed to fetch calendar month data", err);
    }
  };

  useEffect(() => {
    loadDropdowns();
  }, []);

  // Refresh calendar colour map + dropdown status icons on month change or after a submission
  useEffect(() => {
    fetchCalendarMonth(calendarDate);
  }, [calendarDate, submitted]); // eslint-disable-line

  // Sync calendar view month to the selected date (without double-fetching if month unchanged)
  useEffect(() => {
    const d = new Date(selectedDate);
    if (!isNaN(d.getTime())) {
      const newMonthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      setCalendarDate(prev => {
        if (prev.getFullYear() !== newMonthStart.getFullYear() || prev.getMonth() !== newMonthStart.getMonth()) {
          return newMonthStart;
        }
        return prev;
      });
    }
  }, [selectedDate, submitted]); // eslint-disable-line

  // Load sub-categories when workCategoryId changes (Cascading Dropdown)
  useEffect(() => {
    const wcId = form.workCategoryId;
    if (!wcId) {
      setSubCategories([]);
      setForm(f => ({ ...f, subCategoryId: null, subCategory: "" }));
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    (async () => {
      try {
        const res = await fetch(`${config.API_URL}/sub-categories?workCategoryId=${wcId}&active=true`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSubCategories(data);
        } else {
          setSubCategories([]);
        }
      } catch (err) {
        console.warn("Failed to load subcategories for category", wcId, err);
        setSubCategories([]);
      }
      // NO AUTO-SELECT: Reset subcategory selection and require user to choose manually
      setForm(f => ({ ...f, subCategoryId: null, subCategory: "" }));
    })();
  }, [form.workCategoryId]);

  const emptyMachineRow = () => ({ machine: machinesList[0]?.name || "", machineHrs: "", machineMins: "" });

  const set = (k,v) => setForm((f)=>({...f,[k]:v}));

  const regularTotalMins  = (Number(form.regularHrs)||0)*60 + (Number(form.regularMins)||0);
  const overtimeTotalMins = (Number(form.overtimeHrs)||0)*60 + (Number(form.overtimeMins)||0);
  // Do NOT silently convert regular to OT — backend validates and rejects if exceeded
  const effectiveRegularMins = regularTotalMins;
  const autoOvertimeMins = overtimeTotalMins;
  const totalMins = regularTotalMins + overtimeTotalMins;
  const pendingMins = Math.max(0, DAILY_STD_MINS - effectiveRegularMins);

  const getDayStatus = (mins) => {
    if (mins >= 480) return "green";
    if (mins > 0) return "yellow";
    return "red";
  };

  const totalMachineHrs    = machineRows.reduce((s,r)=>s+(Number(r.machineHrs)||0)+(Number(r.machineMins)||0)/60,0);
  const totalMachineMins   = machineRows.reduce((s,r)=>s+machineSplit(r).total,0);
  const totalMachineRegMins= machineRows.reduce((s,r)=>s+machineSplit(r).regular,0);
  const totalMachineOTMins = machineRows.reduce((s,r)=>s+machineSplit(r).overtime,0);

  const diff = daysDiff(selectedDate);
  const entryMode = diff<=3?"direct":diff<=10?"approval":"blocked";

  const addMachineRow = () => setMachineRows((p)=>[...p,emptyMachineRow()]);
  const removeMachineRow = (i) => setMachineRows((p)=>p.filter((_,idx)=>idx!==i));
  const updateMachineRow = (i,key,val) => setMachineRows((p)=>p.map((r,idx)=>idx===i?{...r,[key]:val}:r));

  const isAbsent = form.status === "AB";

  const validate = () => {
    const e={};
    if (!isAbsent) {
      if (!form.workCategoryId) e.workCategory = "Work Category is required.";
      if (!form.subCategoryId || !form.subCategory) e.subCategory = "Sub Category is required.";
      if (!form.remarks.trim()) e.remarks="Comments are mandatory.";
      if (regularTotalMins===0&&overtimeTotalMins===0) e.hours="Please enter at least some hours worked.";
    }
    setErrors(e);
    return Object.keys(e).length===0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (entryMode==="blocked") return;
    if (!validate()) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const payload = {
      shift: form.shift,
      date: selectedDate,
      category: form.category,
      subCategory: form.subCategory,
      workCategoryId: form.workCategoryId || undefined,
      subCategoryId: form.subCategoryId || undefined,
      status: form.status,
      regularMins: regularTotalMins,
      overtimeMins: overtimeTotalMins,
      remarks: form.remarks,
      machineRows: machineRows.map(r => ({
        machine: r.machine,
        machineHrs: r.machineHrs,
        machineMins: r.machineMins
      }))
    };

    (async () => {
      try {
        const res = await fetch(`${config.API_URL}/time-entries`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const created = await res.json();
          if (created.approvalStatus === "Pending") {
            setSubmitted("approval");
            setPendingRequests((prev) => [created, ...prev]);
          } else {
            setSubmitted("direct");
            if(onWorkLogged) onWorkLogged(selectedDate, effectiveRegularMins, autoOvertimeMins);
          }
          setTimeout(()=>setSubmitted(null), 4000);
            setForm({
              shift: "B", status: "P",
              workCategoryId: null,
              category: "",
              subCategoryId: null, subCategory: "",
              regularHrs: "", regularMins: "", overtimeHrs: "", overtimeMins: "", remarks: ""
            });
          setMachineRows([emptyMachineRow()]);
          setErrors({});
        } else {
          const errData = await res.json();
          alert(errData.detail || "Failed to submit entry.");
        }
      } catch (err) {
        alert("Failed to submit time entry. Server is unreachable.");
      }
    })();
  };

  return (
    <div className="page">
      <div className="container-fluid">
        <h3 style={{ marginBottom:20 }}>Daily Time Entry</h3>

        {pendingRequests.length>0 && (
          <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:8, padding:"10px 16px", marginBottom:16 }}>
            <p style={{ fontWeight:700, fontSize:12.5, color:"#d97706", margin:"0 0 6px" }}>
              ⏳ {pendingRequests.length} late entr{pendingRequests.length>1?"ies":"y"} sent to admin for approval
            </p>
            {pendingRequests.map((r)=>(
              <div key={r.id} style={{ fontSize:12, color:"#92400e", display:"flex", gap:14, padding:"3px 0", borderTop:"1px solid #fde68a", flexWrap:"wrap" }}>
                <span><strong>Date:</strong> {r.date}</span>
                <span><strong>Shift:</strong> {r.shift}</span>
                <span><strong>Worked:</strong> {minsToHM(r.regularMins)}</span>
                <span><strong>Machines:</strong> {(r.machineRows || []).map(m=>`${m.machine}(${m.machineHrs||0}h${m.machineMins||0}m)`).join(", ") || "None"}</span>
                <span style={{ marginLeft:"auto", background:"#fef3c7", color:"#d97706", borderRadius:10, padding:"1px 8px", fontWeight:700, fontSize:11 }}>Pending</span>
              </div>
            ))}
          </div>
        )}

        {submitted==="direct"   && <div className="alert alert-success">✅ Time entry submitted successfully!</div>}
        {submitted==="approval" && <div className="alert alert-warning">⏳ Late entry — approval request sent to admin.</div>}

        <form onSubmit={handleSubmit}>
          <div className="row g-4">
            <div className="col-lg-8">
              <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:"24px 28px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>

                <div style={{ marginBottom:18 }}>
                  <label style={{ display:"block", fontWeight:600, fontSize:13, color:"#475569", marginBottom:6 }}>Employee Email</label>
                  <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:6, padding:"9px 12px", fontSize:13.5, color:"#64748b", display:"flex", alignItems:"center", gap:8 }}>
                    <span>👤</span> {user?.email || "—"}
                  </div>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 160px", gap:16, marginBottom:18 }}>
                  <div>
                    <label style={{ display:"block", fontWeight:600, fontSize:13, color:"#475569", marginBottom:6 }}>Entry Date</label>
                    <select className="form-select" value={selectedDate} onChange={(e)=>setSelectedDate(e.target.value)}>
                      {getLast14Days().map((d)=>{ 
                        const df=daysDiff(d); 
                        const lbl=df===0?"Today":df===1?"Yesterday":`${df} days ago`; 
                        const totalMins = dateStatusMap[d] || 0;
                        const st = getDayStatus(totalMins);
                        const icon = st === "green" ? " ✅" : st === "yellow" ? " ⏳" : " 🔴";
                        return <option key={d} value={d}>{d} — {lbl}{icon}</option>; 
                      })}
                    </select>
                    {entryMode==="approval" && <div style={{ marginTop:7, background:"#fffbeb", border:"1px solid #fde68a", borderRadius:7, padding:"7px 12px", fontSize:12.5, color:"#d97706", fontWeight:600 }}>⏳ Late entry — will be sent for admin approval.</div>}
                    {entryMode==="blocked"  && <div style={{ marginTop:7, background:"#fef2f2", border:"1px solid #fecaca", borderRadius:7, padding:"7px 12px", fontSize:12.5, color:"#dc2626", fontWeight:600 }}>🚫 This date is too old. Contact your admin.</div>}
                  </div>
                  <div>
                    <label style={{ display:"block", fontWeight:600, fontSize:13, color:"#475569", marginBottom:6 }}>Shift</label>
                    <select className="form-select" value={form.shift} onChange={(e)=>set("shift",e.target.value)}>
                      {SHIFT_OPTIONS.map((s)=><option key={s} value={s}>Shift {s}</option>)}
                    </select>
                  </div>
                </div>

                {entryMode!=="blocked" && (
                  <>
                    <div style={{ marginBottom:18 }}>
                      <label style={{ display:"block", fontWeight:600, fontSize:13, color:"#475569", marginBottom:6 }}>Attendance Status</label>
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                        {STATUS_OPTIONS.map((opt)=>(
                          <label key={opt.value} style={{
                            display:"flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:8, cursor:"pointer",
                            border:`2px solid ${form.status===opt.value?(opt.value==="AB"?"#dc2626":"#2563eb"):"#e2e8f0"}`,
                            background:form.status===opt.value?(opt.value==="AB"?"#fee2e2":"#dbeafe"):"#fff",
                            fontSize:13, fontWeight:form.status===opt.value?700:500,
                            color:form.status===opt.value?(opt.value==="AB"?"#dc2626":"#1d4ed8"):"#334155", transition:"all 0.15s",
                          }}>
                            <input type="radio" name="status" value={opt.value} checked={form.status===opt.value} onChange={()=>set("status",opt.value)} style={{ display:"none" }} />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    {isAbsent && (
                      <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, padding:"12px 16px", marginBottom:18 }}>
                        <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#dc2626" }}>
                          🚫 Time entry is not allowed when Attendance Status is marked as Absent.
                        </p>
                        <p style={{ margin:"6px 0 0", fontSize:12, color:"#991b1b" }}>
                          All work detail fields are disabled. Only the absence record will be saved.
                        </p>
                      </div>
                    )}

                    <div style={{ marginBottom:18, opacity: isAbsent ? 0.45 : 1 }}>
                      <label style={{ display:"block", fontWeight:600, fontSize:13, color:"#475569", marginBottom:6 }}>Work Category</label>
                      <select
                        className="form-select"
                        disabled={isAbsent}
                        value={form.workCategoryId || ""}
                        onChange={(e) => {
                          const wc = workCategories.find(w => w.id === Number(e.target.value));
                          setForm(f => ({
                            ...f,
                            workCategoryId: wc ? wc.id : null,
                            category: wc ? wc.name : "",
                            subCategoryId: null,
                            subCategory: ""
                          }));
                          if (e.target.value) setErrors((er)=>({...er,workCategory:undefined}));
                        }}
                        style={{ borderColor: errors.workCategory ? "#dc2626" : undefined }}
                      >
                        <option value="">-- Select Work Category --</option>
                        {workCategories.map((wc) => (
                          <option key={wc.id} value={wc.id}>{wc.name}</option>
                        ))}
                      </select>
                      {errors.workCategory && <p style={{ fontSize:12, color:"#dc2626", margin:"4px 0 0", fontWeight:600 }}>⚠️ {errors.workCategory}</p>}
                    </div>

                    <div style={{ marginBottom:18, opacity: isAbsent ? 0.45 : 1 }}>
                      <label style={{ display:"block", fontWeight:600, fontSize:13, color:"#475569", marginBottom:6 }}>Sub-Category</label>
                      <SearchableSelect
                        options={subCategories}
                        value={form.subCategory}
                        disabled={isAbsent}
                        error={errors.subCategory}
                        placeholder="-- Search Sub Category --"
                        onChange={(sc) => {
                          setForm(f => ({ ...f, subCategory: sc.name, subCategoryId: sc.id }));
                          setErrors((er)=>({...er,subCategory:undefined}));
                        }}
                      />
                      {errors.subCategory && <p style={{ fontSize:12, color:"#dc2626", margin:"4px 0 0", fontWeight:600 }}>⚠️ {errors.subCategory}</p>}
                    </div>

                    {/* Machine entries */}
                    <div style={{ marginBottom:18, opacity: isAbsent ? 0.45 : 1 }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                        <label style={{ fontWeight:700, fontSize:13, color:"#0f172a", margin:0 }}>⚙️ Machine Operation Details</label>
                        <button type="button" onClick={addMachineRow} style={{ background:"#dbeafe", color:"#1d4ed8", border:"1px solid #bfdbfe", borderRadius:8, padding:"5px 12px", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                          + Add Machine
                        </button>
                      </div>
                      <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, padding:"14px 16px" }}>
                        {machineRows.map((row,i)=>{
                          const split = machineSplit(row);
                          return (
                            <div key={i} style={{ marginBottom: i<machineRows.length-1?14:0 }}>
                              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 36px", gap:10, alignItems:"end" }}>
                                <div>
                                  {i===0&&<label style={{ display:"block", fontSize:11.5, fontWeight:600, color:"#64748b", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.4px" }}>Machine</label>}
                                  <select className="form-select" disabled={isAbsent} value={row.machine} onChange={(e)=>updateMachineRow(i,"machine",e.target.value)}>
                                    {machinesList.map((m)=><option key={m.id} value={m.name}>{m.name}</option>)}
                                  </select>
                                </div>
                                <div>
                                  {i===0&&<label style={{ display:"block", fontSize:11.5, fontWeight:600, color:"#64748b", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.4px" }}>Hours</label>}
                                  <div style={{ position:"relative" }}>
                                    <input type="number" className="form-control" min="0" max="24" placeholder="0"
                                      disabled={isAbsent}
                                      value={row.machineHrs}
                                      onChange={(e)=>updateMachineRow(i,"machineHrs",e.target.value)}
                                      style={{ paddingRight:36 }} />
                                    <span style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", fontSize:11, color:"#94a3b8", fontWeight:600 }}>hrs</span>
                                  </div>
                                </div>
                                <div>
                                  {i===0&&<label style={{ display:"block", fontSize:11.5, fontWeight:600, color:"#64748b", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.4px" }}>Minutes</label>}
                                  <div style={{ position:"relative" }}>
                                    <input type="number" className="form-control" min="0" max="59" placeholder="0"
                                      disabled={isAbsent}
                                      value={row.machineMins}
                                      onChange={(e)=>updateMachineRow(i,"machineMins",e.target.value)}
                                      style={{ paddingRight:36 }} />
                                    <span style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", fontSize:11, color:"#94a3b8", fontWeight:600 }}>min</span>
                                  </div>
                                </div>
                                <div style={{ display:"flex", alignItems:i===0?"flex-end":"center" }}>
                                  {machineRows.length>1&&(
                                    <button type="button" onClick={()=>removeMachineRow(i)} style={{ background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:6, width:32, height:32, cursor:"pointer", fontWeight:700, fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
                                  )}
                                </div>
                              </div>
                              {split.overtime > 0 && (
                                <div style={{ marginTop:6, background:"#faf5ff", border:"1px solid #e9d5ff", borderRadius:6, padding:"5px 10px", fontSize:12, color:"#7c3aed", fontWeight:600 }}>
                                  🌙 {minsToHM(split.regular)} regular + {minsToHM(split.overtime)} machine overtime
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <div style={{ marginTop:12, paddingTop:10, borderTop:"1px solid #e2e8f0" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                            <span style={{ fontSize:12.5, color:"#64748b", fontWeight:600 }}>Total Machine Regular:</span>
                            <span style={{ fontSize:14, fontWeight:800, color:"#2563eb", fontFamily:"monospace" }}>{minsToHM(totalMachineRegMins)}</span>
                          </div>
                          {totalMachineOTMins>0 && (
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                              <span style={{ fontSize:12.5, color:"#7c3aed", fontWeight:600 }}>Total Machine Overtime:</span>
                              <span style={{ fontSize:14, fontWeight:800, color:"#7c3aed", fontFamily:"monospace" }}>{minsToHM(totalMachineOTMins)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Hours */}
                    {errors.hours&&<div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:6, padding:"7px 12px", fontSize:12.5, color:"#dc2626", fontWeight:600, marginBottom:10 }}>⚠️ {errors.hours}</div>}
                    <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, padding:"16px", marginBottom:18, opacity: isAbsent ? 0.45 : 1 }}>
                      <p style={{ fontWeight:700, fontSize:12, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.5px", margin:"0 0 14px" }}>⏱ Hours Worked</p>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                        <HrMinInput label="Regular Hours" hours={form.regularHrs} minutes={form.regularMins} disabled={isAbsent}
                          onHoursChange={(v)=>set("regularHrs",v)} onMinutesChange={(v)=>set("regularMins",v)} maxHours={24} />
                        <HrMinInput label="Overtime Hours" hours={form.overtimeHrs} minutes={form.overtimeMins} disabled={isAbsent}
                          onHoursChange={(v)=>set("overtimeHrs",v)} onMinutesChange={(v)=>set("overtimeMins",v)} maxHours={16} />
                      </div>
                      {regularTotalMins>DAILY_STD_MINS && !isAbsent && (
                        <div style={{ marginTop:10, background:"#fef2f2", border:"1px solid #fecaca", borderRadius:6, padding:"7px 12px", fontSize:12.5, color:"#dc2626", fontWeight:600 }}>
                          ⚠️ Regular hours exceed 8h limit. Reduce to ≤8h or the server will reject this entry.
                        </div>
                      )}
                    </div>

                    {/* Mandatory remarks */}
                    <div style={{ marginBottom:20, opacity: isAbsent ? 0.45 : 1 }}>
                      <label style={{ display:"block", fontWeight:600, fontSize:13, color:"#475569", marginBottom:6 }}>
                        Comments / Remarks {!isAbsent && <span style={{ color:"#dc2626" }}>*</span>}
                        {!isAbsent && <span style={{ fontSize:11, color:"#94a3b8", fontWeight:500, marginLeft:6 }}>(required)</span>}
                      </label>
                      <textarea className="form-control" rows={3}
                        disabled={isAbsent}
                        placeholder={isAbsent ? "Not required for absent entries" : "Describe the work / operations done today... (mandatory)"}
                        value={form.remarks}
                        onChange={(e)=>{ set("remarks",e.target.value); if(e.target.value.trim()) setErrors((er)=>({...er,remarks:undefined})); }}
                        style={{ borderColor:errors.remarks?"#dc2626":undefined, cursor: isAbsent ? "not-allowed" : undefined }}
                      />
                      {errors.remarks&&<p style={{ fontSize:12, color:"#dc2626", margin:"4px 0 0", fontWeight:600 }}>⚠️ {errors.remarks}</p>}
                    </div>

                    <button type="submit" className="btn btn-primary w-100" style={{ padding:"11px", fontSize:14, fontWeight:700 }}>
                      {isAbsent ? "📋 Record Absence" : entryMode==="approval" ? "⏳ Send for Approval" : "✓ Save & Submit"}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* RIGHT SUMMARY */}
            <div className="col-lg-4">
              <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:"20px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)", marginBottom:14 }}>
                <h6 style={{ fontWeight:700, fontSize:12, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:14, paddingBottom:10, borderBottom:"1px solid #f1f5f9" }}>Summary</h6>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:"1px solid #f8fafc" }}>
                  <span style={{ fontSize:13, color:"#475569", fontWeight:500 }}>Shift</span>
                  <span style={{ background:"#dbeafe", color:"#1d4ed8", fontWeight:800, fontSize:14, borderRadius:8, padding:"2px 14px" }}>Shift {form.shift}</span>
                </div>
                {[
                  { label:"Regular",  value:minsToHM(effectiveRegularMins), color:"#2563eb" },
                  { label:"Overtime", value:minsToHM(autoOvertimeMins),     color:"#7c3aed" },
                  { label:"Total",    value:minsToHM(totalMins),             color:"#16a34a", bold:true },
                ].map((row)=>(
                  <div key={row.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:"1px solid #f8fafc" }}>
                    <span style={{ fontSize:13, color:"#475569", fontWeight:row.bold?700:500 }}>{row.label}</span>
                    <span style={{ fontSize:row.bold?18:14, fontWeight:800, color:row.color, fontFamily:"monospace" }}>{row.value}</span>
                  </div>
                ))}

                <div style={{ marginTop:12, paddingTop:12, borderTop:"2px solid #f1f5f9" }}>
                  <p style={{ fontSize:11.5, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.5px", margin:"0 0 8px" }}>Daily Target (8h)</p>
                  <div style={{ background:"#f1f5f9", borderRadius:8, height:8, overflow:"hidden", marginBottom:8 }}>
                    <div style={{ height:"100%", borderRadius:8, transition:"width 0.4s", background:effectiveRegularMins>=DAILY_STD_MINS?"#16a34a":"#2563eb", width:`${Math.min(100,(effectiveRegularMins/DAILY_STD_MINS)*100)}%` }} />
                  </div>
                  {pendingMins>0
                    ? <p style={{ fontSize:12.5, fontWeight:700, color:"#d97706", margin:0 }}>⏳ {minsToHM(pendingMins)} still pending</p>
                    : <p style={{ fontSize:12.5, fontWeight:700, color:"#16a34a", margin:0 }}>✅ Daily target met!</p>
                  }
                </div>

                {/* Machine summary */}
                <div style={{ marginTop:12, paddingTop:12, borderTop:"2px solid #f1f5f9" }}>
                  <p style={{ fontSize:11.5, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.5px", margin:"0 0 8px" }}>⚙️ Machines Operated</p>
                  {machineRows.map((r,i)=>{
                    const sp = machineSplit(r);
                    return (
                      <div key={i} style={{ padding:"6px 0", borderBottom:"1px solid #f8fafc" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span style={{ fontSize:12.5, color:"#334155", fontWeight:600 }}>{r.machine}</span>
                          <span style={{ fontSize:13, fontWeight:700, color:"#2563eb", fontFamily:"monospace" }}>{minsToHM(sp.total)}</span>
                        </div>
                        {sp.overtime > 0 && (
                          <div style={{ display:"flex", justifyContent:"space-between", marginTop:2 }}>
                            <span style={{ fontSize:11, color:"#64748b" }}>Reg: {minsToHM(sp.regular)}</span>
                            <span style={{ fontSize:11, color:"#7c3aed", fontWeight:700 }}>OT: {minsToHM(sp.overtime)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {totalMachineOTMins > 0 && (
                    <div style={{ marginTop:8, paddingTop:8, borderTop:"1px dashed #e9d5ff", display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontSize:11.5, color:"#7c3aed", fontWeight:700 }}>Total Machine OT</span>
                      <span style={{ fontSize:13, fontWeight:800, color:"#7c3aed", fontFamily:"monospace" }}>{minsToHM(totalMachineOTMins)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{
                background:form.status==="P"?"#f0fdf4":form.status==="HD"?"#eff6ff":form.status==="L"?"#fef2f2":form.status==="AB"?"#fef2f2":"#fffbeb",
                border:`1px solid ${form.status==="P"?"#bbf7d0":form.status==="HD"?"#bfdbfe":form.status==="L"?"#fecaca":form.status==="AB"?"#fecaca":"#fde68a"}`,
                borderRadius:10, padding:"14px 16px",
              }}>
                <p style={{ fontSize:11.5, fontWeight:700, color:"#64748b", textTransform:"uppercase", margin:"0 0 4px" }}>Status</p>
                <p style={{ fontSize:18, fontWeight:800, margin:0, color:form.status==="P"?"#16a34a":form.status==="HD"?"#2563eb":(form.status==="L"||form.status==="AB")?"#dc2626":"#d97706" }}>
                  {STATUS_OPTIONS.find((s)=>s.value===form.status)?.label}
                </p>
              </div>

              {/* Monthly Calendar Status Indicator */}
              {(() => {
                const y = calendarDate.getFullYear();
                const m = calendarDate.getMonth();
                const daysInMonth = new Date(y, m + 1, 0).getDate();
                const startDay = new Date(y, m, 1).getDay(); // 0 is Sunday
                const offset = startDay === 0 ? 6 : startDay - 1; // Make Monday=0
                
                const handlePrev = () => setCalendarDate(new Date(y, m - 1, 1));
                const handleNext = () => setCalendarDate(new Date(y, m + 1, 1));

                const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
                
                const cells = [];
                for (let i = 0; i < offset; i++) cells.push(null);
                for (let i = 1; i <= daysInMonth; i++) cells.push(i);

                const weeks = [];
                for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

                return (
                  <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, padding:"12px", marginTop:14, boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"#1e88e5", color:"#fff", padding:"8px 12px", borderRadius:"6px" }}>
                      <button type="button" onClick={handlePrev} style={{ border:"none", background:"transparent", color:"#fff", cursor:"pointer", padding:"0", fontSize:14, fontWeight:"bold" }}>◀</button>
                      <span style={{ fontWeight:700, fontSize:14 }}>{monthNames[m]} {y}</span>
                      <button type="button" onClick={handleNext} style={{ border:"none", background:"transparent", color:"#fff", cursor:"pointer", padding:"0", fontSize:14, fontWeight:"bold" }}>▶</button>
                    </div>
                    <table style={{ width:"100%", marginTop:10, textAlign:"center", borderCollapse:"collapse", fontSize:12, tableLayout:"fixed" }}>
                      <thead>
                        <tr style={{ color:"#64748b" }}>
                          <th style={{ fontWeight:600, paddingBottom:8 }}>Mo</th><th style={{ fontWeight:600, paddingBottom:8 }}>Tu</th><th style={{ fontWeight:600, paddingBottom:8 }}>We</th>
                          <th style={{ fontWeight:600, paddingBottom:8 }}>Th</th><th style={{ fontWeight:600, paddingBottom:8 }}>Fr</th><th style={{ fontWeight:600, paddingBottom:8 }}>Sa</th><th style={{ fontWeight:600, paddingBottom:8 }}>Su</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weeks.map((week, wi) => (
                          <tr key={wi}>
                            {week.map((day, di) => {
                              if (!day) return <td key={di} style={{ padding: "4px" }}></td>;
                              const dateStr = `${y}-${String(m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                              const isSelected = dateStr === selectedDate;
                              const dObj = new Date(y, m, day);
                              dObj.setHours(0,0,0,0);
                              const isFuture = dObj > TODAY;
                              
                              let bg = "transparent";
                              let color = "#334155";
                              let border = "1px solid transparent";
                              
                              if (!isFuture) {
                                const totalMins = dateStatusMap[dateStr] || 0;
                                const st = getDayStatus(totalMins);
                                if (st === "green") {
                                  bg = "#16a34a"; color = "#fff"; // Green
                                } else if (st === "yellow") {
                                  bg = "#eab308"; color = "#fff"; // Yellow
                                } else {
                                  bg = "#dc2626"; color = "#fff"; // Red
                                }
                                border = "1px solid rgba(0,0,0,0.1)";
                              }
                              
                              return (
                                <td key={di} style={{ padding: "3px" }}>
                                  <div 
                                    onClick={() => {
                                      if (!isFuture) {
                                        const df = daysDiff(dateStr);
                                        if (df >= 0 && df <= 14) {
                                          setSelectedDate(dateStr);
                                        }
                                      }
                                    }}
                                    style={{ 
                                      width:"28px", height:"28px", lineHeight:"26px", margin:"auto", 
                                      background: bg, color: color, 
                                      border: border, 
                                      cursor: isFuture || daysDiff(dateStr) > 14 ? "not-allowed" : "pointer",
                                      fontWeight: isSelected ? "bold" : "normal",
                                      borderRadius: "4px",
                                      boxShadow: isSelected ? "0 0 0 2px #fff, 0 0 0 4px #1d4ed8" : "none"
                                    }}>
                                    {day}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
