from datetime import datetime, timedelta
from typing import Any, List, Optional
from pymongo import ASCENDING, DESCENDING
from app.database.connection import db_connection
from app.models.database import (
    COL_CREDENTIALS,
    COL_EMPLOYEES,
    COL_DEPARTMENTS,
    COL_MACHINES,
    COL_WORK_CATEGORIES,
    COL_SUB_CATEGORIES,
    COL_TIME_ENTRIES,
    COL_NOTIFICATIONS,
    COL_RESET_REQUESTS,
    COL_COUNTERS
)

class BaseRepository:
    def __init__(self, collection_name: str):
        self.collection_name = collection_name

    @property
    def collection(self):
        return db_connection.get_collection(self.collection_name)

    def _next_id(self, kind: str) -> int:
        """Atomic auto-increment counter using the counters collection."""
        result = db_connection.get_collection(COL_COUNTERS).find_one_and_update(
            {"_id": kind},
            {"$inc": {"seq": 1}},
            upsert=True,
            return_document=True
        )
        return result["seq"]

    def _clean(self, doc: dict | None) -> dict | None:
        """Helper to return a copy with standard Python types if required."""
        if doc is None:
            return None
        d = dict(doc)
        if "_id" in d:
            d["_id"] = str(d["_id"])
        return d


class CredentialsRepository(BaseRepository):
    def __init__(self):
        super().__init__(COL_CREDENTIALS)

    def find_by_emp_no(self, emp_no: str) -> Optional[dict]:
        doc = self.collection.find_one({"empNo": emp_no})
        return self._clean(doc)

    def find_by_email(self, email: str) -> Optional[dict]:
        doc = self.collection.find_one({"email": email})
        return self._clean(doc)

    def create(self, cred_data: dict) -> dict:
        self.collection.insert_one(cred_data)
        return self._clean(cred_data)

    def update_password(self, email: str, hashed_password: str) -> bool:
        r = self.collection.update_one(
            {"email": email},
            {"$set": {"password": hashed_password}}
        )
        return r.modified_count > 0

    def reset_password_to_default(self, emp_no: str, hashed_default: str) -> bool:
        r = self.collection.update_one(
            {"empNo": emp_no},
            {"$set": {"password": hashed_default}}
        )
        return r.modified_count > 0

    def delete_by_email(self, email: str) -> bool:
        return self.collection.delete_one({"email": email}).deleted_count > 0


class EmployeesRepository(BaseRepository):
    def __init__(self):
        super().__init__(COL_EMPLOYEES)

    def get_all(self, role: Optional[str] = None, dept: Optional[str] = None, active: Optional[bool] = None) -> List[dict]:
        query: dict = {}
        if role:
            query["role"] = role
        if dept:
            query["dept"] = dept
        if active is not None:
            if active:
                query["$or"] = [{"active": True}, {"active": {"$exists": False}}]
            else:
                query["active"] = False
        docs = self.collection.find(query)
        return [self._clean(d) for d in docs]

    def get_by_id(self, emp_id: str) -> Optional[dict]:
        doc = self.collection.find_one({"id": emp_id})
        return self._clean(doc)

    def get_by_emp_no(self, emp_no: str) -> Optional[dict]:
        doc = self.collection.find_one({"empNo": emp_no})
        return self._clean(doc)

    def get_by_email(self, email: str) -> Optional[dict]:
        doc = self.collection.find_one({"email": email})
        return self._clean(doc)

    def add(self, data: dict) -> dict:
        seq = self._next_id("employee")
        role = data.get("role", "USER")
        
        # Determine unique alphanumeric ID prefix based on role
        prefix = "E"
        if role == "SUPER_ADMIN":
            prefix = "SA"
        elif role == "OPERATOR":
            prefix = "OP"
        elif role == "ADMIN":
            prefix = "AD"
            
        emp = {
            "id": f"{prefix}-{seq:03d}",
            "name": data["name"],
            "email": data["email"],
            "role": role,
            "dept": data.get("dept", ""),
            "designation": data.get("designation", ""),
            "active": data.get("active", True),
            "empNo": data.get("empNo", "")
            # shift intentionally excluded — it is operational data, not employee master data
        }
        self.collection.insert_one(emp)
        return self._clean(emp)

    def update(self, emp_id: str, data: dict) -> Optional[dict]:
        allowed = ["name", "email", "role", "dept", "designation", "active", "empNo"]
        updates = {k: data[k] for k in allowed if k in data}
        if not updates:
            return self.get_by_id(emp_id)
        result = self.collection.find_one_and_update(
            {"id": emp_id},
            {"$set": updates},
            return_document=True
        )
        return self._clean(result)

    def toggle_active(self, emp_id: str) -> Optional[dict]:
        emp = self.get_by_id(emp_id)
        if not emp:
            return None
        return self.update(emp_id, {"active": not emp["active"]})

    def delete(self, emp_id: str) -> bool:
        return self.collection.delete_one({"id": emp_id}).deleted_count > 0


