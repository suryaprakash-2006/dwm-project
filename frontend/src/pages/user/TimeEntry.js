import React, { useState, useEffect } from "react";
import "../../styles/theme.css";
import config from "../../config";

const CATEGORIES = [
  "Task against order","Improvements / Development","Complaints",
  "New enquiry / RFQ","LBE","Supporting Activities","General","Travel / OD",
];
const STATUS_OPTIONS = [
  { value:"P",  label:"Present"  },
  { value:"HD", label:"Half Day" },
  { value:"L",  label:"Leave"    },
  { value:"OD", label:"On Duty"  },
];
const SHIFT_OPTIONS = ["A","B","C"];
const DAILY_STD_MINS = 8 * 60; // 480

const TODAY = new Date(); TODAY.setHours(0,0,0,0);
function daysDiff(dateStr) { const d=new Date(dateStr); d.setHours(0,0,0,0); return Math.floor((TODAY-d)/(1000*60*60*24)); }
function formatDate(d) { return d.toISOString().split("T")[0]; }
function getLast14Days() {
  const days=[];
  for(let i=0;i<14;i++) { const d=new Date(TODAY); d.setDate(TODAY.getDate()-i); days.push(formatDate(d)); }
  return days;
}
function minsToHM(mins) {
  const h=Math.floor(mins/60); const m=mins%60;
  return m===0?`${h}h`:`${h}h ${m}m`;
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
  const [subCategories, setSubCategories] = useState([]);
  const [form, setForm] = useState({
    shift:"A", status:"P", category:CATEGORIES[0], subCategory:"",
    regularHrs:"", regularMins:"",
    overtimeHrs:"", overtimeMins:"",
    remarks:"",
  });
  const [submitted, setSubmitted] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [errors, setErrors] = useState({});

  const loadData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const scRes = await fetch(`${config.API_URL}/sub-categories`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (scRes.ok) {
        const scData = await scRes.json();
        setSubCategories(scData);
        if (scData.length > 0) {
          setForm(f => ({ ...f, subCategory: scData[0].name }));
        }
      }

      const teRes = await fetch(`${config.API_URL}/time-entries?approvalStatus=Pending`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (teRes.ok) {
        const teData = await teRes.json();
        setPendingRequests(teData);
      }
    } catch (err) {
      console.warn("Failed to load subcategories or time entries", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const set = (k,v) => setForm((f)=>({...f,[k]:v}));

  const regularTotalMins  = (Number(form.regularHrs)||0)*60 + (Number(form.regularMins)||0);
  const overtimeTotalMins = (Number(form.overtimeHrs)||0)*60 + (Number(form.overtimeMins)||0);

  // Do NOT silently convert regular to OT. Send exactly what the user entered.
  // Backend will validate and reject if limits are exceeded.
  const effectiveRegularMins = regularTotalMins;
  const autoOvertimeMins = overtimeTotalMins;
  const totalMins = regularTotalMins + overtimeTotalMins;
  const pendingMins = Math.max(0, DAILY_STD_MINS - effectiveRegularMins);

  const diff = daysDiff(selectedDate);
  const entryMode = diff<=3?"direct":diff<=10?"approval":"blocked";

  const validate = () => {
    const e = {};
    if (!form.remarks.trim()) e.remarks = "Comments are mandatory.";
    if (regularTotalMins===0 && overtimeTotalMins===0) e.hours = "Please enter at least some hours worked.";
    setErrors(e);
    return Object.keys(e).length === 0;
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
      status: form.status,
      regularMins: regularTotalMins,
      overtimeMins: overtimeTotalMins,
      remarks: form.remarks
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
            if (onWorkLogged) onWorkLogged(selectedDate, effectiveRegularMins, autoOvertimeMins);
          }
          setTimeout(()=>setSubmitted(null), 4000);
          setForm({ 
            shift: "A", status: "P", category: CATEGORIES[0], subCategory: subCategories[0]?.name || "",
            regularHrs: "", regularMins: "", overtimeHrs: "", overtimeMins: "", remarks: "" 
          });
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
                <span><strong>Category:</strong> {r.category}</span>
                <span><strong>Worked:</strong> {minsToHM(r.regularTotalMins)}</span>
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
                      {getLast14Days().map((d)=>{ const df=daysDiff(d); const lbl=df===0?"Today":df===1?"Yesterday":`${df} days ago`; return <option key={d} value={d}>{d} — {lbl}</option>; })}
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
                            border:`2px solid ${form.status===opt.value?"#2563eb":"#e2e8f0"}`,
                            background:form.status===opt.value?"#dbeafe":"#fff",
                            fontSize:13, fontWeight:form.status===opt.value?700:500,
                            color:form.status===opt.value?"#1d4ed8":"#334155", transition:"all 0.15s",
                          }}>
                            <input type="radio" name="status" value={opt.value} checked={form.status===opt.value} onChange={()=>set("status",opt.value)} style={{ display:"none" }} />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Category */}
                    <div style={{ marginBottom:18 }}>
                      <label style={{ display:"block", fontWeight:600, fontSize:13, color:"#475569", marginBottom:6 }}>Work Category</label>
                      <select className="form-select" value={form.category} onChange={(e)=>set("category",e.target.value)}>
                        {CATEGORIES.map((c)=><option key={c}>{c}</option>)}
                      </select>
                    </div>

                    {/* Sub Category */}
                    <div style={{ marginBottom:18 }}>
                      <label style={{ display:"block", fontWeight:600, fontSize:13, color:"#475569", marginBottom:6 }}>Sub-Category</label>
                      <select className="form-select" value={form.subCategory} onChange={(e)=>set("subCategory",e.target.value)}>
                        {subCategories.map((c)=><option key={c.id || c.name} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>

                    {/* Hours - Regular + Overtime with hrs & mins */}
                    {errors.hours && <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:6, padding:"7px 12px", fontSize:12.5, color:"#dc2626", fontWeight:600, marginBottom:10 }}>⚠️ {errors.hours}</div>}

                    <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, padding:"16px", marginBottom:18 }}>
                      <p style={{ fontWeight:700, fontSize:12, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.5px", margin:"0 0 14px" }}>⏱ Hours Worked</p>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                        <HrMinInput
                          label="Regular Hours"
                          hours={form.regularHrs} minutes={form.regularMins}
                          onHoursChange={(v)=>set("regularHrs",v)}
                          onMinutesChange={(v)=>set("regularMins",v)}
                          maxHours={24}
                        />
                        <HrMinInput
                          label="Overtime Hours"
                          hours={form.overtimeHrs} minutes={form.overtimeMins}
                          onHoursChange={(v)=>set("overtimeHrs",v)}
                          onMinutesChange={(v)=>set("overtimeMins",v)}
                          maxHours={16}
                        />
                      </div>
                      {regularTotalMins > DAILY_STD_MINS && (
                        <div style={{ marginTop:10, background:"#fef2f2", border:"1px solid #fecaca", borderRadius:6, padding:"7px 12px", fontSize:12.5, color:"#dc2626", fontWeight:600 }}>
                          ⚠️ Regular hours exceed 8h limit. Reduce to ≤8h or the server will reject this entry.
                        </div>
                      )}
                    </div>

                    {/* Remarks — mandatory */}
                    <div style={{ marginBottom:20 }}>
                      <label style={{ display:"block", fontWeight:600, fontSize:13, color:"#475569", marginBottom:6 }}>
                        Comments / Remarks <span style={{ color:"#dc2626" }}>*</span>
                        <span style={{ fontSize:11, color:"#94a3b8", fontWeight:500, marginLeft:6 }}>(required)</span>
                      </label>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Describe the work done today... (mandatory)"
                        value={form.remarks}
                        onChange={(e)=>{ set("remarks",e.target.value); if(e.target.value.trim()) setErrors((er)=>({...er,remarks:undefined})); }}
                        style={{ borderColor: errors.remarks ? "#dc2626" : undefined }}
                      />
                      {errors.remarks && <p style={{ fontSize:12, color:"#dc2626", margin:"4px 0 0", fontWeight:600 }}>⚠️ {errors.remarks}</p>}
                    </div>

                    <button type="submit" className="btn btn-primary w-100" style={{ padding:"11px", fontSize:14, fontWeight:700 }}>
                      {entryMode==="approval" ? "⏳ Send for Approval" : "✓ Save & Submit"}
                    </button>
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

                {/* Pending indicator */}
                <div style={{ marginTop:12, paddingTop:12, borderTop:"2px solid #f1f5f9" }}>
                  <p style={{ fontSize:11.5, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.5px", margin:"0 0 8px" }}>Daily Target (8h)</p>
                  <div style={{ background:"#f1f5f9", borderRadius:8, height:8, overflow:"hidden", marginBottom:8 }}>
                    <div style={{
                      height:"100%", borderRadius:8, transition:"width 0.4s",
                      background: effectiveRegularMins>=DAILY_STD_MINS?"#16a34a":"#2563eb",
                      width:`${Math.min(100,(effectiveRegularMins/DAILY_STD_MINS)*100)}%`,
                    }} />
                  </div>
                  {pendingMins > 0
                    ? <p style={{ fontSize:12.5, fontWeight:700, color:"#d97706", margin:0 }}>⏳ {minsToHM(pendingMins)} still pending</p>
                    : <p style={{ fontSize:12.5, fontWeight:700, color:"#16a34a", margin:0 }}>✅ Daily target met!</p>
                  }
                </div>
              </div>

              <div style={{
                background:form.status==="P"?"#f0fdf4":form.status==="HD"?"#eff6ff":form.status==="L"?"#fef2f2":"#fffbeb",
                border:`1px solid ${form.status==="P"?"#bbf7d0":form.status==="HD"?"#bfdbfe":form.status==="L"?"#fecaca":"#fde68a"}`,
                borderRadius:10, padding:"14px 16px",
              }}>
                <p style={{ fontSize:11.5, fontWeight:700, color:"#64748b", textTransform:"uppercase", margin:"0 0 4px" }}>Status</p>
                <p style={{ fontSize:18, fontWeight:800, margin:0, color:form.status==="P"?"#16a34a":form.status==="HD"?"#2563eb":form.status==="L"?"#dc2626":"#d97706" }}>
                  {STATUS_OPTIONS.find((s)=>s.value===form.status)?.label}
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
