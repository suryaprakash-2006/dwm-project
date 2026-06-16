from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.connection import db_connection
from app.routes import auth, employees, departments, machines, work_categories, sub_categories, time_entries, notifications, reports

app = FastAPI(
    title="Daily Work Management (DWM) Portal API",
    description="Production-ready FastAPI backend for logging daily work, tracking productivity, and processing approvals.",
    version="1.0.0"
)

# Configure CORS to allow connection from the local React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Supports LAN and local WAN access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    """Initializes the database connection pool on API startup."""
    print("🚀 Starting DWM Portal API...")
    try:
        db_connection.connect()
        print(" MongoDB connection pool initialized.")
    except Exception as e:
        print(f" Failed to initialize MongoDB connection pool: {e}")

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "service": "DWM Portal API",
        "version": "1.0.0"
    }

# Register all routes
app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(departments.router)
app.include_router(machines.router)
app.include_router(work_categories.router)
app.include_router(sub_categories.router)
app.include_router(time_entries.router)
app.include_router(notifications.router)
app.include_router(reports.router)

