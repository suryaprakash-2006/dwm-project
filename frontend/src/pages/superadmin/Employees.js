import React, { useState, useEffect } from "react";
import "../../styles/theme.css";
import config from "../../config";
import { useNotifications } from "../../context/NotificationContext";
import employeesApi from "../../api/employees";
import subcatsApi from "../../api/subcategories";

const SHIFTS = ["A", "B", "C"];

const ROLE_COLOR = {
  SUPER_ADMIN:{ bg:"#fee2e2", color:"#dc2626" },
  ADMIN:      { bg:"#fef3c7", color:"#d97706" },
  USER:       { bg:"#dbeafe", color:"#2563eb" },
  OPERATOR:   { bg:"#dcfce7", color:"#16a34a" },
};

const ShiftBadge = ({shift}) => (
  <span style={{ display:"inline-block", background:"#dbeafe", color:"#1d4ed8", fontSize:12, fontWeight:700, padding:"3px 12px", borderRadius:20 }}>{shift}</span>
);
const StatusBadge = ({status}) => {
  const m = { Pending:{bg:"#fef3c7",c:"#d97706"},Approved:{bg:"#dcfce7",c:"#16a34a"},Rejected:{bg:"#fee2e2",c:"#dc2626"} };
  const s=m[status]||m.Pending;
  return <span style={{ background:s.bg, color:s.c, fontSize:12, fontWeight:700, padding:"4px 12px", borderRadius:20, display:"inline-block" }}>{status}</span>;
};
const RequiredLabel = ({ children }) => (
  <label>
    {children} <span style={{ color: "#dc2626" }}>*</span>
  </label>
);

