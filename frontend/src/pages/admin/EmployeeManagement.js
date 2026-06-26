import React, { useState, useEffect } from "react";
import "../../styles/theme.css";
import { useNotifications } from "../../context/NotificationContext";
import machinesApi from "../../api/machines";
import subcatsApi from "../../api/subcategories";
import employeesApi from "../../api/employees";
import config from "../../config";

const INITIAL_MACHINES = [];
const INITIAL_REQUESTS = [];
const INITIAL_SUB_CATEGORIES = [];

function daysSinceSubmit(s) { const d=new Date(s),t=new Date(); t.setHours(0,0,0,0); return Math.floor((t-d)/86400000); }
function minsToHM(mins) { const h=Math.floor(mins/60),m=mins%60; return m===0?`${h}h`:`${h}h ${m}m`; }

const StatusBadge = ({status}) => {
  const m = { Pending:{bg:"#fef3c7",c:"#d97706"},Approved:{bg:"#dcfce7",c:"#16a34a"},Rejected:{bg:"#fee2e2",c:"#dc2626"} };
  const s = m[status]||m.Pending;
  return <span style={{ background:s.bg, color:s.c, fontSize:12, fontWeight:700, padding:"4px 12px", borderRadius:20, display:"inline-block" }}>{status}</span>;
};
const ShiftBadge = ({shift}) => {
  const c = {A:"#2563eb",B:"#16a34a",C:"#d97706"};
  return <span style={{ background:c[shift]||"#64748b", color:"#fff", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, display:"inline-block" }}>Shift {shift}</span>;
};
const StatusPill = ({active}) => (
  <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:active?"#16a34a":"#94a3b8", borderRadius:20, padding:"4px 12px" }}>
    <div style={{ width:7, height:7, borderRadius:"50%", background:"rgba(255,255,255,0.85)" }} />
    <span style={{ color:"#fff", fontSize:12, fontWeight:700 }}>{active?"Active":"Inactive"}</span>
  </div>
);

