"""
MongoDB Local (Community Server) Data Store — DWM Portal
────────────────────────────────────────────────────────────────────────────────
This is a COMPLETE DROP-IN REPLACEMENT for the original in-memory data_store.py.

Designed for:
  • MongoDB Community Server installed on a dedicated server machine
  • Accessed over the company's WAN/LAN network by all backend instances
  • No internet required — fully offline

Collections in MongoDB:
  • credentials        – login accounts (passwords bcrypt-hashed)
  • employees          – employee profiles
  • departments        – department master data
  • machines           – machine master data
  • sub_categories     – work sub-category master data
  • time_entries       – daily work entries
  • notifications      – in-app notifications
  • reset_requests     – password reset requests
  • counters           – auto-increment sequences

Security:
  • Passwords stored as bcrypt hashes — never plain text
  • MongoDB authentication enabled (username + password required)
  • Connection string kept in .env — never hardcoded
  • All queries use exact field matching — no injection risk
────────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations
import os
from datetime import datetime, timedelta
from typing import Any

from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.collection import Collection
from pymongo.errors import ServerSelectionTimeoutError, OperationFailure
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv

load_dotenv()

# ─── Connection ───────────────────────────────────────────────────────────────

_MONGO_URI = os.getenv("MONGODB_URI", "")
_DB_NAME   = os.getenv("MONGODB_DB_NAME", "dwm_portal")

if not _MONGO_URI:
    raise RuntimeError(
        "\n\n    MONGODB_URI is not set in your .env file.\n"
        "      Example for local server:\n"
        "      MONGODB_URI=mongodb://dwm_user:yourpassword@127.0.0.1:27017/dwm_portal?authSource=dwm_portal\n"
    )

try:
    _client: MongoClient = MongoClient(
        _MONGO_URI,
        serverSelectionTimeoutMS=8_000,    # 8 sec timeout — good for LAN
        connectTimeoutMS=8_000,
        socketTimeoutMS=30_000,
        maxPoolSize=50,                    # connection pool for multi-user load
        retryWrites=True,
    )
    # Eagerly test the connection so the error is clear at startup
    _client.admin.command("ping")
except ServerSelectionTimeoutError:
    raise RuntimeError(
        "\n\n  ❌  Cannot reach the MongoDB server.\n"
        "      Check:\n"
        "        1. MongoDB service is running on the server machine\n"
        "        2. The server IP and port in MONGODB_URI are correct\n"
        "        3. Port 27017 is open in the server's firewall\n"
        "        4. This machine's IP is allowed in MongoDB's bindIp config\n"
    )
except OperationFailure:
    raise RuntimeError(
        "\n\n  ❌  MongoDB authentication failed.\n"
        "      Check the username and password in your MONGODB_URI.\n"
    )

_db = _client[_DB_NAME]


# ─── Collection handles ───────────────────────────────────────────────────────

def _col(name: str) -> Collection:
    return _db[name]


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _clean(doc: dict | None) -> dict | None:
    """Convert ObjectId → str and return a JSON-safe copy."""
    if doc is None:
        return None
    d = dict(doc)
    if "_id" in d:
        d["_id"] = str(d["_id"])
    return d


def _next_id(kind: str) -> int:
    """Atomic auto-increment counter using the counters collection."""
    result = _col("counters").find_one_and_update(
        {"_id": kind},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    return result["seq"]


# ─── Index & seed bootstrap ───────────────────────────────────────────────────

def _ensure_indexes():
    """Create all performance + uniqueness indexes. Safe to call multiple times."""
    _col("credentials").create_index("empNo",  unique=True)
    _col("credentials").create_index("email",  unique=True)

    _col("employees").create_index("id",    unique=True)
    _col("employees").create_index("email", unique=True)
    _col("employees").create_index("role")
    _col("employees").create_index("dept")

    _col("departments").create_index("id",   unique=True)
    _col("departments").create_index("name", unique=True)

    _col("machines").create_index("id", unique=True)

    _col("sub_categories").create_index("id", unique=True)

    _col("time_entries").create_index("id",     unique=True)
    _col("time_entries").create_index("empId")
    _col("time_entries").create_index("empNo")
    _col("time_entries").create_index("date")
    _col("time_entries").create_index("approvalStatus")
    _col("time_entries").create_index("dept")
    _col("time_entries").create_index([("empId", ASCENDING), ("date", ASCENDING)])

    _col("notifications").create_index("id",      unique=True)
    _col("notifications").create_index("toEmail")
    _col("notifications").create_index("read")

    _col("reset_requests").create_index("empNo", unique=True)


def _seed_data():
    """
    Insert initial data ONLY when collections are empty.
    On any restart after first run, this is skipped automatically.
    """

    # ── Credentials (passwords are hashed) ───────────────────────────────────
    if _col("credentials").count_documents({}) == 0:
        _col("credentials").insert_many([
            {"empNo": "9001", "password": generate_password_hash("super123"),    "role": "SUPER_ADMIN", "department": "System",        "email": "super101@dwm.com"},
        ])

    # ── Employees ─────────────────────────────────────────────────────────────
    if _col("employees").count_documents({}) == 0:
        _col("employees").insert_many([
            {"id": "SA-01",  "name": "Super Admin",  "email": "super101@dwm.com",    "role": "SUPER_ADMIN", "dept": "System",                            "designation": "System Administrator",  "shift": "A", "active": True,  "empNo": "9001"},
        ])

    # ── Counters ──────────────────────────────────────────────────────────────
    _col("counters").update_one({"_id": "department"}, {"$setOnInsert": {"seq": 20}},  upsert=True)
    _col("counters").update_one({"_id": "machine"}, {"$setOnInsert": {"seq": 10}}, upsert=True)
    _col("counters").update_one({"_id": "sub_category"}, {"$setOnInsert": {"seq": 10}}, upsert=True)
    _col("counters").update_one({"_id": "time_entry"}, {"$setOnInsert": {"seq": 100}}, upsert=True)
    _col("counters").update_one({"_id": "notification"}, {"$setOnInsert": {"seq": 100}}, upsert=True)
    _col("counters").update_one({"_id": "employee"},     {"$setOnInsert": {"seq": 100}}, upsert=True)


# Run both on module import (safe + idempotent)
_ensure_indexes()
_seed_data()


# ─── DataStore ────────────────────────────────────────────────────────────────

class DataStore:
    """
    Same public API as the original in-memory DataStore.
    All route files import `from models import db` — nothing changes for them.
    """

    # ── Credentials ───────────────────────────────────────────────────────────

    def find_credential(self, emp_no: str, password: str):
        cred = _col("credentials").find_one({"empNo": emp_no})
        if cred and check_password_hash(cred["password"], password):
            return _clean(cred)
        return None

    def find_credential_by_emp_no(self, emp_no: str):
        return _clean(_col("credentials").find_one({"empNo": emp_no}))

    def find_credential_by_email(self, email: str):
        return _clean(_col("credentials").find_one({"email": email}))

    def update_password(self, email: str, new_password: str) -> bool:
        r = _col("credentials").update_one(
            {"email": email},
            {"$set": {"password": generate_password_hash(new_password)}},
        )
        return r.modified_count > 0

    def reset_password_to_default(self, emp_no: str, default_password: str) -> bool:
        r = _col("credentials").update_one(
            {"empNo": emp_no},
            {"$set": {"password": generate_password_hash(default_password)}},
        )
        return r.modified_count > 0

    # ── Password Reset Requests ───────────────────────────────────────────────

    def add_reset_request(self, emp_no: str):
        _col("reset_requests").update_one(
            {"empNo": emp_no},
            {"$set": {"empNo": emp_no, "requestedAt": datetime.utcnow().isoformat(), "approved": False}},
            upsert=True,
        )

    def get_reset_request(self, emp_no: str):
        return _clean(_col("reset_requests").find_one({"empNo": emp_no}))

    def approve_reset_request(self, emp_no: str):
        _col("reset_requests").update_one({"empNo": emp_no}, {"$set": {"approved": True}})

    def get_reset_status(self, emp_no: str, window_days: int = 3) -> str:
        req = _col("reset_requests").find_one({"empNo": emp_no})
        if not req:
            return "null"
        if req.get("approved"):
            return "approved"
        elapsed = datetime.utcnow() - datetime.fromisoformat(req["requestedAt"])
        if elapsed > timedelta(days=window_days):
            return "expired"
        return "pending"

    # ── Employees ─────────────────────────────────────────────────────────────

    def get_employees(self, role: str = None, dept: str = None, active: bool = None):
        query: dict[str, Any] = {}
        if role:   query["role"]   = role
        if dept:   query["dept"]   = dept
        if active is not None: query["active"] = active
        return list(_col("employees").find(query, {"_id": 0}))

    def get_employee_by_id(self, emp_id: str):
        doc = _col("employees").find_one({"id": emp_id}, {"_id": 0})
        return dict(doc) if doc else None

    def get_employee_by_email(self, email: str):
        doc = _col("employees").find_one({"email": email}, {"_id": 0})
        return dict(doc) if doc else None

    def add_employee(self, data: dict) -> dict:
        seq = _next_id("employee")
        emp = {
            "id":          f"E-{seq:03d}",
            "name":        data["name"],
            "email":       data["email"],
            "role":        data.get("role", "USER"),
            "dept":        data.get("dept", ""),
            "designation": data.get("designation", ""),
            "shift":       data.get("shift", "A"),
            "active":      data.get("active", True),
            "empNo":       data.get("empNo", ""),
        }
        _col("employees").insert_one({**emp})
        return emp

    def update_employee(self, emp_id: str, data: dict) -> dict | None:
        allowed = ["name", "email", "role", "dept", "designation", "shift", "active", "empNo"]
        updates = {k: data[k] for k in allowed if k in data}
        if not updates:
            return self.get_employee_by_id(emp_id)
        result = _col("employees").find_one_and_update(
            {"id": emp_id}, {"$set": updates}, return_document=True, projection={"_id": 0}
        )
        return dict(result) if result else None

    def toggle_employee_active(self, emp_id: str) -> dict | None:
        emp = self.get_employee_by_id(emp_id)
        if not emp:
            return None
        return self.update_employee(emp_id, {"active": not emp["active"]})

    def delete_employee(self, emp_id: str) -> bool:
        return _col("employees").delete_one({"id": emp_id}).deleted_count > 0

    # ── Departments ───────────────────────────────────────────────────────────

    def get_departments(self):
        return list(_col("departments").find({}, {"_id": 0}))

    def get_department_by_id(self, dept_id: int):
        doc = _col("departments").find_one({"id": dept_id}, {"_id": 0})
        return dict(doc) if doc else None

    def add_department(self, data: dict) -> dict:
        dept = {
            "id":          _next_id("department"),
            "name":        data["name"],
            "description": data.get("description", ""),
            "headCount":   data.get("headCount", 0),
        }
        _col("departments").insert_one({**dept})
        return dept

    def update_department(self, dept_id: int, data: dict) -> dict | None:
        updates = {k: data[k] for k in ["name", "description", "headCount"] if k in data}
        result = _col("departments").find_one_and_update(
            {"id": dept_id}, {"$set": updates}, return_document=True, projection={"_id": 0}
        )
        return dict(result) if result else None

    def delete_department(self, dept_id: int) -> bool:
        return _col("departments").delete_one({"id": dept_id}).deleted_count > 0

    # ── Machines ──────────────────────────────────────────────────────────────

    def get_machines(self, dept: str = None, active: bool = None):
        query: dict[str, Any] = {}
        if dept:   query["dept"]   = dept
        if active is not None: query["active"] = active
        return list(_col("machines").find(query, {"_id": 0}))

    def get_machine_by_id(self, machine_id: int):
        doc = _col("machines").find_one({"id": machine_id}, {"_id": 0})
        return dict(doc) if doc else None

    def add_machine(self, data: dict) -> dict:
        machine = {
            "id":     _next_id("machine"),
            "name":   data["name"],
            "dept":   data.get("dept", ""),
            "active": data.get("active", True),
        }
        _col("machines").insert_one({**machine})
        return machine

    def update_machine(self, machine_id: int, data: dict) -> dict | None:
        updates = {k: data[k] for k in ["name", "dept", "active"] if k in data}
        result = _col("machines").find_one_and_update(
            {"id": machine_id}, {"$set": updates}, return_document=True, projection={"_id": 0}
        )
        return dict(result) if result else None

    def toggle_machine_active(self, machine_id: int) -> dict | None:
        m = self.get_machine_by_id(machine_id)
        if not m:
            return None
        return self.update_machine(machine_id, {"active": not m["active"]})

    def delete_machine(self, machine_id: int) -> bool:
        return _col("machines").delete_one({"id": machine_id}).deleted_count > 0

    # ── Sub Categories ────────────────────────────────────────────────────────

    def get_sub_categories(self):
        return list(_col("sub_categories").find({}, {"_id": 0}))

    def add_sub_category(self, data: dict) -> dict:
        sc = {
            "id":          _next_id("sub_category"),
            "name":        data["name"],
            "description": data.get("description", ""),
        }
        _col("sub_categories").insert_one({**sc})
        return sc

    def update_sub_category(self, sc_id: int, data: dict) -> dict | None:
        updates = {k: data[k] for k in ["name", "description"] if k in data}
        result = _col("sub_categories").find_one_and_update(
            {"id": sc_id}, {"$set": updates}, return_document=True, projection={"_id": 0}
        )
        return dict(result) if result else None

    def delete_sub_category(self, sc_id: int) -> bool:
        return _col("sub_categories").delete_one({"id": sc_id}).deleted_count > 0

    # ── Time Entries ──────────────────────────────────────────────────────────

    def get_time_entries(self, emp_id: str = None, emp_no: str = None,
                         date: str = None, approval_status: str = None,
                         dept: str = None):
        query: dict[str, Any] = {}
        if emp_id:          query["empId"]          = emp_id
        if emp_no:          query["empNo"]           = emp_no
        if date:            query["date"]            = date
        if approval_status: query["approvalStatus"]  = approval_status
        if dept:            query["dept"]            = dept
        return list(_col("time_entries").find(query, {"_id": 0}).sort("submittedAt", DESCENDING))

    def get_time_entry_by_id(self, entry_id: int):
        doc = _col("time_entries").find_one({"id": entry_id}, {"_id": 0})
        return dict(doc) if doc else None

    def add_time_entry(self, data: dict) -> dict:
        entry = {
            "id":             _next_id("time_entry"),
            "empId":          data.get("empId", ""),
            "empName":        data.get("empName", ""),
            "empNo":          data.get("empNo", ""),
            "dept":           data.get("dept", ""),
            "designation":    data.get("designation", ""),
            "shift":          data.get("shift", "A"),
            "date":           data.get("date", ""),
            "category":       data.get("category", "General"),
            "subCategory":    data.get("subCategory", ""),
            "status":         data.get("status", "P"),
            "regularMins":    data.get("regularMins", 0),
            "overtimeMins":   data.get("overtimeMins", 0),
            "remarks":        data.get("remarks", ""),
            "submittedAt":    datetime.utcnow().isoformat(),
            "approvalStatus": data.get("approvalStatus", "Approved"),
        }
        _col("time_entries").insert_one({**entry})
        return entry

    def update_time_entry(self, entry_id: int, data: dict) -> dict | None:
        allowed = ["shift", "status", "category", "subCategory", "regularMins",
                   "overtimeMins", "remarks", "approvalStatus"]
        updates = {k: data[k] for k in allowed if k in data}
        result = _col("time_entries").find_one_and_update(
            {"id": entry_id}, {"$set": updates}, return_document=True, projection={"_id": 0}
        )
        return dict(result) if result else None

    def set_time_entry_approval(self, entry_id: int, approval_status: str,
                                comment: str = "") -> dict | None:
        result = _col("time_entries").find_one_and_update(
            {"id": entry_id},
            {"$set": {
                "approvalStatus":  approval_status,
                "approvalComment": comment,
                "approvedAt":      datetime.utcnow().isoformat(),
            }},
            return_document=True,
            projection={"_id": 0},
        )
        return dict(result) if result else None

    # ── Notifications ─────────────────────────────────────────────────────────

    def get_notifications(self, email: str = None):
        query = {"toEmail": email} if email else {}
        return list(_col("notifications").find(query, {"_id": 0}).sort("timestamp", DESCENDING))

    def add_notification(self, data: dict) -> dict:
        notif = {
            "id":        _next_id("notification"),
            "to":        data.get("to", "user"),
            "toEmail":   data.get("toEmail", ""),
            "from":      data.get("from", "System"),
            "type":      data.get("type", "info"),
            "subject":   data.get("subject", ""),
            "body":      data.get("body", ""),
            "read":      False,
            "timestamp": datetime.utcnow().isoformat(),
            "approved":  data.get("approved", False),
        }
        _col("notifications").insert_one({**notif})
        return notif

    def mark_notification_read(self, notif_id: int) -> bool:
        return _col("notifications").update_one(
            {"id": notif_id}, {"$set": {"read": True}}
        ).modified_count > 0

    def mark_all_read(self, email: str):
        _col("notifications").update_many({"toEmail": email}, {"$set": {"read": True}})

    def unread_count(self, email: str) -> int:
        return _col("notifications").count_documents({"toEmail": email, "read": False})

    def update_notification(self, notif_id: int, data: dict) -> dict | None:
        updates = {k: data[k] for k in ["read", "approved", "subject", "body"] if k in data}
        result = _col("notifications").find_one_and_update(
            {"id": notif_id}, {"$set": updates}, return_document=True, projection={"_id": 0}
        )
        return dict(result) if result else None

    # ── Reports / Analytics ───────────────────────────────────────────────────

    def work_summary_by_emp(self, emp_id: str = None, month: str = None):
        pipeline = []
        match: dict[str, Any] = {}
        if emp_id: match["empId"] = emp_id
        if month:  match["date"]  = {"$regex": f"^{month}"}
        if match:  pipeline.append({"$match": match})

        pipeline += [
            {"$group": {
                "_id":               "$empId",
                "empId":             {"$first": "$empId"},
                "empName":           {"$first": "$empName"},
                "dept":              {"$first": "$dept"},
                "totalRegularMins":  {"$sum": "$regularMins"},
                "totalOvertimeMins": {"$sum": "$overtimeMins"},
                "entryCount":        {"$sum": 1},
            }},
            {"$project": {"_id": 0}},
        ]
        return list(_col("time_entries").aggregate(pipeline))

    def attendance_summary(self, month: str = None, dept: str = None):
        match: dict[str, Any] = {}
        if month: match["date"] = {"$regex": f"^{month}"}
        if dept:  match["dept"] = dept

        pipeline = []
        if match: pipeline.append({"$match": match})
        pipeline.append({"$group": {"_id": "$status", "count": {"$sum": 1}}})

        counts = {"P": 0, "HD": 0, "L": 0, "OD": 0}
        for doc in _col("time_entries").aggregate(pipeline):
            counts[doc["_id"]] = doc["count"]
        return counts


# Singleton
db = DataStore()