class DepartmentsRepository(BaseRepository):
    def __init__(self):
        super().__init__(COL_DEPARTMENTS)

    def get_all(self) -> List[dict]:
        docs = self.collection.find({})
        return [self._clean(d) for d in docs]

    def get_by_id(self, dept_id: int) -> Optional[dict]:
        doc = self.collection.find_one({"id": dept_id})
        return self._clean(doc)

    def get_by_name(self, name: str) -> Optional[dict]:
        doc = self.collection.find_one({"name": name})
        return self._clean(doc)

    def add(self, data: dict) -> dict:
        dept = {
            "id": self._next_id("department"),
            "name": data["name"],
            "description": data.get("description", ""),
            "headCount": data.get("headCount", 0)
        }
        self.collection.insert_one(dept)
        return self._clean(dept)

    def update(self, dept_id: int, data: dict) -> Optional[dict]:
        updates = {k: data[k] for k in ["name", "description", "headCount"] if k in data}
        result = self.collection.find_one_and_update(
            {"id": dept_id},
            {"$set": updates},
            return_document=True
        )
        return self._clean(result)

    def delete(self, dept_id: int) -> bool:
        return self.collection.delete_one({"id": dept_id}).deleted_count > 0


class MachinesRepository(BaseRepository):
    def __init__(self):
        super().__init__(COL_MACHINES)

    def get_all(self, dept: Optional[str] = None, active: Optional[bool] = None) -> List[dict]:
        query: dict = {}
        if dept:
            query["dept"] = dept
        if active is not None:
            if active:
                query["$or"] = [{"active": True}, {"active": {"$exists": False}}]
            else:
                query["active"] = False
        docs = self.collection.find(query)
        return [self._clean(d) for d in docs]

    def get_by_id(self, machine_id: int) -> Optional[dict]:
        doc = self.collection.find_one({"id": machine_id})
        return self._clean(doc)

    def add(self, data: dict) -> dict:
        machine = {
            "id": self._next_id("machine"),
            "name": data["name"],
            "dept": data.get("dept", ""),
            "active": data.get("active", True)
        }
        self.collection.insert_one(machine)
        return self._clean(machine)

    def update(self, machine_id: int, data: dict) -> Optional[dict]:
        updates = {k: data[k] for k in ["name", "dept", "active"] if k in data}
        result = self.collection.find_one_and_update(
            {"id": machine_id},
            {"$set": updates},
            return_document=True
        )
        return self._clean(result)

    def toggle_active(self, machine_id: int) -> Optional[dict]:
        m = self.get_by_id(machine_id)
        if not m:
            return None
        return self.update(machine_id, {"active": not m["active"]})

    def delete(self, machine_id: int) -> bool:
        return self.collection.delete_one({"id": machine_id}).deleted_count > 0


class WorkCategoriesRepository(BaseRepository):
    """Global work categories — managed by SUPER_ADMIN only."""

    def __init__(self):
        super().__init__(COL_WORK_CATEGORIES)

    def get_all(self, active: Optional[bool] = None) -> List[dict]:
        query: dict = {}
        if active is not None:
            if active:
                query["$or"] = [{"active": True}, {"active": {"$exists": False}}]
            else:
                query["active"] = False
        docs = self.collection.find(query).sort("id", ASCENDING)
        return [self._clean(d) for d in docs]

    def get_by_id(self, wc_id: int) -> Optional[dict]:
        doc = self.collection.find_one({"id": wc_id})
        return self._clean(doc)

    def get_by_name(self, name: str) -> Optional[dict]:
        doc = self.collection.find_one({"name": name})
        return self._clean(doc)

    def add(self, data: dict) -> dict:
        wc = {
            "id": self._next_id("work_category"),
            "name": data["name"],
            "description": data.get("description", ""),
            "active": data.get("active", True)
        }
        self.collection.insert_one(wc)
        return self._clean(wc)

    def update(self, wc_id: int, data: dict) -> Optional[dict]:
        updates = {k: data[k] for k in ["name", "description", "active"] if k in data}
        result = self.collection.find_one_and_update(
            {"id": wc_id},
            {"$set": updates},
            return_document=True
        )
        return self._clean(result)

    def delete(self, wc_id: int) -> bool:
        return self.collection.delete_one({"id": wc_id}).deleted_count > 0