export default function EmployeeManagement({ adminUser }) {
  const notif = useNotifications();
  const adminDept = adminUser?.department || adminUser?.dept || "";
  const [employees, setEmployees] = useState([]);
  const [machines, setMachines]           = useState([]);
  const [lateReqs, setLateReqs]           = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [activeTab, setActiveTab]         = useState("employees");
  const [alert, setAlert]                 = useState(null);
  const [showAddM, setShowAddM]           = useState(false);
  const [editM, setEditM]                 = useState(null);
  const [confirmM, setConfirmM]           = useState(null);
  const [newM, setNewM]                   = useState({name:"",dept:adminDept});

  // Sub Category state
  const [showAddSC, setShowAddSC]         = useState(false);
  const [editSC, setEditSC]               = useState(null);
  const [confirmDelSC, setConfirmDelSC]   = useState(null);
  const [newSC, setNewSC]                 = useState({name:"",description:"",workCategoryId:""});
  const [workCategories, setWorkCategories] = useState([]);

  const msg = (type, text) => { setAlert({type,text}); setTimeout(()=>setAlert(null),3500); };

  const loadLateRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${config.API_URL}/time-entries?approvalStatus=Pending`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((r) => ({
          id: r.id,
          employee: r.empName,
          empId: r.empId,
          dept: r.dept,
          designation: r.designation,
          shift: r.shift,
          date: r.date,
          category: r.category,
          regularMins: r.regularMins,
          submittedAt: r.submittedAt ? r.submittedAt.split("T")[0] : "—",
          status: r.approvalStatus
        }));
        setLateReqs(mapped);
      }
    } catch (err) {
      console.warn("Failed to load late requests", err);
    }
  };

  // Machine CRUD
  const addMachine = () => {
    if(!newM.name.trim()||!newM.dept.trim()) return;
    (async ()=>{
      try{
        const created = await machinesApi.create({ name:newM.name, dept:newM.dept });
        setMachines((p)=>[...p, created]);
        setNewM({name:"",dept:adminDept}); setShowAddM(false); msg("success","Machine added.");
      }catch(err){ msg("warning","Failed to add machine."); }
    })();
  };

  const saveEditM = () => {
    if(!editM) return;
    (async ()=>{
      try{
        const updated = await machinesApi.update(editM.id, { name:editM.name, dept:editM.dept });
        setMachines((p)=>p.map((m)=>m.id===updated.id?updated:m));
        setEditM(null); msg("success","Machine updated.");
      }catch(err){ msg("warning","Failed to update machine."); }
    })();
  };

  const toggleMachine = () => {
    (async ()=>{
      try{
        const toggled = await machinesApi.toggle(confirmM);
        setMachines((p)=>p.map((x)=>x.id===confirmM? (x.id===toggled.id? toggled: x) : x));
        const m = toggled || machines.find((x)=>x.id===confirmM);
        setConfirmM(null); msg(m.active?"warning":"success",`${m.name} ${m.active?"deactivated":"activated"}.`);
      }catch(err){ msg("warning","Failed to update machine."); }
    })();
  };

  // Sub Category CRUD
  const addSubCategory = () => {
    if(!newSC.name.trim()) {
      msg("warning", "Sub-category name is required.");
      return;
    }
    if(!newSC.workCategoryId) {
      msg("warning", "Parent Work Category is required.");
      return;
    }
    (async ()=>{
      try{
        const created = await subcatsApi.create({
          name: newSC.name.trim(),
          description: newSC.description.trim(),
          workCategoryId: Number(newSC.workCategoryId)
        });
        setSubCategories((p)=>[...p, created]);
        setNewSC({name:"",description:"",workCategoryId:""}); setShowAddSC(false); msg("success","Sub-category added.");
      }catch(err){ msg("warning", err.message || "Failed to add sub-category."); }
    })();
  };
  const saveEditSC = () => {
    if(!editSC.name.trim()) {
      msg("warning", "Sub-category name is required.");
      return;
    }
    if(!editSC.workCategoryId) {
      msg("warning", "Parent Work Category is required.");
      return;
    }
    (async ()=>{
      try{
        const updated = await subcatsApi.update(editSC.id, {
          name: editSC.name.trim(),
          description: editSC.description.trim(),
          workCategoryId: Number(editSC.workCategoryId)
        });
        setSubCategories((p)=>p.map((s)=>s.id===updated.id?updated:s));
        setEditSC(null); msg("success","Sub-category updated.");
      }catch(err){ msg("warning","Failed to update sub-category."); }
    })();
  };
  const deleteSubCategory = () => {
    (async ()=>{
      try{
        const sc = subCategories.find((s)=>s.id===confirmDelSC);
        await subcatsApi.remove(confirmDelSC);
        setSubCategories((p)=>p.filter((s)=>s.id!==confirmDelSC));
        setConfirmDelSC(null); msg("warning",`"${sc.name}" deleted.`);
      }catch(err){ msg("warning","Failed to delete sub-category."); }
    })();
  };

  // Load persisted machines and subcategories — scoped to admin's department
  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      try{
        const adminDept = adminUser?.department || adminUser?.dept || "";
        const ms = await machinesApi.listByDept(adminDept); if(mounted && Array.isArray(ms)) setMachines(ms);
        const scs = await subcatsApi.list(); if(mounted && Array.isArray(scs)) setSubCategories(scs);
        
        // Fetch active work categories
        const token = localStorage.getItem("token");
        const wcRes = await fetch(`${config.API_URL}/work-categories?active=true`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (wcRes.ok) {
          const wcData = await wcRes.json();
          if (mounted) setWorkCategories(wcData);
        }
      }catch(err){ console.warn('Failed to load mocks',err); }
    })();
    return ()=> mounted=false;
  },[adminUser]);

  // Late entry approval
  const approveReq = (id) => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${config.API_URL}/time-entries/${id}/approve`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ comment: "Approved by Admin" })
        });
        if (res.ok) {
          const updated = await res.json();
          const mapped = {
            id: updated.id,
            employee: updated.empName,
            empId: updated.empId,
            dept: updated.dept,
            designation: updated.designation,
            shift: updated.shift,
            date: updated.date,
            category: updated.category,
            regularMins: updated.regularMins,
            submittedAt: updated.submittedAt ? updated.submittedAt.split("T")[0] : "—",
            status: updated.approvalStatus
          };
          setLateReqs((p)=>p.map((r)=>r.id===id?mapped:r));
          msg("success","Entry approved.");
        } else {
          msg("warning","Failed to approve entry.");
        }
      } catch (err) {
        msg("warning","Failed to approve entry.");
      }
    })();
  };

  const rejectReq  = (id) => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${config.API_URL}/time-entries/${id}/reject`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ comment: "Rejected by Admin" })
        });
        if (res.ok) {
          const updated = await res.json();
          const mapped = {
            id: updated.id,
            employee: updated.empName,
            empId: updated.empId,
            dept: updated.dept,
            designation: updated.designation,
            shift: updated.shift,
            date: updated.date,
            category: updated.category,
            regularMins: updated.regularMins,
            submittedAt: updated.submittedAt ? updated.submittedAt.split("T")[0] : "—",
            status: updated.approvalStatus
          };
          setLateReqs((p)=>p.map((r)=>r.id===id?mapped:r));
          msg("warning","Entry rejected.");
        } else {
          msg("warning","Failed to reject entry.");
        }
      } catch (err) {
        msg("warning","Failed to reject entry.");
      }
    })();
  };



  const pendingCount    = lateReqs.filter((r)=>r.status==="Pending").length;
  const pendingSCCount  = 0;

  const TABS = [
    { key:"employees",      label:"Employees" },
    { key:"machines",       label:"Machines"  },
    { key:"subcategories",  label:"Sub Categories" },
    { key:"approvals",      label:`Late Entry Approvals${pendingCount>0?` (${pendingCount})`:""}`, badge:pendingCount },
  ];

  // Load employees & cascade dependencies from backend
  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      try{
        const list = await employeesApi.list();
        if(mounted && Array.isArray(list)) {
          setEmployees(list);
        }
        await loadLateRequests();
      }catch(err){ console.warn('Failed to load employees', err); }
    })();
    return ()=> mounted = false;
  },[]);

  return (
    <div className="page">
      <div className="container-fluid">
        <h3 className="mb-3">Employee Management</h3>
        {alert&&<div className={`alert alert-${alert.type==="success"?"success":"warning"}`}>{alert.text}</div>}

        {/* Tab bar */}
        <div style={{ display:"flex", gap:0, marginBottom:24, borderBottom:"2px solid #e2e8f0", overflowX:"auto" }}>
          {TABS.map((t)=>(
            <button key={t.key} onClick={()=>setActiveTab(t.key)} style={{
              padding:"10px 18px", fontSize:13, fontWeight:600, border:"none", background:"transparent", cursor:"pointer",
              color:activeTab===t.key?"#2563eb":"#64748b",
              borderBottom:`3px solid ${activeTab===t.key?"#2563eb":"transparent"}`,
              marginBottom:-2, transition:"all 0.15s", whiteSpace:"nowrap",
            }}>
              {t.label}
              {t.badge>0&&<span style={{ marginLeft:6, background:"#dc2626", color:"#fff", fontSize:10, fontWeight:800, borderRadius:10, padding:"1px 6px" }}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* EMPLOYEES */}
        {activeTab==="employees"&&(
          <div className="card" style={{ padding:0 }}>
            <div className="table-responsive">
              <table className="table table-bordered align-middle mb-0">
                <thead><tr><th>NAME</th><th>EMP NO</th><th>EMAIL</th><th>DESIGNATION</th><th>DEPT</th><th>STATUS</th><th>TOGGLE</th></tr></thead>
                <tbody>
                  {employees.map((e)=>(
                    <tr key={e.id}>
                      <td style={{ fontWeight:600 }}>{e.name}</td>
                      <td style={{ fontFamily:"monospace", fontSize:12, color:"#94a3b8" }}>{e.empNo || "—"}</td>
                      <td style={{ fontSize:13, color:"#475569" }}>{e.email}</td>
                      <td style={{ fontSize:13, color:"#475569" }}>{e.designation}</td>
                      <td>{e.dept}</td>

                      <td>{e.pending?<span style={{ color:"#d97706",fontWeight:700 }}>Pending</span>:e.active?<span style={{ color:"#16a34a",fontWeight:700 }}>Active</span>:<span style={{ color:"#dc2626",fontWeight:700 }}>Inactive</span>}</td>
                      <td>
                        {(() => {
                          const isAdmin = adminUser?.role === "ADMIN";
                          const isOwnAccount = adminUser?.id === e.id || adminUser?.empNo === e.empNo;
                          const isSuperAdminTarget = e.role === "SUPER_ADMIN";
                          const canToggle = !isAdmin || (!isOwnAccount && !isSuperAdminTarget);

                          if (!canToggle) {
                            return <span style={{ color:"#94a3b8", fontSize:12 }}>-</span>;
                          }

                          return (
                            <button
                              className={`btn btn-sm ${e.active?"btn-danger":"btn-success"}`}
                              style={{ fontWeight:600,minWidth:90 }}
                              onClick={async ()=>{
                                try{
                                  const updated = await employeesApi.toggle(e.id);
                                  setEmployees(p=>p.map(emp=>emp.id===e.id?updated:emp));
                                  msg(updated.active?"success":"warning", `${updated.name} ${updated.active?"activated":"deactivated"}.`);
                                }catch(err){ msg("warning","Failed to update employee."); }
                              }}
                            >
                              {e.active?"Deactivate":"Activate"}
                            </button>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MACHINES */}
        {activeTab==="machines"&&(
          <>
            {!showAddM&&<button className="btn btn-primary btn-sm mb-3" onClick={()=>setShowAddM(true)}>+ Add Machine</button>}
            {showAddM&&(
              <div className="card p-3 mb-3">
                <div className="row g-2">
                  <div className="col-md-5"><label>Machine Name</label><input className="form-control" placeholder="e.g. CNC Lathe" value={newM.name} onChange={(e)=>setNewM({...newM,name:e.target.value})} /></div>
                  <div className="col-md-5"><label>Department</label><input className="form-control" value={adminDept} readOnly style={{background:"#f1f5f9",color:"#64748b",cursor:"not-allowed"}} title="Machines are created under your department" /></div>
                </div>
                <div className="d-flex gap-2 mt-3">
                  <button className="btn btn-success btn-sm" onClick={addMachine}>Save</button>
                  <button className="btn btn-secondary btn-sm" onClick={()=>setShowAddM(false)}>Cancel</button>
                </div>
              </div>
            )}
            <div className="card" style={{ padding:0 }}>
              <div className="table-responsive">
                <table className="table table-bordered align-middle mb-0">
                  <thead><tr><th>MACHINE</th><th>DEPARTMENT</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
                  <tbody>
                    {machines.map((m)=>(
                      <tr key={m.id}>
                        <td style={{ fontWeight:600 }}>{m.name}</td>
                        <td style={{ color:"#475569" }}>{m.dept}</td>
                        <td><StatusPill active={m.active} /></td>
                        <td>
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-warning" onClick={()=>setEditM({...m})}>Edit</button>
                            <button className={`btn btn-sm ${m.active?"btn-danger":"btn-success"}`} onClick={()=>setConfirmM(m.id)}>{m.active?"Deactivate":"Activate"}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {editM&&(<div className="confirm-overlay"><div className="confirm-box">
              <h6>Edit Machine</h6>
              <input className="form-control mb-2" value={editM.name} onChange={(e)=>setEditM({...editM,name:e.target.value})} />
              <input className="form-control mb-2" value={editM.dept} onChange={(e)=>setEditM({...editM,dept:e.target.value})} />
              <div className="d-flex gap-2 justify-content-center mt-3">
                <button className="btn btn-secondary btn-sm" onClick={()=>setEditM(null)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={saveEditM}>Save</button>
              </div>
            </div></div>)}
            {confirmM&&(<div className="confirm-overlay"><div className="confirm-box">
              <h6>Are you sure?</h6>
              <p>You are about to {machines.find(m=>m.id===confirmM)?.active?"deactivate":"activate"} this machine.</p>
              <div className="d-flex gap-2 justify-content-center mt-3">
                <button className="btn btn-secondary btn-sm" onClick={()=>setConfirmM(null)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={toggleMachine}>Confirm</button>
              </div>
            </div></div>)}
          </>
        )}

        {/* SUB CATEGORIES CRUD */}
        {activeTab==="subcategories"&&(
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div>
                <h5 style={{ margin:0, fontWeight:700 }}>Sub Categories</h5>
                <p style={{ fontSize:13, color:"#64748b", margin:"4px 0 0" }}>Manage sub-categories used in time entries</p>
              </div>
              {!showAddSC&&<button className="btn btn-primary btn-sm" onClick={()=>setShowAddSC(true)}>+ Add Sub Category</button>}
            </div>

            {showAddSC&&(
              <div className="card p-3 mb-3">
                <h6 style={{ fontWeight:700, marginBottom:14 }}>New Sub Category</h6>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label style={{ fontWeight:600, fontSize:13 }}>Work Category <span style={{ color:"#dc2626" }}>*</span></label>
                    <select className="form-select" value={newSC.workCategoryId || ""} onChange={(e)=>setNewSC({...newSC,workCategoryId:e.target.value})}>
                      <option value="">-- Select Work Category --</option>
                      {workCategories.map((wc) => (
                        <option key={wc.id} value={wc.id}>{wc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label style={{ fontWeight:600, fontSize:13 }}>Sub Category Name <span style={{ color:"#dc2626" }}>*</span></label>
                    <input className="form-control" placeholder="Sub category name" value={newSC.name} onChange={(e)=>setNewSC({...newSC,name:e.target.value})} />
                  </div>
                  <div className="col-md-4">
                    <label style={{ fontWeight:600, fontSize:13 }}>Description</label>
                    <input className="form-control" placeholder="Optional description" value={newSC.description} onChange={(e)=>setNewSC({...newSC,description:e.target.value})} />
                  </div>
                </div>
                <div className="d-flex gap-2 mt-3">
                  <button className="btn btn-success btn-sm" onClick={addSubCategory}>Save</button>
                  <button className="btn btn-secondary btn-sm" onClick={()=>{ setShowAddSC(false); setNewSC({name:"",description:"",workCategoryId:""}); }}>Cancel</button>
                </div>
              </div>
            )}

            <div className="card" style={{ padding:0 }}>
              <div className="table-responsive">
                <table className="table table-bordered align-middle mb-0">
                  <thead>
                    <tr><th>#</th><th>WORK CATEGORY</th><th>SUB CATEGORY NAME</th><th>DESCRIPTION</th><th style={{ minWidth:160 }}>ACTIONS</th></tr>
                  </thead>
                  <tbody>
                    {subCategories.length===0?(
                      <tr><td colSpan={5} style={{ textAlign:"center", color:"#94a3b8", padding:30 }}>No sub-categories yet.</td></tr>
                    ):subCategories.map((sc,i)=>(
                      <tr key={sc.id}>
                        <td style={{ color:"#94a3b8", fontFamily:"monospace", fontSize:12 }}>{i+1}</td>
                        <td style={{ fontWeight:600, color:"#475569" }}>
                          {workCategories.find(w => w.id === sc.workCategoryId)?.name || <span style={{ color: "#dc2626" }}>Orphan (No Parent)</span>}
                        </td>
                        <td style={{ fontWeight:700, color:"#0f172a" }}>{sc.name}</td>
                        <td style={{ fontSize:13, color:"#475569" }}>{sc.description || "—"}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-warning" style={{ fontWeight:600 }} onClick={()=>setEditSC({...sc})}>✏️ Edit</button>
                            <button className="btn btn-sm btn-danger"  style={{ fontWeight:600 }} onClick={()=>setConfirmDelSC(sc.id)}>🗑 Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Edit SC Modal */}
            {editSC&&(<div className="confirm-overlay"><div className="confirm-box" style={{ maxWidth:400 }}>
              <h6 style={{ fontWeight:700, marginBottom:16 }}>Edit Sub Category</h6>
              <div className="mb-3">
                <label style={{ fontWeight:600, fontSize:13 }}>Work Category <span style={{ color:"#dc2626" }}>*</span></label>
                <select className="form-select" value={editSC.workCategoryId || ""} onChange={(e)=>setEditSC({...editSC,workCategoryId:Number(e.target.value)})}>
                  <option value="">-- Select Work Category --</option>
                  {workCategories.map((wc) => (
                    <option key={wc.id} value={wc.id}>{wc.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label style={{ fontWeight:600, fontSize:13 }}>Name</label>
                <input className="form-control" value={editSC.name} onChange={(e)=>setEditSC({...editSC,name:e.target.value})} />
              </div>
              <div className="mb-3">
                <label style={{ fontWeight:600, fontSize:13 }}>Description</label>
                <input className="form-control" value={editSC.description || ""} onChange={(e)=>setEditSC({...editSC,description:e.target.value})} />
              </div>
              <div className="d-flex gap-2 justify-content-center">
                <button className="btn btn-secondary btn-sm" onClick={()=>setEditSC(null)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={saveEditSC}>Save Changes</button>
              </div>
            </div></div>)}

            {/* Delete SC Confirm */}
            {confirmDelSC&&(<div className="confirm-overlay"><div className="confirm-box">
              <h6 style={{ fontWeight:700 }}>Delete Sub Category?</h6>
              <p style={{ fontSize:13, color:"#64748b" }}>This action cannot be undone.</p>
              <div className="d-flex gap-2 justify-content-center mt-3">
                <button className="btn btn-secondary btn-sm" onClick={()=>setConfirmDelSC(null)}>Cancel</button>
                <button className="btn btn-danger btn-sm" onClick={deleteSubCategory}>Delete</button>
              </div>
            </div></div>)}
          </>
        )}

        {/* LATE ENTRY APPROVALS */}
        {activeTab==="approvals"&&(
          <>
            <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:8, padding:"10px 16px", marginBottom:16 }}>
              <p style={{ fontSize:12.5, color:"#92400e", margin:0, fontWeight:500 }}>
                ℹ️ Entries submitted more than <strong>3 days</strong> late need your approval. You have <strong>10 days</strong> to approve or reject.
              </p>
            </div>
            {lateReqs.length===0?(
              <p style={{ color:"#94a3b8", textAlign:"center", padding:30 }}>No approval requests.</p>
            ):(
              <div className="card" style={{ padding:0 }}>
                <div className="table-responsive">
                  <table className="table table-bordered align-middle mb-0">
                    <thead>
                      <tr><th>EMPLOYEE</th><th>EMP ID</th><th>DESIGNATION</th><th>SHIFT</th><th>ENTRY DATE</th><th>CATEGORY</th><th>WORKED</th><th>SUBMITTED</th><th>EXPIRES IN</th><th>STATUS</th><th style={{ minWidth:160 }}>ACTIONS</th></tr>
                    </thead>
                    <tbody>
                      {lateReqs.map((r)=>{
                        const daysLeft=10-daysSinceSubmit(r.submittedAt);
                        const expired=daysLeft<=0;
                        return (
                          <tr key={r.id}>
                            <td style={{ fontWeight:600, color:"#0f172a" }}>{r.employee}</td>
                            <td style={{ fontFamily:"monospace", fontSize:12, color:"#94a3b8" }}>{r.empId}</td>
                            <td style={{ fontSize:12.5, color:"#64748b" }}>{r.designation}</td>
                            <td><ShiftBadge shift={r.shift} /></td>
                            <td style={{ fontWeight:600 }}>{r.date}</td>
                            <td style={{ fontSize:13, color:"#475569" }}>{r.category}</td>
                            <td style={{ fontWeight:700, fontFamily:"monospace" }}>{minsToHM(r.regularMins||r.hours*60||0)}</td>
                            <td style={{ fontSize:12.5, color:"#64748b" }}>{r.submittedAt}</td>
                            <td><span style={{ fontWeight:700, fontSize:12.5, color:expired?"#dc2626":daysLeft<=3?"#d97706":"#16a34a" }}>{expired?"Expired":`${daysLeft}d left`}</span></td>
                            <td><StatusBadge status={r.status} /></td>
                            <td>
                              {r.status==="Pending"&&!expired?(
                                <div style={{ display:"flex", gap:8 }}>
                                  <button className="btn btn-success btn-sm" style={{ fontWeight:700 }} onClick={()=>approveReq(r.id)}>✓ Approve</button>
                                  <button className="btn btn-danger btn-sm"  style={{ fontWeight:700 }} onClick={()=>rejectReq(r.id)}>✕ Reject</button>
                                </div>
                              ):<span style={{ fontSize:12, color:"#94a3b8" }}>—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}


      </div>
    </div>
  );
}