# MongoDB Collection Names Definition

COL_CREDENTIALS = "credentials"
COL_EMPLOYEES = "employees"
COL_DEPARTMENTS = "departments"
COL_MACHINES = "machines"
COL_WORK_CATEGORIES = "work_categories"
COL_SUB_CATEGORIES = "sub_categories"
COL_TIME_ENTRIES = "time_entries"
COL_NOTIFICATIONS = "notifications"
COL_RESET_REQUESTS = "reset_requests"
COL_COUNTERS = "counters"

# Backup collection names (used during migration)
COL_SUB_CATEGORIES_BACKUP = "sub_categories_backup"
COL_TIME_ENTRIES_BACKUP = "time_entries_backup"

# System roles constants
ROLE_USER = "USER"
ROLE_OPERATOR = "OPERATOR"
ROLE_ADMIN = "ADMIN"
ROLE_SUPER_ADMIN = "SUPER_ADMIN"

ALL_ROLES = [ROLE_USER, ROLE_OPERATOR, ROLE_ADMIN, ROLE_SUPER_ADMIN]