class SubCategoriesRepository(BaseRepository):
    def __init__(self):
        super().__init__(COL_SUB_CATEGORIES)

    def get_all(
        self,
        work_category_id: Optional[int] = None,
        department: Optional[str] = None,
        active: Optional[bool] = None
    ) -> List[dict]:
        query: dict = {}
        if work_category_id is not None:
            query["workCategoryId"] = work_category_id
        if department:
            query["department"] = department
        if active is not None:
            if active:
                query["$or"] = [{"active": True}, {"active": {"$exists": False}}]
            else:
                query["active"] = False
        docs = self.collection.find(query).sort("name", ASCENDING)
        return [self._clean(d) for d in docs]

    def get_by_id(self, sc_id: int) -> Optional[dict]:
        doc = self.collection.find_one({"id": sc_id})
        return self._clean(doc)

    def get_by_name(self, name: str) -> Optional[dict]:
        doc = self.collection.find_one({"name": name})
        return self._clean(doc)

    def add(self, data: dict) -> dict:
        sc = {
            "id": self._next_id("sub_category"),
            "name": data["name"],
            "description": data.get("description", ""),
            "workCategoryId": data.get("workCategoryId"),
            "department": data.get("department"),
            "active": data.get("active", True)
        }
        self.collection.insert_one(sc)
        return self._clean(sc)

    def update(self, sc_id: int, data: dict) -> Optional[dict]:
        allowed = ["name", "description", "workCategoryId", "department", "active"]
        updates = {k: data[k] for k in allowed if k in data}
        result = self.collection.find_one_and_update(
            {"id": sc_id},
            {"$set": updates},
            return_document=True
        )
        return self._clean(result)

    def delete(self, sc_id: int) -> bool:
        return self.collection.delete_one({"id": sc_id}).deleted_count > 0


class TimeEntriesRepository(BaseRepository):
    def __init__(self):
        super().__init__(COL_TIME_ENTRIES)

    def get_all(self, emp_id: Optional[str] = None, emp_no: Optional[str] = None,
                date: Optional[str] = None, date_from: Optional[str] = None,
                date_to: Optional[str] = None, approval_status: Optional[str] = None,
                dept: Optional[str] = None, month: Optional[str] = None,
                shift: Optional[str] = None) -> List[dict]:
        query: dict = {}
        if emp_id:
            query["empId"] = emp_id
        if emp_no:
            query["empNo"] = emp_no
        if date:
            query["date"] = date
        if approval_status:
            query["approvalStatus"] = approval_status
        if dept:
            query["dept"] = dept
        if month:
            # Matches YYYY-MM prefix in date string (YYYY-MM-DD)
            query["date"] = {"$regex": f"^{month}"}
        if shift:
            query["shift"] = shift

        # Date range filtering (date_from / date_to)
        if date_from or date_to:
            date_filter = query.get("date", {})
            if isinstance(date_filter, str):
                # If an exact date was already set, date range takes precedence
                date_filter = {}
            if date_from:
                date_filter["$gte"] = date_from
            if date_to:
                date_filter["$lte"] = date_to
            query["date"] = date_filter
            
        docs = self.collection.find(query).sort("submittedAt", DESCENDING)
        return [self._clean(d) for d in docs]

    def get_by_id(self, entry_id: int) -> Optional[dict]:
        doc = self.collection.find_one({"id": entry_id})
        return self._clean(doc)

    def add(self, data: dict) -> dict:
        entry = {
            "id": self._next_id("time_entry"),
            "empId": data.get("empId", ""),
            "empName": data.get("empName", ""),
            "empNo": data.get("empNo", ""),
            "dept": data.get("dept", ""),
            "designation": data.get("designation", ""),
            "shift": data.get("shift", "A"),
            "date": data.get("date", ""),
            # Backward-compatible string fields
            "category": data.get("category", "General"),
            "subCategory": data.get("subCategory", ""),
            # New ID references for analytics and reporting
            "workCategoryId": data.get("workCategoryId"),
            "subCategoryId": data.get("subCategoryId"),
            "status": data.get("status", "P"),
            "regularMins": data.get("regularMins", 0),
            "overtimeMins": data.get("overtimeMins", 0),
            "remarks": data.get("remarks", ""),
            "machineRows": data.get("machineRows", []),
            "submittedAt": datetime.utcnow().isoformat(),
            "approvalStatus": data.get("approvalStatus", "Approved")
        }
        self.collection.insert_one(entry)
        return self._clean(entry)

    def update(self, entry_id: int, data: dict) -> Optional[dict]:
        allowed = [
            "shift", "status", "category", "subCategory",
            "workCategoryId", "subCategoryId",
            "regularMins", "overtimeMins", "remarks", "approvalStatus", "machineRows"
        ]
        updates = {k: data[k] for k in allowed if k in data}
        result = self.collection.find_one_and_update(
            {"id": entry_id},
            {"$set": updates},
            return_document=True
        )
        return self._clean(result)

    def set_approval(self, entry_id: int, approval_status: str, comment: str = "") -> Optional[dict]:
        result = self.collection.find_one_and_update(
            {"id": entry_id},
            {"$set": {
                "approvalStatus": approval_status,
                "approvalComment": comment,
                "approvedAt": datetime.utcnow().isoformat()
            }},
            return_document=True
        )
        return self._clean(result)


