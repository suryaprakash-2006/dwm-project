import { ROLES } from "../roles";

const credentials = [
  { email: "user101@dwm.com", password: "user123", role: ROLES.USER, department: "QA" },
  { email: "admin101@dwm.com", password: "admin123", role: ROLES.ADMIN, department: "HR" },
  { email: "super101@dwm.com", password: "super123", role: ROLES.SUPER_ADMIN, department: "Engineering" },
  { email: "operator101@dwm.com", password: "operator123", role: ROLES.OPERATOR, department: "Engineering" },
];

export default credentials;