# DWM Portal (Daily Work Management) Backend

This is the production-grade, highly secure, fully offline-capable FastAPI backend for the Daily Work Management (DWM) Portal. It replaces the frontend mock data and persists all operations securely to a local MongoDB Community Server.

---

## Technical Stack
* **FastAPI**: Modern, fast web framework for building APIs.
* **MongoDB Community Server**: Stored on a dedicated local server for fully offline operations.
* **PyMongo**: Synchronous Python driver for MongoDB.
* **Pydantic v2**: High-performance data validation.
* **JWT (JSON Web Tokens)**: Secure stateless authorization.
* **Bcrypt**: Standard secure password hashing.

---

## Directory Architecture

```
backend/
├── app/
│   ├── main.py                 # FastAPI core application instance and middleware configs
│   ├── database/
│   │   └── connection.py       # Pymongo connection manager with LAN-optimized timeouts
│   ├── models/
│   │   └── database.py         # Direct database schemas, collections, indexes definition
│   ├── schemas/
│   │   ├── auth.py             # JWT & Password reset schemas
│   │   ├── employee.py         # Employee schemas
│   │   ├── department.py       # Department schemas
│   │   ├── machine.py          # Machine schemas
│   │   ├── time_entry.py       # Time entry schemas
│   │   └── notification.py     # Notification schemas
│   ├── routes/
│   │   ├── auth.py             # JWT login, password reset flow, and status checks
│   │   ├── employees.py        # Employee CRUD and toggle
│   │   ├── departments.py      # Department CRUD and headcount calculations
│   │   ├── machines.py         # Machine CRUD and status toggle
│   │   ├── sub_categories.py   # Subcategory CRUD
│   │   ├── time_entries.py     # Time entry creation, late entries, and admin approvals
│   │   ├── notifications.py    # Notification query, read markers, and counts
│   │   └── reports.py          # Custom aggregations (attendance, monthly, productivity)
│   ├── services/
│   │   └── business_logic.py   # High-level business logic
│   ├── repositories/
│   │   └── db_repository.py    # Base & domain-specific repository classes for Mongo operations
│   ├── middleware/
│   │   └── rbac.py             # FastAPI dependencies to verify JWT tokens and roles
│   ├── core/
│   │   └── config.py           # Dotenv configuration loading
│   └── utils/
│       └── security.py         # Bcrypt password hashing and JWT utility functions
│
├── requirements.txt            # Package dependencies
├── .env.example                # Template env file
└── scripts/
    ├── setup_db.py             # Setup script to bootstrap empty collections and build indexes
    └── test_api.py             # Standalone API validation script
```

---

## Database Configuration & Indexing

The backend uses **9 specific collections** under a local MongoDB Community database:
1. `credentials`: Security credentials containing bcrypt hashed passwords.
2. `employees`: Detailed profiles of all active/inactive employees.
3. `departments`: Master data for company departments.
4. `machines`: Company machine directory.
5. `sub_categories`: Subtask logs master category.
6. `time_entries`: Daily time entry work logs.
7. `notifications`: In-app alerts, success states, and approvals.
8. `reset_requests`: Security password reset queries.
9. `counters`: Atomic auto-increment keys sequences.

### Performance & Constraint Indexes
The database index constraints are established in `scripts/setup_db.py` to assert data integrity:
* Unique indices on `credentials(empNo)`, `credentials(email)`.
* Unique indices on `employees(id)`, `employees(email)`.
* Unique index on `employees(empNo)` (sparse=True) to allow logins.
* Unique indices on `departments(id)`, `departments(name)`.
* Compound index on `time_entries(empId, date)` for speedy history queries.

---

## Deployment & Setup Guide

### 1. MongoDB Community Server Installation
1. Install **MongoDB Community Server (v6.0+)** on your local database server.
2. Ensure the service is running and binds to local addresses (e.g. `localhost:27017` or custom LAN address).
3. If running on a dedicated network machine, open port `27017` on the server firewall.

### 2. Backend Environment Setup
1. Open PowerShell or command line.
2. Navigate to the backend folder:
   ```bash
   cd backend
   ```
3. Install required libraries:
   ```bash
   dwmvenv\Scripts\pip install -r requirements.txt
   ```
4. Create your `.env` configuration file:
   ```bash
   copy .env.example .env
   ```

### 3. Database Bootstrap (Clean & Empty)
Run the automated database setup script to configure indexes and starting counters:
```bash
python scripts/setup_db.py
```
*Note: As per critical production requirements, the database starts completely clean and empty.*

### 4. Running the Backend Server
Start the Uvicorn server for deployment (listen on all interfaces and use the production port):
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
The interactive documentation (Swagger UI) is available at: `http://localhost:8000/docs`

---

## Super Admin Bootstrap
On first startup, the database starts completely clean. To login as Super Admin and set up the system:
1. Enter numeric ID `9001` with password `super123` in the frontend login screen.
2. The backend will automatically bootstrap the initial `SUPER_ADMIN` profile (`SA-01` / `Super Admin`) and default credential hashes.
3. You can then navigate to `Employees`, create company departments, add operators and standard users, and organize daily logs.
