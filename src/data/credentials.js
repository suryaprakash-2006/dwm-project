import { ROLES } from "../roles";

const credentials = [

  {
    email: "operator101@dwm.com",
    password: "operator123",
    role: ROLES.OPERATOR,
    department: "Engineering"
  },

  {
    email: "staff101@dwm.com",
    password: "staff123",
    role: ROLES.STAFF,
    department: "Engineering"
  },

  {
    email: "admin101@dwm.com",
    password: "admin123",
    role: ROLES.ADMIN,
    department: "HR"
  },

  {
    email: "super101@dwm.com",
    password: "super123",
    role: ROLES.SUPER_ADMIN,
    department: "All"
  }

];

export default credentials;