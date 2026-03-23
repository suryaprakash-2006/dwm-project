// ─── 18 Real Departments ────────────────────────────────────────────────────
export const DEPARTMENTS = [
  "Marketing - Textile Automation",
  "Marketing - Machine Tooling",
  "Engineering Design",
  "NPD Design",
  "Mechatronics",
  "Quality Assurance",
  "Customer Service",
  "Project Management",
  "Total Plant Maintenance",
  "Product Assembly",
  "Project Assembly",
  "Machining Division",
  "Sheet Metal Division",
  "Powder Coating",
  "Human Resource",
  "Planning & Engineering Innovation",
  "Supply Chain Management",
  "Stores",
];

// ─── Employees with IDs ──────────────────────────────────────────────────────
export const EMPLOYEES = [
  { id: "SA-01",  name: "Super Admin",    email: "super101@dwm.com",    role: "SUPER_ADMIN", dept: "System",                           active: true  },
  { id: "E-001",  name: "Arjun Kumar",    email: "arjun@dwm.com",       role: "USER",        dept: "Engineering Design",               active: true  },
  { id: "E-002",  name: "Vikram Das",     email: "vikram@dwm.com",      role: "USER",        dept: "Engineering Design",               active: true  },
  { id: "E-003",  name: "Suresh Raj",     email: "suresh@dwm.com",      role: "ADMIN",       dept: "Engineering Design",               active: true  },
  { id: "OP-001", name: "Operator One",   email: "operator101@dwm.com", role: "OPERATOR",    dept: "Machining Division",               active: true  },
  { id: "H-001",  name: "Meera Iyer",     email: "meera@dwm.com",       role: "USER",        dept: "Human Resource",                   active: false },
  { id: "H-002",  name: "Priya Nair",     email: "priya@dwm.com",       role: "ADMIN",       dept: "Human Resource",                   active: true  },
  { id: "M-001",  name: "Rahul Sharma",   email: "rahul@dwm.com",       role: "USER",        dept: "Machining Division",               active: true  },
  { id: "M-002",  name: "Kiran Bose",     email: "kiran@dwm.com",       role: "USER",        dept: "Machining Division",               active: true  },
  { id: "Q-001",  name: "User Staff",     email: "user101@dwm.com",     role: "USER",        dept: "Quality Assurance",                active: true  },
  { id: "AD-001", name: "HR Admin",       email: "admin101@dwm.com",    role: "ADMIN",       dept: "Human Resource",                   active: true  },
  { id: "P-001",  name: "Ravi Menon",     email: "ravi@dwm.com",        role: "USER",        dept: "Product Assembly",                 active: true  },
  { id: "P-002",  name: "Anita Das",      email: "anita@dwm.com",       role: "USER",        dept: "Project Assembly",                 active: true  },
  { id: "S-001",  name: "Deepak Nair",    email: "deepak@dwm.com",      role: "USER",        dept: "Sheet Metal Division",             active: true  },
  { id: "SC-001", name: "Kavya Reddy",    email: "kavya@dwm.com",       role: "USER",        dept: "Supply Chain Management",          active: true  },
  { id: "MK-001", name: "Santhosh G",     email: "santhosh@dwm.com",    role: "ADMIN",       dept: "Marketing - Textile Automation",   active: true  },
  { id: "MK-002", name: "Lakshmi P",      email: "lakshmi@dwm.com",     role: "USER",        dept: "Marketing - Machine Tooling",      active: true  },
  { id: "PL-001", name: "Arun Babu",      email: "arun@dwm.com",        role: "USER",        dept: "Planning & Engineering Innovation",active: true  },
];

// Helper: "E-001 — Arjun Kumar" format for dropdowns
export function empLabel(emp) {
  return `${emp.id} — ${emp.name}`;
}

// All non-superadmin employees for dropdowns
export const EMP_OPTIONS = EMPLOYEES.filter((e) => e.role !== "SUPER_ADMIN");