export default function Employees({ superUser }) {
  const notif = useNotifications();
  const [employees, setEmployees]   = useState([]);
  const [deptsList, setDeptsList]   = useState([]);
  const [filterDept, setFilterDept] = useState("all");
  const [showAdd, setShowAdd]       = useState(false);
  const [alert, setAlert]           = useState(null);
  const [editEmp, setEditEmp]       = useState(null);
  const [confirmId, setConfirmId]   = useState(null);
  const [newEmp, setNewEmp]         = useState({ name:"", email:"", role:"USER", dept:"", designation:"", empNo:"" });
  const [newEmpErrors, setNewEmpErrors] = useState({});
  const [activeTab, setActiveTab]   = useState("employees");

  // Category CRUD
  const [categories, setCategories]     = useState([]);
  const [showAddCat, setShowAddCat]     = useState(false);
  const [editCat, setEditCat]           = useState(null);
  const [confirmDelCat, setConfirmDelCat] = useState(null);
  const [newCat, setNewCat]             = useState({ name:"", description:"" });

  // Admin password reset requests (sent here by admin forgot-password)
  const [adminResets, setAdminResets]   = useState([]);

  const showMsg = (type, message) => { setAlert({type,message}); setTimeout(()=>setAlert(null),3500); };

  const validateNewEmployee = (employee) => {
    const errors = {};
    const name = employee.name.trim();
    const email = employee.email.trim();
    const empNo = employee.empNo.trim();
    const designation = employee.designation.trim();
    const role = employee.role.trim();
    const dept = employee.dept.trim();

    if (!name) errors.name = "Name is required";
    if (!email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Email must be a valid email address";
    }
    if (!empNo) errors.empNo = "Employee Number is required";
    if (!designation) errors.designation = "Designation is required";
    if (!role) errors.role = "Role is required";
    if (!dept) errors.dept = "Department is required";

    return errors;
  };

  const clearNewEmpError = (field) => {
    setNewEmpErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const loadData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { "Authorization": `Bearer ${token}` };

      const emps = await employeesApi.list();
      setEmployees(emps);
      const cats = await subcatsApi.list();
      setCategories(cats);

      // Fetch departments
      const deptRes = await fetch(`${config.API_URL}/departments`, { headers });
      if (deptRes.ok) {
        const depts = await deptRes.json();
        setDeptsList(depts);
      }

      // Fetch password reset requests
      const res = await fetch(`${config.API_URL}/auth/reset-requests`, { headers });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((r, idx) => {
          const emp = emps.find((e) => e.empNo === r.empNo);
          return {
            id: idx + 1,
            empNo: r.empNo,
            empName: emp ? emp.name : `Employee #${r.empNo}`,
            empEmail: emp ? emp.email : "—",
            empId: emp ? emp.id : "—",
            requestedAt: r.requestedAt ? r.requestedAt.split("T")[0] : "—",
            status: r.approved ? "Approved" : r.rejected ? "Rejected" : "Pending",
            role: emp ? emp.role : ""
          };
        }); // Show all roles

        setAdminResets(mapped);
      }
    } catch (err) {
      console.warn("Failed to load real data", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const depts    = ["all","System",...deptsList.map(d => d.name)];
  const filtered = filterDept==="all"?employees:employees.filter((e)=>e.dept===filterDept);

  const addEmployee = () => {
    const errors = validateNewEmployee(newEmp);
    setNewEmpErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }
    (async () => {
      try {
        const created = await employeesApi.create(newEmp);
        setEmployees((prev)=>[...prev, created]);
        setNewEmp({name:"",email:"",role:"USER",dept:"",designation:"",empNo:""});
        setNewEmpErrors({});
        setShowAdd(false); 
        showMsg("success","Employee added successfully.");
      } catch (err) {
        showMsg("warning", err.message || "Failed to add employee.");
      }
    })();
  };
  
  const saveEdit = () => {
    if(!editEmp) return;
    if(!editEmp.name.trim()||!editEmp.email.trim()||!editEmp.dept.trim()||!editEmp.empNo.trim()) {
      showMsg("warning", "Please fill all mandatory fields including Employee Number (empNo).");
      return;
    }
    (async () => {
      try {
        const updated = await employeesApi.update(editEmp.id, editEmp);
        setEmployees((prev)=>prev.map((e)=>e.id===updated.id?updated:e));
        setEditEmp(null); 
        showMsg("success","Employee updated.");
      } catch (err) {
        showMsg("warning", "Failed to update employee.");
      }
    })();
  };
  
  const toggleActive = () => {
    (async () => {
      try {
        const toggled = await employeesApi.toggle(confirmId);
        setEmployees((prev)=>prev.map((e)=>e.id===confirmId?toggled:e));
        showMsg(toggled.active?"success":"warning",`${toggled.name} ${toggled.active?"enabled":"disabled"}.`);
        setConfirmId(null);
      } catch (err) {
        showMsg("warning", "Failed to toggle status.");
      }
    })();
  };

  // Category CRUD
  const addCategory = () => {
    if(!newCat.name.trim()) return;
    (async () => {
      try {
        const created = await subcatsApi.create(newCat);
        setCategories((p)=>[...p, created]);
        setNewCat({name:"",description:""}); 
        setShowAddCat(false); 
        showMsg("success","Category added.");
      } catch (err) {
        showMsg("warning", "Failed to add category.");
      }
    })();
  };
  
  const saveEditCat = () => {
    if(!editCat) return;
    (async () => {
      try {
        const updated = await subcatsApi.update(editCat.id, editCat);
        setCategories((p)=>p.map((c)=>c.id===updated.id?updated:c));
        setEditCat(null); 
        showMsg("success","Category updated.");
      } catch (err) {
        showMsg("warning", "Failed to update category.");
      }
    })();
  };
  
  const deleteCat = () => {
    (async () => {
      try {
        const cat=categories.find((c)=>c.id===confirmDelCat);
        await subcatsApi.remove(confirmDelCat);
        setCategories((p)=>p.filter((c)=>c.id!==confirmDelCat));
        setConfirmDelCat(null); 
        showMsg("warning",`"${cat.name}" deleted.`);
      } catch (err) {
        showMsg("warning", "Failed to delete category.");
      }
    })();
  };

  // Employee password reset
  const approveAdminReset = (req) => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${config.API_URL}/auth/reset-requests/${req.empNo}/action`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ action: "approve", default_password: "dwm@1234" })
        });
        if (res.ok) {
          setAdminResets((p)=>p.map((r)=>r.id===req.id?{...r,status:"Approved"}:r));
          showMsg("success",`Password reset approved for ${req.empName}.`);
        } else {
          showMsg("warning","Failed to approve reset request.");
        }
      } catch (err) {
        showMsg("warning","Failed to approve reset request.");
      }
    })();
  };

  const rejectAdminReset = (req) => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${config.API_URL}/auth/reset-requests/${req.empNo}/action`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ action: "reject" })
        });
        if (res.ok) {
          setAdminResets((p)=>p.map((r)=>r.id===req.id?{...r,status:"Rejected"}:r));
          showMsg("warning",`Reset request rejected for ${req.empName}.`);
        } else {
          showMsg("warning","Failed to reject reset request.");
        }
      } catch (err) {
        showMsg("warning","Failed to reject reset request.");
      }
    })();
  };

  const pendingAdminResets = adminResets.filter((r)=>r.status==="Pending").length;

  const deptGroups={};
  filtered.forEach((e)=>{ if(!deptGroups[e.dept]) deptGroups[e.dept]=[]; deptGroups[e.dept].push(e); });

  const TABS = [
    { key:"employees",    label:"Employees" },
    { key:"categories",   label:"Work Categories" },
    { key:"adminresets",  label:`Password Resets${pendingAdminResets>0?` (${pendingAdminResets})`:""}`, badge:pendingAdminResets },
  ];

  return (
    <div className="page">
      <div className="container-fluid">
        <h3 className="mb-1">Employees</h3>

        {alert&&(
          <div className={`alert alert-${alert.type==="success"?"success":"warning"}`}>{alert.message}</div>
        )}

        {/* Tabs */}
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

        {/* EMPLOYEES TAB */}
        {activeTab==="employees"&&(
          <>
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
              <div className="d-flex align-items-center gap-3">
                <span style={{ fontSize:13, color:"#64748b", fontWeight:500 }}>{filtered.length} employee{filtered.length!==1?"s":""}</span>
                <div className="d-flex align-items-center gap-2">
                  <label style={{ margin:0, fontSize:12.5 }}>Department:</label>
                  <select className="form-select" style={{ width:"auto", fontSize:13 }} value={filterDept} onChange={(e)=>setFilterDept(e.target.value)}>
                    {depts.map((d)=><option key={d} value={d}>{d==="all"?"All Departments":d}</option>)}
                  </select>
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={()=>setShowAdd(true)}>+ Add Employee</button>
            </div>

            {showAdd&&(
              <div className="card mb-4" style={{ padding:"20px" }}>
                <h6 style={{ marginBottom:16, fontWeight:700 }}>New Employee</h6>
                <div className="row g-2">
                  <div className="col-md-2">
                    <RequiredLabel>Name</RequiredLabel>
                    <input
                      className={`form-control${newEmpErrors.name ? " is-invalid" : ""}`}
                      placeholder="Full name"
                      value={newEmp.name}
                      onChange={(e)=>{
                        setNewEmp({...newEmp,name:e.target.value});
                        clearNewEmpError("name");
                      }}
                    />
                    {newEmpErrors.name && <div className="invalid-feedback d-block">{newEmpErrors.name}</div>}
                  </div>
                  <div className="col-md-2">
                    <RequiredLabel>Email</RequiredLabel>
                    <input
                      className={`form-control${newEmpErrors.email ? " is-invalid" : ""}`}
                      placeholder="email@dwm.com"
                      value={newEmp.email}
                      onChange={(e)=>{
                        setNewEmp({...newEmp,email:e.target.value});
                        clearNewEmpError("email");
                      }}
                    />
                    {newEmpErrors.email && <div className="invalid-feedback d-block">{newEmpErrors.email}</div>}
                  </div>
                  <div className="col-md-2">
                    <RequiredLabel>Employee No</RequiredLabel>
                    <input
                      className={`form-control${newEmpErrors.empNo ? " is-invalid" : ""}`}
                      placeholder="e.g. 9002"
                      value={newEmp.empNo}
                      onChange={(e)=>{
                        setNewEmp({...newEmp,empNo:e.target.value});
                        clearNewEmpError("empNo");
                      }}
                    />
                    {newEmpErrors.empNo && <div className="invalid-feedback d-block">{newEmpErrors.empNo}</div>}
                  </div>
                  <div className="col-md-2">
                    <RequiredLabel>Designation</RequiredLabel>
                    <input
                      className={`form-control${newEmpErrors.designation ? " is-invalid" : ""}`}
                      placeholder="e.g. Engineer"
                      value={newEmp.designation}
                      onChange={(e)=>{
                        setNewEmp({...newEmp,designation:e.target.value});
                        clearNewEmpError("designation");
                      }}
                    />
                    {newEmpErrors.designation && <div className="invalid-feedback d-block">{newEmpErrors.designation}</div>}
                  </div>
                  <div className="col-md-1">
                    <RequiredLabel>Role</RequiredLabel>
                    <select
                      className={`form-select${newEmpErrors.role ? " is-invalid" : ""}`}
                      value={newEmp.role}
                      onChange={(e)=>{
                        setNewEmp({...newEmp,role:e.target.value});
                        clearNewEmpError("role");
                      }}
                    >
                      <option value="USER">USER</option><option value="ADMIN">ADMIN</option><option value="OPERATOR">OPERATOR</option>
                    </select>
                    {newEmpErrors.role && <div className="invalid-feedback d-block">{newEmpErrors.role}</div>}
                  </div>
                  <div className="col-md-2">
                    <RequiredLabel>Department</RequiredLabel>
                    <select
                      className={`form-select${newEmpErrors.dept ? " is-invalid" : ""}`}
                      value={newEmp.dept}
                      onChange={(e)=>{
                        setNewEmp({...newEmp,dept:e.target.value});
                        clearNewEmpError("dept");
                      }}
                    >
                      <option value="">Select dept</option>
                      {deptsList.map((d)=><option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                    {newEmpErrors.dept && <div className="invalid-feedback d-block">{newEmpErrors.dept}</div>}
                  </div>

                </div>
                <div className="d-flex gap-2 mt-3">
                  <button className="btn btn-success btn-sm" onClick={addEmployee}>Add Employee</button>
                  <button className="btn btn-secondary btn-sm" onClick={()=>{ setShowAdd(false); setNewEmpErrors({}); }}>Cancel</button>
                </div>
              </div>
            )}

            <div className="card" style={{ padding:0 }}>
              <div className="table-responsive">
                <table className="table table-bordered align-middle mb-0">
                  <thead>
                    <tr><th>ID</th><th>Name</th><th>Email</th><th>Designation</th><th>Role</th><th>Department</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {Object.entries(deptGroups).map(([dept,emps])=>(
                      <React.Fragment key={dept}>
                        <tr>
                          <td colSpan={9} style={{ background:"#f1f5f9", fontWeight:700, fontSize:12, color:"#475569", textTransform:"uppercase", letterSpacing:"0.6px", padding:"8px 16px", borderBottom:"2px solid #e2e8f0" }}>
                            🏢 {dept} &nbsp;<span style={{ fontWeight:500, color:"#94a3b8", textTransform:"none", letterSpacing:0 }}>({emps.length} member{emps.length!==1?"s":""})</span>
                          </td>
                        </tr>
                        {emps.map((emp)=>(
                          <tr key={emp.id}>
                            <td style={{ fontFamily:"monospace", fontSize:12, color:"#94a3b8" }}>{emp.id}</td>
                            <td style={{ fontWeight:600, color:"#0f172a" }}>{emp.name}</td>
                            <td style={{ fontSize:12, color:"#475569" }}>{emp.email}</td>
                            <td style={{ fontSize:12, color:"#475569" }}>{emp.designation||"—"}</td>
                            <td><span className="badge" style={{ background:ROLE_COLOR[emp.role]?.bg, color:ROLE_COLOR[emp.role]?.color, fontSize:11, padding:"4px 10px", borderRadius:20, fontWeight:700 }}>{emp.role}</span></td>
                            <td style={{ fontSize:13 }}>{emp.dept}</td>

                            <td><span className="badge" style={{ background:emp.active?"#dcfce7":"#f1f5f9", color:emp.active?"#16a34a":"#64748b", fontSize:11, padding:"4px 10px", borderRadius:20 }}>{emp.active?"ACTIVE":"INACTIVE"}</span></td>
                            <td>
                              {emp.role==="SUPER_ADMIN"?<span style={{ fontSize:12, color:"#94a3b8" }}>—</span>:(
                                <div className="d-flex gap-2">
                                  <button className="btn btn-sm btn-warning" onClick={()=>setEditEmp({...emp})}>Edit</button>
                                  <button className={`btn btn-sm ${emp.active?"btn-danger":"btn-success"}`} onClick={()=>setConfirmId(emp.id)}>{emp.active?"Disable":"Enable"}</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {editEmp&&(<div className="confirm-overlay"><div className="confirm-box" style={{ minWidth:360 }}>
              <h6 style={{ marginBottom:14 }}>Edit Employee</h6>
              <label style={{ fontSize:12, fontWeight:600, display:"block", textAlign:"left", marginBottom:4 }}>Name</label>
              <input className="form-control mb-2" placeholder="Name" value={editEmp.name} onChange={(e)=>setEditEmp({...editEmp,name:e.target.value})} />
              <label style={{ fontSize:12, fontWeight:600, display:"block", textAlign:"left", marginBottom:4 }}>Email</label>
              <input className="form-control mb-2" placeholder="Email" value={editEmp.email} onChange={(e)=>setEditEmp({...editEmp,email:e.target.value})} />
              <label style={{ fontSize:12, fontWeight:600, display:"block", textAlign:"left", marginBottom:4 }}>Employee Number (empNo)</label>
              <input className="form-control mb-2" placeholder="Employee Number (empNo)" value={editEmp.empNo || ""} onChange={(e)=>setEditEmp({...editEmp,empNo:e.target.value})} />
              <label style={{ fontSize:12, fontWeight:600, display:"block", textAlign:"left", marginBottom:4 }}>Designation</label>
              <input className="form-control mb-2" placeholder="Designation" value={editEmp.designation||""} onChange={(e)=>setEditEmp({...editEmp,designation:e.target.value})} />
              <label style={{ fontSize:12, fontWeight:600, display:"block", textAlign:"left", marginBottom:4 }}>Role</label>
              <select className="form-select mb-2" value={editEmp.role} onChange={(e)=>setEditEmp({...editEmp,role:e.target.value})}>
                <option value="USER">USER</option><option value="ADMIN">ADMIN</option><option value="OPERATOR">OPERATOR</option>
              </select>
              <label style={{ fontSize:12, fontWeight:600, display:"block", textAlign:"left", marginBottom:4 }}>Department</label>
              <select className="form-select mb-2" value={editEmp.dept} onChange={(e)=>setEditEmp({...editEmp,dept:e.target.value})}>
                <option value="">Select dept</option>
                {deptsList.map((d)=><option key={d.id} value={d.name}>{d.name}</option>)}
              </select>

              <div className="d-flex gap-2 justify-content-center mt-3">
                <button className="btn btn-secondary btn-sm" onClick={()=>setEditEmp(null)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={saveEdit}>Save</button>
              </div>
            </div></div>)}

            {confirmId&&(<div className="confirm-overlay"><div className="confirm-box">
              <h6>Are you sure?</h6>
              <p>You are about to {employees.find((e)=>e.id===confirmId)?.active?"disable":"enable"} this employee.</p>
              <div className="d-flex gap-2 justify-content-center mt-3">
                <button className="btn btn-secondary btn-sm" onClick={()=>setConfirmId(null)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={toggleActive}>Confirm</button>
              </div>
            </div></div>)}
          </>
        )}

        {/* CATEGORIES TAB */}
        {activeTab==="categories"&&(
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div>
                <h5 style={{ margin:0, fontWeight:700 }}>Work Categories</h5>
                <p style={{ fontSize:13, color:"#64748b", margin:"4px 0 0" }}>Manage categories used in time entries across all users</p>
              </div>
              {!showAddCat&&<button className="btn btn-primary btn-sm" onClick={()=>setShowAddCat(true)}>+ Add Category</button>}
            </div>

            {showAddCat&&(
              <div className="card p-3 mb-3">
                <h6 style={{ fontWeight:700, marginBottom:14 }}>New Work Category</h6>
                <div className="row g-2">
                  <div className="col-md-4">
                    <label style={{ fontWeight:600, fontSize:13 }}>Category Name <span style={{ color:"#dc2626" }}>*</span></label>
                    <input className="form-control" placeholder="e.g. Task against order" value={newCat.name} onChange={(e)=>setNewCat({...newCat,name:e.target.value})} />
                  </div>
                  <div className="col-md-8">
                    <label style={{ fontWeight:600, fontSize:13 }}>Description</label>
                    <input className="form-control" placeholder="Brief description of this category" value={newCat.description} onChange={(e)=>setNewCat({...newCat,description:e.target.value})} />
                  </div>
                </div>
                <div className="d-flex gap-2 mt-3">
                  <button className="btn btn-success btn-sm" onClick={addCategory}>Save</button>
                  <button className="btn btn-secondary btn-sm" onClick={()=>{ setShowAddCat(false); setNewCat({name:"",description:""}); }}>Cancel</button>
                </div>
              </div>
            )}

            <div className="card" style={{ padding:0 }}>
              <div className="table-responsive">
                <table className="table table-bordered align-middle mb-0">
                  <thead><tr><th>#</th><th>CATEGORY NAME</th><th>DESCRIPTION</th><th style={{ minWidth:160 }}>ACTIONS</th></tr></thead>
                  <tbody>
                    {categories.length===0?(
                      <tr><td colSpan={4} style={{ textAlign:"center", color:"#94a3b8", padding:30 }}>No categories found.</td></tr>
                    ):categories.map((cat,i)=>(
                      <tr key={cat.id}>
                        <td style={{ color:"#94a3b8", fontFamily:"monospace", fontSize:12 }}>{i+1}</td>
                        <td style={{ fontWeight:700, color:"#0f172a" }}>{cat.name}</td>
                        <td style={{ fontSize:13, color:"#475569" }}>{cat.description||"—"}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-warning" style={{ fontWeight:600 }} onClick={()=>setEditCat({...cat})}>✏️ Edit</button>
                            <button className="btn btn-sm btn-danger"  style={{ fontWeight:600 }} onClick={()=>setConfirmDelCat(cat.id)}>🗑 Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {editCat&&(<div className="confirm-overlay"><div className="confirm-box" style={{ maxWidth:420 }}>
              <h6 style={{ fontWeight:700, marginBottom:16 }}>Edit Category</h6>
              <div className="mb-3">
                <label style={{ fontWeight:600, fontSize:13 }}>Category Name</label>
                <input className="form-control" value={editCat.name} onChange={(e)=>setEditCat({...editCat,name:e.target.value})} />
              </div>
              <div className="mb-3">
                <label style={{ fontWeight:600, fontSize:13 }}>Description</label>
                <input className="form-control" value={editCat.description} onChange={(e)=>setEditCat({...editCat,description:e.target.value})} />
              </div>
              <div className="d-flex gap-2 justify-content-center">
                <button className="btn btn-secondary btn-sm" onClick={()=>setEditCat(null)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={saveEditCat}>Save Changes</button>
              </div>
            </div></div>)}

            {confirmDelCat&&(<div className="confirm-overlay"><div className="confirm-box">
              <h6 style={{ fontWeight:700 }}>Delete Category?</h6>
              <p style={{ fontSize:13, color:"#64748b" }}>This will remove the category from the selection list. This action cannot be undone.</p>
              <div className="d-flex gap-2 justify-content-center mt-3">
                <button className="btn btn-secondary btn-sm" onClick={()=>setConfirmDelCat(null)}>Cancel</button>
                <button className="btn btn-danger btn-sm" onClick={deleteCat}>Delete</button>
              </div>
            </div></div>)}
          </>
        )}

        {/* PASSWORD RESET REQUESTS */}
        {activeTab==="adminresets"&&(
          <>
            <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:8, padding:"10px 16px", marginBottom:16 }}>
              <p style={{ fontSize:12.5, color:"#1e40af", margin:0, fontWeight:500 }}>
                🔑 Password reset requests from all employees. Approving will reset their password to dwm@1234.
              </p>
            </div>
            {adminResets.length===0?(
              <p style={{ color:"#94a3b8", textAlign:"center", padding:30 }}>No password reset requests.</p>
            ):(
              <div className="card" style={{ padding:0 }}>
                <div className="table-responsive">
                  <table className="table table-bordered align-middle mb-0">
                    <thead><tr><th>EMPLOYEE NAME</th><th>EMAIL</th><th>EMPLOYEE ID</th><th>ROLE</th><th>REQUESTED</th><th>STATUS</th><th style={{ minWidth:200 }}>ACTIONS</th></tr></thead>
                    <tbody>
                      {adminResets.map((r)=>(
                        <tr key={r.id}>
                          <td style={{ fontWeight:700 }}>{r.empName}</td>
                          <td style={{ fontSize:13, color:"#475569" }}>{r.empEmail}</td>
                          <td style={{ fontFamily:"monospace", fontSize:12, color:"#94a3b8" }}>{r.empNo}</td>
                          <td><span className="badge" style={{ background:ROLE_COLOR[r.role]?.bg || "#e2e8f0", color:ROLE_COLOR[r.role]?.color || "#475569", fontSize:11, padding:"4px 10px", borderRadius:20, fontWeight:700 }}>{r.role || "—"}</span></td>
                          <td style={{ fontSize:12.5, color:"#64748b" }}>{r.requestedAt}</td>
                          <td><StatusBadge status={r.status} /></td>
                          <td>
                            {r.status==="Pending"?(
                              <div style={{ display:"flex", gap:8 }}>
                                <button className="btn btn-success btn-sm" style={{ fontWeight:700 }} onClick={()=>approveAdminReset(r)}>✓ Approve Reset</button>
                                <button className="btn btn-danger btn-sm"  style={{ fontWeight:700 }} onClick={()=>rejectAdminReset(r)}>✕ Reject</button>
                              </div>
                            ):<span style={{ fontSize:12, color:"#94a3b8" }}>—</span>}
                          </td>
                        </tr>
                      ))}
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
