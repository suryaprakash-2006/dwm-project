import React, { useState, useEffect, useRef } from "react";
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
const DAILY_STD_MINS = 8 * 60; // 480

const TODAY = new Date(); TODAY.setHours(0,0,0,0);
function daysDiff(dateStr) { const d=new Date(dateStr); d.setHours(0,0,0,0); return Math.floor((TODAY-d)/(1000*60*60*24)); }
// Use local date parts — toISOString() returns UTC which breaks dates in IST (+5:30) and similar timezones
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

// ── Searchable Sub-Category Combobox ─────────────────────────────────────────
function SearchableSelect({ options, value, onChange, disabled, error, placeholder }) {
  const [search, setSearch] = useState("");
  const [open, setOpen]     = useState(false);
  const ref = useRef(null);

  const selectedLabel = options.find(o => o.name === value)?.name || "";
  const filtered = options.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  // Close on outside click
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

// HrMin input component
function HrMinInput({ label, hours, minutes, onHoursChange, onMinutesChange, maxHours=24, disabled=false, required=false }) {
  return (
    <div>
      <label style={{ display:"block", fontWeight:600, fontSize:13, color:"#475569", marginBottom:6 }}>
        {label}{required && <span style={{ color:"#dc2626" }}> *</span>}
      </label>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
        <div style={{ position:"relative" }}>
          <input type="number" className="form-control" min="0" max={maxHours} placeholder="0"
            value={hours} disabled={disabled}
            onChange={(e)=>{ const v=e.target.value; if(v===""||Number(v)>=0) onHoursChange(v); }}
            style={{ paddingRight:36 }} />
          <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", fontSize:11, color:"#94a3b8", fontWeight:600 }}>hrs</span>
        </div>
        <div style={{ position:"relative" }}>
          <input type="number" className="form-control" min="0" max="59" placeholder="0"
            value={minutes} disabled={disabled}
            onChange={(e)=>{ const v=e.target.value; if(v===""||Number(v)>=0) onMinutesChange(v); }}
            style={{ paddingRight:36 }} />
          <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", fontSize:11, color:"#94a3b8", fontWeight:600 }}>min</span>
        </div>
      </div>
    </div>
  );
}

export default function TimeEntry({ user, onWorkLogged }) {
  const [selectedDate, setSelectedDate] = useState(formatDate(TODAY));

  const [workCategories, setWorkCategories]   = useState([]);
  const [subCategories, setSubCategories]     = useState([]);
  const [dateStatusMap, setDateStatusMap]     = useState({}); // single source of truth: date -> totalMins
  const [dailyLimit, setDailyLimit]           = useState(null); // {remainingRegularMins, usedRegularMins}

  const [form, setForm] = useState({
    shift:"B", status:"P",
    workCategoryId: null, category:"",
    subCategoryId: null, subCategory:"",
    regularHrs:"", regularMins:"",
    overtimeHrs:"", overtimeMins:"",
    remarks:"",
  });
  const [calendarDate, setCalendarDate]   = useState(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const [submitted, setSubmitted]         = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [errors, setErrors]               = useState({});
  const [draftEntryId, setDraftEntryId]   = useState(null); // ID of existing Draft for selected date
  const [savedDrafts, setSavedDrafts]     = useState([]); // List of all drafts for user

  const isAbsent = form.status === "AB";

  // Single fetch that populates both the dropdown status icons AND the calendar colour map.
  // Aggregates ALL entries (any approval status) per date so both views always agree.
  const loadData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      // Load work categories
      const wcRes = await fetch(`${config.API_URL}/work-categories?active=true`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (wcRes.ok) setWorkCategories(await wcRes.json());

      // Load pending requests
      const teRes = await fetch(`${config.API_URL}/time-entries?approvalStatus=Pending`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (teRes.ok) setPendingRequests(await teRes.json());
    } catch (err) {
      console.warn("Failed to load time entry form data", err);
    }
  };

  // Fetch ALL entries for a given month and build a single dateStatusMap.
  // This map serves BOTH the dropdown status icons and the calendar cells.
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
        const map = {}; // { YYYY-MM-DD: totalMins }
        entries.forEach(e => {
          if (e.approvalStatus === "Draft") return; // Exclude drafts from calendar calculations
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

  // Fetch real daily limit from backend for selected date
  const fetchDailyLimit = async (dateStr) => {
    if (!user?.id) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(
        `${config.API_URL}/time-entries/daily-limit-check?empId=${user.id}&date=${dateStr}`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      if (res.ok) setDailyLimit(await res.json());
    } catch (err) {
      console.warn("Failed to fetch daily limit", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Refresh calendar + dropdown status icons whenever the viewed month or a submission changes
  useEffect(() => {
    fetchCalendarMonth(calendarDate);
  }, [calendarDate, submitted]); // eslint-disable-line

  // Refresh daily limit & sync calendar view month whenever selected date or submission changes
  useEffect(() => {
    fetchDailyLimit(selectedDate);
    fetchDraftEntry(selectedDate);
    fetchAllDrafts();
    const d = new Date(selectedDate);
    if (!isNaN(d.getTime())) {
      const newMonthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      setCalendarDate(prev => {
        // Only update if the month actually changed to avoid double-fetching
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
    })();
  }, [form.workCategoryId]);

  const fetchDraftEntry = async (dateStr) => {
    if (!user?.id) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(
        `${config.API_URL}/time-entries?date=${dateStr}&empId=${user.id}`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      if (res.ok) {
        const entries = await res.json();
        const draft = entries.find(e => e.approvalStatus === "Draft");
        if (draft) {
          // Restore draft into form and remember its ID
          setDraftEntryId(draft.id);
          setForm({
            shift: draft.shift || "B",
            status: draft.status || "P",
            workCategoryId: draft.workCategoryId || null,
            category: draft.category || "",
            subCategoryId: draft.subCategoryId || null,
            subCategory: draft.subCategory || "",
            regularHrs: draft.regularMins ? Math.floor(draft.regularMins / 60) : "",
            regularMins: draft.regularMins ? draft.regularMins % 60 : "",
            overtimeHrs: draft.overtimeMins ? Math.floor(draft.overtimeMins / 60) : "",
            overtimeMins: draft.overtimeMins ? draft.overtimeMins % 60 : "",
            remarks: draft.remarks || ""
          });
        } else {
          // No draft for this date — clear any previously loaded draft state
          setDraftEntryId(null);
          setForm({
            shift: "B", status: "P",
            workCategoryId: null, category: "",
            subCategoryId: null, subCategory: "",
            regularHrs: "", regularMins: "", overtimeHrs: "", overtimeMins: "", remarks: ""
          });
          setErrors({});
        }
      }
    } catch (err) {
      console.warn("Failed to fetch draft entry", err);
    }
  };

  const fetchAllDrafts = async () => {
    if (!user?.id) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(
        `${config.API_URL}/time-entries?approvalStatus=Draft&empId=${user.id}`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      if (res.ok) setSavedDrafts(await res.json());
    } catch (err) {
      console.warn("Failed to fetch all drafts", err);
    }
  };

  const handleDeleteDraft = async (id) => {
    if (!window.confirm("Are you sure you want to delete this draft?")) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${config.API_URL}/time-entries/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAllDrafts();
        if (draftEntryId === id) {
           // Current draft was deleted, reset the form for the selected date
           fetchDraftEntry(selectedDate);
        }
      } else {
        alert("Failed to delete draft.");
      }
    } catch (err) {
      alert("Failed to delete draft.");
    }
  };

  const handleOpenDraft = (draft) => {
    setSelectedDate(draft.date);
    // Changing selectedDate automatically triggers fetchDraftEntry via useEffect
  };



  const set = (k,v) => setForm((f)=>({...f,[k]:v}));

  const regularTotalMins  = (Number(form.regularHrs)||0)*60 + (Number(form.regularMins)||0);
  const overtimeTotalMins = (Number(form.overtimeHrs)||0)*60 + (Number(form.overtimeMins)||0);

  // Do NOT silently convert regular to OT. Send exactly what the user entered.
  // Backend will validate and reject if limits are exceeded.
  const effectiveRegularMins = regularTotalMins;
  const autoOvertimeMins = overtimeTotalMins;
  const totalMins = regularTotalMins + overtimeTotalMins;
  const pendingMins = Math.max(0, DAILY_STD_MINS - effectiveRegularMins);

  const getDayStatus = (mins) => {
    if (mins >= 480) return "green";
    if (mins > 0) return "yellow";
    return "red";
  };

  const diff = daysDiff(selectedDate);
  const entryMode = diff<=3?"direct":diff<=10?"approval":"blocked";

  // Real remaining mins for the selected date (from API), or fallback to form-input calc
  const apiRemainingMins = dailyLimit ? dailyLimit.remainingRegularMins : null;
  const apiUsedMins      = dailyLimit ? dailyLimit.usedRegularMins      : 0;
  // For the progress bar: combine API used + current form regular input
  const combinedRegMins  = apiUsedMins + regularTotalMins;
  const displayPendingMins = apiRemainingMins !== null
    ? Math.max(0, apiRemainingMins - regularTotalMins)
    : Math.max(0, DAILY_STD_MINS - regularTotalMins);

  const validate = (isDraft) => {
    const e = {};
    if (!isAbsent) {
      if (!form.workCategoryId) e.workCategory = "Work Category is required.";
      if (!form.subCategoryId || !form.subCategory) e.subCategory = "Sub Category is required.";
      if (!isDraft && !form.remarks.trim()) e.remarks = "Comments are mandatory.";
      if (!isDraft && regularTotalMins===0 && overtimeTotalMins===0) e.hours = "Please enter at least some hours worked.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e, isDraft = false) => {
    if (e) e.preventDefault();
    if (entryMode==="blocked") return;
    if (!validate(isDraft)) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const payload = {
      shift: form.shift,
      date: selectedDate,
      // Backward-compatible string fields
      category: form.category,
      subCategory: form.subCategory,
      // New ID fields for analytics and reporting
      workCategoryId: form.workCategoryId || undefined,
      subCategoryId: form.subCategoryId || undefined,
      status: form.status,
      regularMins: regularTotalMins,
      overtimeMins: overtimeTotalMins,
      remarks: form.remarks,
      approvalStatus: isDraft ? "Draft" : undefined
    };

    (async () => {
      try {
        if (isDraft && draftEntryId) {
          // Update the existing draft (PATCH via PUT update endpoint)
          const updateRes = await fetch(`${config.API_URL}/time-entries/${draftEntryId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              shift: form.shift,
              status: form.status,
              category: form.category,
              subCategory: form.subCategory,
              workCategoryId: form.workCategoryId || undefined,
              subCategoryId: form.subCategoryId || undefined,
              regularMins: regularTotalMins,
              overtimeMins: overtimeTotalMins,
              remarks: form.remarks,
              approvalStatus: "Draft"
            })
          });
          if (updateRes.ok) {
            setSubmitted("draft");
            setTimeout(() => setSubmitted(null), 4000);
          } else {
            const errData = await updateRes.json();
            alert(errData.detail || "Failed to update draft.");
          }
          return;
        }

        // If submitting for real AND a draft exists for this date, delete it first
        if (!isDraft && draftEntryId) {
          try {
            await fetch(`${config.API_URL}/time-entries/${draftEntryId}`, {
              method: "DELETE",
              headers: { "Authorization": `Bearer ${token}` }
            });
          } catch (_) {
            // Non-fatal: proceed with submission even if draft delete fails
          }
          setDraftEntryId(null);
        }

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
          if (isDraft) {
            setDraftEntryId(created.id); // Remember new draft ID
            setSubmitted("draft");
          } else if (created.approvalStatus === "Pending") {
            setSubmitted("approval");
            setPendingRequests((prev) => [created, ...prev]);
          } else {
            setSubmitted("direct");
            if (onWorkLogged) onWorkLogged(selectedDate, effectiveRegularMins, autoOvertimeMins);
          }
          setTimeout(()=>setSubmitted(null), 4000);
          if (!isDraft) {
            // Only reset form on final submission, not on draft save
            setDraftEntryId(null);
            setForm({
              shift: "B", status: "P",
              workCategoryId: null,
              category: "",
              subCategoryId: null, subCategory: "",
              regularHrs: "", regularMins: "", overtimeHrs: "", overtimeMins: "", remarks: ""
            });
            setErrors({});
          }
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
                <span><strong>Category:</strong> {r.category}</span>
                {r.subCategory && <span><strong>Sub Category:</strong> {r.subCategory}</span>}
                <span><strong>Worked:</strong> {minsToHM((r.regularMins || 0) + (r.overtimeMins || 0))}</span>
                <span style={{ marginLeft:"auto", background:"#fef3c7", color:"#d97706", borderRadius:10, padding:"1px 8px", fontWeight:700, fontSize:11 }}>Pending</span>
              </div>
            ))}
          </div>
        )}

        {submitted==="direct"   && <div className="alert alert-success">✅ Time entry submitted successfully!</div>}
        {submitted==="approval" && <div className="alert alert-warning">⏳ Late entry — approval request sent to admin.</div>}
        {submitted==="draft" && <div className="alert alert-info">📝 Draft saved successfully!</div>}

        {/* Saved Drafts Panel */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>Saved Drafts</h4>
          {savedDrafts.length === 0 ? (
            <p style={{ fontSize: 13, color: "#64748b", fontStyle: "italic" }}>No saved drafts.</p>
          ) : (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {savedDrafts.map(draft => (
                <div key={draft.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 14, minWidth: 260, flex: "1 1 260px", maxWidth: 350, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{draft.date}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>Shift {draft.shift}</div>
                    </div>
                    <span style={{ background: "#e2e8f0", color: "#475569", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12 }}>Draft</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#334155", marginBottom: 4 }}>
                    <strong>Category:</strong> {draft.category || "—"}<br/>
                    <strong>Sub Task:</strong> {draft.subCategory || "—"}
                  </div>
                  <div style={{ fontSize: 12, color: "#475569", marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    <em>{draft.remarks || "No remarks"}</em>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" onClick={() => handleOpenDraft(draft)} className="btn btn-sm btn-outline-primary" style={{ flex: 1, fontSize: 12 }}>Open</button>
                    <button type="button" onClick={() => handleDeleteDraft(draft.id)} className="btn btn-sm btn-outline-danger" style={{ fontSize: 12 }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)}>
          <div className="row g-4">
            <div className="col-lg-8">
              <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:"24px 28px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>

                {/* Editing Draft Badge */}
                {draftEntryId && (
                  <div style={{ marginBottom: 16, background: "#fef9c3", border: "1px solid #fde047", borderRadius: 8, padding: "8px 12px", display: "inline-block", fontSize: 13, fontWeight: 600, color: "#854d0e" }}>
                    🟡 Editing Draft for {selectedDate}
                  </div>
                )}

                {/* Email */}
                <div style={{ marginBottom:18 }}>
                  <label style={{ display:"block", fontWeight:600, fontSize:13, color:"#475569", marginBottom:6 }}>Employee Email</label>
                  <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:6, padding:"9px 12px", fontSize:13.5, color:"#64748b", display:"flex", alignItems:"center", gap:8 }}>
                    <span>👤</span> {user?.email || "—"}
                  </div>
                </div>

                {/* Date + Shift */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 160px", gap:16, marginBottom:18 }}>
                  <div>
                    <label style={{ display:"block", fontWeight:600, fontSize:13, color:"#475569", marginBottom:6 }}>Entry Date</label>
                    <select className="form-select" value={selectedDate} onChange={(e)=>setSelectedDate(e.target.value)}>
                      {getLast14Days().map((d)=>{
                        const df = daysDiff(d);
                        const lbl = df===0?"Today":df===1?"Yesterday":`${df} days ago`;
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
                    {/* Attendance */}
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

                    {/* Absent warning — shown when AB is selected */}
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

                    {/* Work Category */}
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
                        style={{ borderColor: errors.workCategory ? "#dc2626" : undefined, cursor: isAbsent ? "not-allowed" : undefined }}
                      >
                        <option value="">-- Select Work Category --</option>
                        {workCategories.map((wc) => (
                          <option key={wc.id} value={wc.id}>{wc.name}</option>
                        ))}
                      </select>
                      {errors.workCategory && <p style={{ fontSize:12, color:"#dc2626", margin:"4px 0 0", fontWeight:600 }}>⚠️ {errors.workCategory}</p>}
                      {workCategories.length === 0 && (
                        <p style={{ fontSize:12, color:"#94a3b8", marginTop:4 }}>No work categories configured. Contact Super Admin.</p>
                      )}
                    </div>

                    {/* Sub Category — searchable combobox */}
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
                      {subCategories.length === 0 && form.workCategoryId && !isAbsent && (
                        <p style={{ fontSize:12, color:"#94a3b8", marginTop:4 }}>No sub-categories assigned to this work category yet. Contact your Admin.</p>
                      )}
                    </div>

                    {/* Hours - Regular + Overtime with hrs & mins */}
                    {errors.hours && <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:6, padding:"7px 12px", fontSize:12.5, color:"#dc2626", fontWeight:600, marginBottom:10 }}>⚠️ {errors.hours}</div>}

                    <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, padding:"16px", marginBottom:18, opacity: isAbsent ? 0.45 : 1 }}>
                      <p style={{ fontWeight:700, fontSize:12, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.5px", margin:"0 0 14px" }}>⏱ Hours Worked</p>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                        <HrMinInput
                          label="Regular Hours"
                          hours={form.regularHrs} minutes={form.regularMins}
                          onHoursChange={(v)=>set("regularHrs",v)}
                          onMinutesChange={(v)=>set("regularMins",v)}
                          maxHours={24} disabled={isAbsent}
                        />
                        <HrMinInput
                          label="Overtime Hours"
                          hours={form.overtimeHrs} minutes={form.overtimeMins}
                          onHoursChange={(v)=>set("overtimeHrs",v)}
                          onMinutesChange={(v)=>set("overtimeMins",v)}
                          maxHours={16} disabled={isAbsent}
                        />
                      </div>
                      {regularTotalMins > DAILY_STD_MINS && !isAbsent && (
                        <div style={{ marginTop:10, background:"#fef2f2", border:"1px solid #fecaca", borderRadius:6, padding:"7px 12px", fontSize:12.5, color:"#dc2626", fontWeight:600 }}>
                          ⚠️ Regular hours exceed 8h limit. Reduce to ≤8h or the server will reject this entry.
                        </div>
                      )}
                    </div>

                    {/* Remarks — mandatory (disabled for AB) */}
                    <div style={{ marginBottom:20, opacity: isAbsent ? 0.45 : 1 }}>
                      <label style={{ display:"block", fontWeight:600, fontSize:13, color:"#475569", marginBottom:6 }}>
                        Comments / Remarks {!isAbsent && <span style={{ color:"#dc2626" }}>*</span>}
                        {!isAbsent && <span style={{ fontSize:11, color:"#94a3b8", fontWeight:500, marginLeft:6 }}>(required)</span>}
                      </label>
                      <textarea
                        className="form-control"
                        rows={3}
                        disabled={isAbsent}
                        placeholder={isAbsent ? "Not required for absent entries" : "Describe the work done today... (mandatory)"}
                        value={form.remarks}
                        onChange={(e)=>{ set("remarks",e.target.value); if(e.target.value.trim()) setErrors((er)=>({...er,remarks:undefined})); }}
                        style={{ borderColor: errors.remarks ? "#dc2626" : undefined, cursor: isAbsent ? "not-allowed" : undefined }}
                      />
                      {errors.remarks && <p style={{ fontSize:12, color:"#dc2626", margin:"4px 0 0", fontWeight:600 }}>⚠️ {errors.remarks}</p>}
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                      <button type="button" className="btn btn-secondary w-100" style={{ padding:"11px", fontSize:14, fontWeight:700 }} onClick={(e) => handleSubmit(e, true)}>
                        📝 Save for Later
                      </button>
                      <button type="submit" className="btn btn-primary w-100" style={{ padding:"11px", fontSize:14, fontWeight:700 }}>
                        {isAbsent ? "📋 Record Absence" : entryMode==="approval" ? "⏳ Send for Approval" : "✓ Save & Submit"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* RIGHT SUMMARY */}
            <div className="col-lg-4">
              <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:"20px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)", marginBottom:14 }}>
                <h6 style={{ fontWeight:700, fontSize:12, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:14, paddingBottom:10, borderBottom:"1px solid #f1f5f9" }}>
                  Summary
                </h6>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:"1px solid #f8fafc" }}>
                  <span style={{ fontSize:13, color:"#475569", fontWeight:500 }}>Shift</span>
                  <span style={{ background:"#dbeafe", color:"#1d4ed8", fontWeight:800, fontSize:14, borderRadius:8, padding:"2px 14px" }}>Shift {form.shift}</span>
                </div>
                {[
                  { label:"Regular",  value:minsToHM(effectiveRegularMins), color:"#2563eb" },
                  { label:"Overtime", value:minsToHM(autoOvertimeMins),    color:"#7c3aed" },
                  { label:"Total",    value:minsToHM(totalMins),            color:"#16a34a", bold:true },
                ].map((row)=>(
                  <div key={row.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:"1px solid #f8fafc" }}>
                    <span style={{ fontSize:13, color:"#475569", fontWeight:row.bold?700:500 }}>{row.label}</span>
                    <span style={{ fontSize:row.bold?18:14, fontWeight:800, color:row.color, fontFamily:"monospace" }}>{row.value}</span>
                  </div>
                ))}

                {/* Remaining Hours — pulled from real API daily-limit-check */}
                <div style={{ marginTop:12, paddingTop:12, borderTop:"2px solid #f1f5f9" }}>
                  <p style={{ fontSize:11.5, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.5px", margin:"0 0 8px" }}>Daily Target (8h)</p>
                  <div style={{ background:"#f1f5f9", borderRadius:8, height:8, overflow:"hidden", marginBottom:8 }}>
                    <div style={{
                      height:"100%", borderRadius:8, transition:"width 0.4s",
                      background: combinedRegMins>=DAILY_STD_MINS?"#16a34a":"#2563eb",
                      width:`${Math.min(100,(combinedRegMins/DAILY_STD_MINS)*100)}%`,
                    }} />
                  </div>
                  {apiRemainingMins !== null && apiUsedMins > 0 && (
                    <p style={{ fontSize:11, color:"#94a3b8", margin:"0 0 4px" }}>Already logged: {minsToHM(apiUsedMins)}</p>
                  )}
                  {displayPendingMins > 0
                    ? <p style={{ fontSize:12.5, fontWeight:700, color:"#d97706", margin:0 }}>⏳ {minsToHM(displayPendingMins)} remaining</p>
                    : <p style={{ fontSize:12.5, fontWeight:700, color:"#16a34a", margin:0 }}>✅ Daily target met!</p>
                  }
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