class NotificationsRepository(BaseRepository):
    def __init__(self):
        super().__init__(COL_NOTIFICATIONS)

    def get_by_id(self, notif_id: int) -> Optional[dict]:
        doc = self.collection.find_one({"id": notif_id})
        return self._clean(doc)

    def get_all(self, email: Optional[str] = None) -> List[dict]:
        query = {"toEmail": email} if email else {}
        docs = self.collection.find(query).sort("timestamp", DESCENDING)
        return [self._clean(d) for d in docs]

    def add(self, data: dict) -> dict:
        notif = {
            "id": self._next_id("notification"),
            "to": data.get("to", "user"),
            "toEmail": data.get("toEmail", ""),
            "from": data.get("from", "System"),
            "type": data.get("type", "info"),
            "subject": data.get("subject", ""),
            "body": data.get("body", ""),
            "read": False,
            "timestamp": datetime.utcnow().isoformat(),
            "approved": data.get("approved", False)
        }
        self.collection.insert_one(notif)
        return self._clean(notif)

    def mark_read(self, notif_id: int) -> bool:
        r = self.collection.update_one(
            {"id": notif_id},
            {"$set": {"read": True}}
        )
        return r.modified_count > 0

    def mark_all_read(self, email: str):
        self.collection.update_many(
            {"toEmail": email},
            {"$set": {"read": True}}
        )

    def unread_count(self, email: str) -> int:
        return self.collection.count_documents({"toEmail": email, "read": False})

    def update(self, notif_id: int, data: dict) -> Optional[dict]:
        updates = {k: data[k] for k in ["read", "approved", "subject", "body"] if k in data}
        result = self.collection.find_one_and_update(
            {"id": notif_id},
            {"$set": updates},
            return_document=True
        )
        return self._clean(result)

    def delete_by_id(self, notif_id: int, email: Optional[str] = None) -> bool:
        query = {"id": notif_id}
        if email:
            query["toEmail"] = email
        return self.collection.delete_one(query).deleted_count > 0

    def delete_all(self, email: Optional[str] = None) -> int:
        query = {"toEmail": email} if email else {}
        result = self.collection.delete_many(query)
        return result.deleted_count


class ResetRequestsRepository(BaseRepository):
    def __init__(self):
        super().__init__(COL_RESET_REQUESTS)

    def add(self, emp_no: str) -> dict:
        req = {
            "empNo": emp_no,
            "requestedAt": datetime.utcnow().isoformat(),
            "approved": False,
            "rejected": False
        }
        self.collection.update_one(
            {"empNo": emp_no},
            {"$set": req},
            upsert=True
        )
        return self._clean(req)

    def get_by_emp_no(self, emp_no: str) -> Optional[dict]:
        doc = self.collection.find_one({"empNo": emp_no})
        return self._clean(doc)

    def get_all_pending(self) -> List[dict]:
        docs = self.collection.find({"approved": False, "rejected": False})
        return [self._clean(d) for d in docs]

    def get_all(self) -> List[dict]:
        docs = self.collection.find({})
        return [self._clean(d) for d in docs]

    def set_action(self, emp_no: str, action: str) -> bool:
        # action: "approve" or "reject"
        approved = (action == "approve")
        rejected = (action == "reject")
        r = self.collection.update_one(
            {"empNo": emp_no},
            {"$set": {
                "approved": approved,
                "rejected": rejected,
                "resolvedAt": datetime.utcnow().isoformat()
            }}
        )
        return r.modified_count > 0

    def delete_by_emp_no(self, emp_no: str) -> bool:
        return self.collection.delete_one({"empNo": emp_no}).deleted_count > 0
