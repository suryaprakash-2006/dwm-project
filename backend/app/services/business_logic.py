from datetime import datetime
from typing import Dict, List, Optional
from app.core.config import settings
from app.repositories.db_repository import (
    EmployeesRepository,
    CredentialsRepository,
    DepartmentsRepository,
    MachinesRepository,
    WorkCategoriesRepository,
    SubCategoriesRepository,
    TimeEntriesRepository,
    NotificationsRepository,
    ResetRequestsRepository
)


# ── Config-driven limits (never hardcode these values) ────────────────────────
MAX_REGULAR_MINS = settings.MAX_REGULAR_HOURS_PER_DAY * 60   # 480 by default
MAX_OVERTIME_MINS = settings.MAX_OVERTIME_HOURS_PER_DAY * 60  # 480 by default
MAX_TOTAL_MINS = settings.MAX_TOTAL_HOURS_PER_DAY * 60        # 960 by default


class BusinessLogicService:
    def __init__(self):
        self.emp_repo = EmployeesRepository()
        self.cred_repo = CredentialsRepository()
        self.dept_repo = DepartmentsRepository()
        self.machine_repo = MachinesRepository()
        self.wc_repo = WorkCategoriesRepository()
        self.sc_repo = SubCategoriesRepository()
        self.time_repo = TimeEntriesRepository()
        self.notif_repo = NotificationsRepository()
        self.reset_repo = ResetRequestsRepository()


    # ─── Employee & Credentials Coordination ──────────────────────────────────

    def register_employee(self, emp_data: dict, hashed_default_password: str) -> dict:
        """
        Creates an employee profile and automatically initializes default login credentials.
        Increments department headcount if matching department name exists.
        Shift is excluded from employee master data.
        """
        emp = self.emp_repo.add(emp_data)

        self.cred_repo.create({
            "empNo": emp["empNo"],
            "password": hashed_default_password,
            "role": emp["role"],
            "department": emp["dept"],
            "email": emp["email"]
        })

        dept = self.dept_repo.get_by_name(emp["dept"])
        if dept:
            self.dept_repo.update(dept["id"], {"headCount": dept["headCount"] + 1})

        self.notif_repo.add({
            "to": "user" if emp["role"] in ["USER", "OPERATOR"] else "admin",
            "toEmail": emp["email"],
            "from": "System",
            "type": "success",
            "subject": "Welcome to DWM Portal",
            "body": f"Welcome {emp['name']}! Your account is active. Start logging your work entries."
        })

        return emp

    def terminate_employee(self, emp_id: str) -> bool:
        """
        Deletes employee profile, credentials, and decrements department headcount.
        """
        emp = self.emp_repo.get_by_id(emp_id)
        if not emp:
            return False

        deleted = self.emp_repo.delete(emp_id)
        if deleted:
            self.cred_repo.delete_by_email(emp["email"])
            self.reset_repo.delete_by_emp_no(emp["empNo"])
            dept = self.dept_repo.get_by_name(emp["dept"])
            if dept and dept["headCount"] > 0:
                self.dept_repo.update(dept["id"], {"headCount": dept["headCount"] - 1})
        return deleted

    # ─── Time Entry Business Rules ────────────────────────────────────────────

    def get_daily_used_mins(self, emp_id: str, date: str) -> dict:
        """
        Returns total approved + pending REGULAR and OVERTIME minutes already logged
        for an employee on a given date.
        Rejected entries are EXCLUDED per business rules.
        Returns:
          {
            "approvedRegularMins": int,
            "pendingRegularMins": int,
            "approvedOvertimeMins": int,
            "pendingOvertimeMins": int,
            "totalActiveRegularMins": int,
            "totalActiveOvertimeMins": int,
          }
        """
        existing = self.time_repo.get_all(emp_id=emp_id, date=date)
        approved_regular = 0
        pending_regular = 0
        approved_overtime = 0
        pending_overtime = 0

        for entry in existing:
            status_val = entry.get("approvalStatus")
            if status_val in ("Rejected", "Draft"):
                # Rejected and Draft entries must NOT count towards daily limits
                continue
            reg = entry.get("regularMins", 0)
            ot = entry.get("overtimeMins", 0)
            if status_val == "Approved":
                approved_regular += reg
                approved_overtime += ot
            elif status_val == "Pending":
                pending_regular += reg
                pending_overtime += ot

        return {
            "approvedRegularMins": approved_regular,
            "pendingRegularMins": pending_regular,
            "approvedOvertimeMins": approved_overtime,
            "pendingOvertimeMins": pending_overtime,
            "totalActiveRegularMins": approved_regular + pending_regular,
            "totalActiveOvertimeMins": approved_overtime + pending_overtime,
        }

    def submit_time_entry(self, entry_data: dict) -> dict:
        """
        Submits a work log entry with strict hour validation.

        Business Rules:
          - Future dates are rejected.
          - If entry is submitted >3 days after target date, marks as 'Pending'.
          - Otherwise auto-approved ('Approved').
          - MAX regular hours: MAX_REGULAR_HOURS_PER_DAY (8h) per day per employee.
          - MAX overtime hours: MAX_OVERTIME_HOURS_PER_DAY (8h) per day per employee.
          - MAX total (regular + overtime): MAX_TOTAL_HOURS_PER_DAY (16h) per day per employee.
          - Pending entries MUST be counted (not ignored).
          - Rejected entries MUST be excluded.
          - System does NOT silently convert regular hours to overtime.
          - User must explicitly enter overtime hours.
        """
        from datetime import datetime as _dt
        from fastapi import HTTPException, status as http_status

        today = _dt.now()
        today_str = today.strftime("%Y-%m-%d")
        target_date_str = entry_data["date"]

        # Reject future dates
        if target_date_str > today_str:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Cannot submit time entry for a future date."
            )

        target_date = _dt.strptime(target_date_str, "%Y-%m-%d")
        today_start = _dt(today.year, today.month, today.day)
        delta = today_start - target_date

        # Determine approval status based on delay
        if entry_data.get("approvalStatus") != "Draft":
            if delta.days > 3:
                entry_data["approvalStatus"] = "Pending"
            else:
                entry_data["approvalStatus"] = "Approved"

        submitted_regular_mins = entry_data.get("regularMins", 0)
        submitted_overtime_mins = entry_data.get("overtimeMins", 0)
        emp_id = entry_data.get("empId", "")

        # Fetch existing daily usage (approved + pending, rejections excluded)
        daily = self.get_daily_used_mins(emp_id, target_date_str)
        used_regular = daily["totalActiveRegularMins"]
        used_overtime = daily["totalActiveOvertimeMins"]

        # ── Regular hours validation ──────────────────────────────────────────
        remaining_regular = max(0, MAX_REGULAR_MINS - used_regular)
        if submitted_regular_mins > remaining_regular:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    f"Regular working hours exceed the daily limit of "
                    f"{settings.MAX_REGULAR_HOURS_PER_DAY} hours. "
                    f"You have {round(remaining_regular / 60, 2)}h remaining regular capacity. "
                    f"Excess hours must be recorded as Overtime."
                )
            )

        # ── Overtime hours validation ─────────────────────────────────────────
        remaining_overtime = max(0, MAX_OVERTIME_MINS - used_overtime)
        if submitted_overtime_mins > remaining_overtime:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    f"Maximum overtime allowed per day is "
                    f"{settings.MAX_OVERTIME_HOURS_PER_DAY} hours. "
                    f"You have {round(remaining_overtime / 60, 2)}h remaining overtime capacity."
                )
            )

        # ── Total hours validation ────────────────────────────────────────────
        new_total_regular = used_regular + submitted_regular_mins
        new_total_overtime = used_overtime + submitted_overtime_mins
        if new_total_regular + new_total_overtime > MAX_TOTAL_MINS:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    f"Total daily hours (regular + overtime) cannot exceed "
                    f"{settings.MAX_TOTAL_HOURS_PER_DAY} hours per day."
                )
            )

        # ── Resolve workCategoryId and subCategoryId if not provided ──────────
        # This ensures backward compatibility: if frontend sends category/subCategory
        # strings only (legacy), we attempt to look up the IDs from the collections.
        # If IDs are already provided (new flow), they take precedence.
        if not entry_data.get("workCategoryId"):
            category_name = entry_data.get("category", "")
            if category_name:
                wc = self.wc_repo.get_by_name(category_name)
                if wc:
                    entry_data["workCategoryId"] = wc["id"]
                else:
                    # Map to Unassigned if not found
                    unassigned = self.wc_repo.get_by_name("Unassigned")
                    if unassigned:
                        entry_data["workCategoryId"] = unassigned["id"]

        if not entry_data.get("subCategoryId"):
            sub_category_name = entry_data.get("subCategory", "")
            if sub_category_name:
                sc = self.sc_repo.get_by_name(sub_category_name)
                if sc:
                    entry_data["subCategoryId"] = sc["id"]

        # Values are validated — save as-is (no silent manipulation)
        entry = self.time_repo.add(entry_data)

        # If pending, notify ADMIN (time entry approvals are admin's job)
        if entry["approvalStatus"] == "Pending":
            admins = self.emp_repo.get_all(role="ADMIN")
            for admin in admins:
                self.notif_repo.add({
                    "to": "admin",
                    "toEmail": admin["email"],
                    "from": entry["empName"],
                    "type": "warning",
                    "subject": "Late Time Entry Approval Request",
                    "body": f"Employee {entry['empName']} submitted a late entry for {entry['date']}. Action required."
                })

        return entry

    def update_time_entry(self, entry_id: int, updates: dict) -> dict:
        """
        Updates a time entry and validates hours limits (max 8h reg, 8h ot, 16h total per day).
        Does NOT count rejected entries.
        Does count pending + approved entries.
        """
        from fastapi import HTTPException, status as http_status

        entry = self.time_repo.get_by_id(entry_id)
        if not entry:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"Time entry with ID {entry_id} not found"
            )

        # Merge updates to calculate projected new totals
        new_reg = updates.get("regularMins", entry.get("regularMins", 0))
        new_ot = updates.get("overtimeMins", entry.get("overtimeMins", 0))
        date_str = entry["date"]
        emp_id = entry["empId"]

        # Fetch other entries for this date (excluding this one)
        existing = self.time_repo.get_all(emp_id=emp_id, date=date_str)
        other_reg = 0
        other_ot = 0

        for e in existing:
            if e["id"] == entry_id:
                continue
            if e.get("approvalStatus") in ("Rejected", "Draft"):
                continue
            other_reg += e.get("regularMins", 0)
            other_ot += e.get("overtimeMins", 0)

        # Validate limits
        if other_reg + new_reg > MAX_REGULAR_MINS:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Regular working hours exceed daily limit of {settings.MAX_REGULAR_HOURS_PER_DAY} hours."
            )

        if other_ot + new_ot > MAX_OVERTIME_MINS:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Overtime working hours exceed daily limit of {settings.MAX_OVERTIME_HOURS_PER_DAY} hours."
            )

        if other_reg + new_reg + other_ot + new_ot > MAX_TOTAL_MINS:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Total daily hours exceed cap of {settings.MAX_TOTAL_HOURS_PER_DAY} hours."
            )

        updated = self.time_repo.update(entry_id, updates)
        return updated

    # ─── Password Reset Request Logic ─────────────────────────────────────────

    def submit_password_reset_request(self, emp_no: str) -> Optional[dict]:
        """
        Queues password reset requests.
        Notification goes to SUPER_ADMIN ONLY (not ADMIN).
        """
        emp = self.emp_repo.get_by_emp_no(emp_no)
        if not emp:
            return None

        req = self.reset_repo.add(emp_no)

        # Notify SUPER_ADMIN only
        super_admins = self.emp_repo.get_all(role="SUPER_ADMIN")
        for sa in super_admins:
            self.notif_repo.add({
                "to": "admin",
                "toEmail": sa["email"],
                "from": f"Employee #{emp_no}",
                "type": "warning",
                "subject": "Password Reset Request",
                "body": f"Employee {emp['name']} (#{emp_no}) has requested a password reset. Your approval is required."
            })

        return req

    # ─── Custom Analytics Reports Aggregations ───────────────────────────────

    def get_monthly_shift_report(self, month: str, shift: str) -> List[dict]:
        """
        GET /reports/monthly?month=YYYY-MM&shift=X
        Aggregates APPROVED work minutes: regular hours, overtime, total entries count by employee.
        Only Approved entries are counted.
        Returns separate regularHours, overtimeHours, totalHours columns.
        """
        entries = self.time_repo.get_all(month=month, shift=shift, approval_status="Approved")

        records: Dict[str, dict] = {}
        for entry in entries:
            emp_id = entry["empId"]
            if emp_id not in records:
                records[emp_id] = {
                    "empId": emp_id,
                    "employee": entry["empName"],
                    "email": entry.get("email", ""),
                    "dept": entry["dept"],
                    "designation": entry["designation"],
                    "shift": shift,
                    "regularHours": 0,
                    "overtimeHours": 0,
                    "totalHours": 0,
                    "regularMins": 0,
                    "overtimeMins": 0,
                    "entryCount": 0,
                    "approvalStatus": "Approved"
                }

            records[emp_id]["regularMins"] += entry["regularMins"]
            records[emp_id]["overtimeMins"] += entry["overtimeMins"]
            records[emp_id]["entryCount"] += 1

        report_data = []
        for rec in records.values():
            rec["regularHours"] = round(rec["regularMins"] / 60.0, 2)
            rec["overtimeHours"] = round(rec["overtimeMins"] / 60.0, 2)
            rec["totalHours"] = round((rec["regularMins"] + rec["overtimeMins"]) / 60.0, 2)
            report_data.append(rec)

        return report_data

    def get_attendance_report(self, month: Optional[str] = None, dept: Optional[str] = None) -> dict:
        """
        GET /reports/attendance
        Aggregates counts of P, HD, L, and OD status keys — APPROVED entries only.
        """
        entries = self.time_repo.get_all(month=month, dept=dept, approval_status="Approved")

        counts = {"P": 0, "HD": 0, "L": 0, "OD": 0}
        for entry in entries:
            s = entry["status"]
            if s in counts:
                counts[s] += 1

        return counts

    def get_productivity_report(self, month: Optional[str] = None, dept: Optional[str] = None) -> dict:
        """
        GET /reports/productivity
        Aggregates APPROVED regular minutes logged vs overtime.
        CRITICAL: Productivity KPIs use ONLY approved regular hours — overtime excluded.
        """
        entries = self.time_repo.get_all(month=month, dept=dept, approval_status="Approved")

        total_regular_mins = 0
        total_overtime_mins = 0
        days_met_target = 0
        total_days = len(entries)

        for entry in entries:
            total_regular_mins += entry["regularMins"]
            total_overtime_mins += entry["overtimeMins"]
            if entry["regularMins"] >= MAX_REGULAR_MINS:
                days_met_target += 1

        return {
            "totalRegularHours": round(total_regular_mins / 60.0, 2),
            "totalOvertimeHours": round(total_overtime_mins / 60.0, 2),
            "daysMetTarget": days_met_target,
            "totalDaysLogged": total_days,
            "targetAchievementPercent": round(
                (days_met_target / total_days * 100) if total_days > 0 else 0, 2
            )
        }

    def get_work_summary_report(
        self,
        month: Optional[str] = None,
        dept: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        emp_id: Optional[str] = None
    ) -> List[dict]:
        """
        GET /reports/work-summary
        Detailed work log summaries — APPROVED entries only.
        Returns: Employee | Department | Date | Regular Hours | Overtime Hours | Total Hours | Approval Status
        """
        entries = self.time_repo.get_all(
            month=month,
            dept=dept,
            date_from=date_from,
            date_to=date_to,
            emp_id=emp_id,
            approval_status="Approved"
        )

        summary = []
        for entry in entries:
            reg_hrs = round(entry["regularMins"] / 60.0, 2)
            ot_hrs = round(entry["overtimeMins"] / 60.0, 2)
            # Resolve workCategory name from workCategoryId if present, else use category string
            work_category_name = entry.get("category", "")
            if entry.get("workCategoryId"):
                wc = self.wc_repo.get_by_id(entry["workCategoryId"])
                if wc:
                    work_category_name = wc["name"]

            # Resolve subCategory name from subCategoryId if present, else use subCategory string
            sub_category_name = entry.get("subCategory", "")
            if entry.get("subCategoryId"):
                sc = self.sc_repo.get_by_id(entry["subCategoryId"])
                if sc:
                    sub_category_name = sc["name"]

            summary.append({
                "date": entry["date"],
                "empId": entry["empId"],
                "empNo": entry["empNo"],
                "employee": entry["empName"],
                "dept": entry["dept"],
                "designation": entry["designation"],
                "shift": entry.get("shift", ""),
                "category": work_category_name,
                "subCategory": sub_category_name,
                "workCategoryId": entry.get("workCategoryId"),
                "subCategoryId": entry.get("subCategoryId"),
                "regularHours": reg_hrs,
                "overtimeHours": ot_hrs,
                "totalHours": round(reg_hrs + ot_hrs, 2),
                "status": entry["status"],
                "remarks": entry["remarks"],
                "approvalStatus": entry["approvalStatus"]
            })
        return summary

    def get_dashboard_kpis(self) -> dict:
        total_emp = len(self.emp_repo.get_all())
        active_emp = len(self.emp_repo.get_all(active=True))
        dept_count = len(self.dept_repo.get_all())
        machine_count = len(self.machine_repo.get_all())
        active_machines = len(self.machine_repo.get_all(active=True))

        all_entries = self.time_repo.get_all()
        total_entries = len(all_entries)
        pending_entries = len([e for e in all_entries if e["approvalStatus"] == "Pending"])
        approved_entries = len([e for e in all_entries if e["approvalStatus"] == "Approved"])
        rejected_entries = len([e for e in all_entries if e["approvalStatus"] == "Rejected"])

        # KPIs — based on approved entries only
        approved_only = [e for e in all_entries if e["approvalStatus"] == "Approved"]
        total_regular_hrs = round(sum(e.get("regularMins", 0) for e in approved_only) / 60.0, 2)
        total_overtime_hrs = round(sum(e.get("overtimeMins", 0) for e in approved_only) / 60.0, 2)
        employees_with_ot = len(set(
            e["empId"] for e in approved_only if e.get("overtimeMins", 0) > 0
        ))

        return {
            "totalEmployees": total_emp,
            "activeEmployees": active_emp,
            "departmentsCount": dept_count,
            "machinesCount": machine_count,
            "activeMachinesCount": active_machines,
            "totalTimeEntries": total_entries,
            "pendingApprovals": pending_entries,
            "approvedEntries": approved_entries,
            "rejectedEntries": rejected_entries,
            "totalRegularHours": total_regular_hrs,
            "totalOvertimeHours": total_overtime_hrs,
            "employeesWithOvertime": employees_with_ot
        }

    def get_analytics_charts(
        self,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        dept: Optional[str] = None,
        emp_id: Optional[str] = None
    ) -> dict:
        """
        Analytics charts use ONLY Approved Regular Hours.
        Overtime is tracked SEPARATELY and displayed in the "Overtime Summary" section.
        Overtime must NEVER be included in productivity charts, trend charts, or performance rankings.
        """
        approved_entries = self.time_repo.get_all(
            approval_status="Approved",
            date_from=date_from,
            date_to=date_to,
            dept=dept,
            emp_id=emp_id
        )

        # Productivity data structures — REGULAR HOURS ONLY
        dept_regular: Dict[str, float] = {}
        shift_regular: Dict[str, float] = {}
        emp_regular: Dict[str, dict] = {}
        daily_regular: Dict[str, float] = {}
        task_regular: Dict[str, float] = {}
        sub_task_regular: Dict[str, float] = {}

        # Overtime tracking — kept SEPARATE from productivity
        dept_overtime: Dict[str, float] = {}
        emp_overtime: Dict[str, dict] = {}

        for entry in approved_entries:
            reg_hrs = round(entry.get("regularMins", 0) / 60.0, 4)
            ot_hrs = round(entry.get("overtimeMins", 0) / 60.0, 4)
            dept_name = entry.get("dept") or "Unassigned"
            shift_name = entry.get("shift") or "A"
            emp_name = entry.get("empName") or "Unknown"
            emp_id_val = entry.get("empId") or ""
            date_str = entry.get("date") or ""
            cat = entry.get("category") or "General"
            sub_cat = entry.get("subCategory") or "General"
            if entry.get("subCategoryId"):
                sc = self.sc_repo.get_by_id(entry["subCategoryId"])
                if sc:
                    sub_cat = sc["name"]

            # Department — regular only for productivity chart
            if dept_name not in dept_regular:
                dept_regular[dept_name] = 0.0
                dept_overtime[dept_name] = 0.0
            dept_regular[dept_name] += reg_hrs
            dept_overtime[dept_name] += ot_hrs

            # Shift — regular only
            if shift_name not in shift_regular:
                shift_regular[shift_name] = 0.0
            shift_regular[shift_name] += reg_hrs

            # Employee — regular only for main productivity; OT tracked separately
            if emp_id_val not in emp_regular:
                emp_regular[emp_id_val] = {
                    "empId": emp_id_val,
                    "name": emp_name,
                    "regular": 0.0,
                    "dept": dept_name,
                    "shift": shift_name
                }
                emp_overtime[emp_id_val] = {"empId": emp_id_val, "name": emp_name, "overtime": 0.0, "dept": dept_name}
            emp_regular[emp_id_val]["regular"] += reg_hrs
            emp_overtime[emp_id_val]["overtime"] += ot_hrs

            # Daily trends — regular only
            if date_str:
                if date_str not in daily_regular:
                    daily_regular[date_str] = 0.0
                daily_regular[date_str] += reg_hrs

            # Task category distribution — regular only
            if cat not in task_regular:
                task_regular[cat] = 0.0
            task_regular[cat] += reg_hrs

            if sub_cat not in sub_task_regular:
                sub_task_regular[sub_cat] = 0.0
            sub_task_regular[sub_cat] += reg_hrs

        # Round all accumulated values
        for k in dept_regular:
            dept_regular[k] = round(dept_regular[k], 2)
            dept_overtime[k] = round(dept_overtime[k], 2)
        for k in shift_regular:
            shift_regular[k] = round(shift_regular[k], 2)
        for k in emp_regular:
            emp_regular[k]["regular"] = round(emp_regular[k]["regular"], 2)
        for k in emp_overtime:
            emp_overtime[k]["overtime"] = round(emp_overtime[k]["overtime"], 2)
        for k in daily_regular:
            daily_regular[k] = round(daily_regular[k], 2)
        for k in task_regular:
            task_regular[k] = round(task_regular[k], 2)
        for k in sub_task_regular:
            sub_task_regular[k] = round(sub_task_regular[k], 2)

        # Top 10 employees by REGULAR hours (productivity ranking — no OT inflation)
        top_employees = sorted(
            emp_regular.values(),
            key=lambda x: x["regular"],
            reverse=True
        )[:10]

        # Top overtime contributors (separate list — not mixed with productivity)
        employees_with_ot = sorted(
            [v for v in emp_overtime.values() if v["overtime"] > 0],
            key=lambda x: x["overtime"],
            reverse=True
        )[:10]

        total_ot_hrs = round(sum(v["overtime"] for v in emp_overtime.values()), 2)
        total_regular_hrs = round(sum(v for v in dept_regular.values()), 2)

        # Chronological daily trends
        daily_trends = sorted(
            [{"date": k, "regular": v} for k, v in daily_regular.items()],
            key=lambda x: x["date"]
        )

        # Machine utilization stats
        machines = self.machine_repo.get_all()
        total_machines = len(machines)
        active_machines_count = len([m for m in machines if m.get("active")])
        machine_stats = {
            "total": total_machines,
            "active": active_machines_count,
            "activePercent": round(
                (active_machines_count / total_machines * 100) if total_machines > 0 else 0, 2
            )
        }

        return {
            # ── Productivity charts — APPROVED REGULAR HOURS ONLY ─────────────
            "deptProductivity": [
                {"dept": k, "regular": v} for k, v in dept_regular.items()
            ],
            "shiftProductivity": [
                {"shift": k, "regular": v} for k, v in shift_regular.items()
            ],
            "employeeProductivity": top_employees,
            "dailyTrends": daily_trends,
            "taskDistribution": [
                {"category": k, "hours": v} for k, v in task_regular.items()
            ],
            "subTaskDistribution": [
                {"category": k, "hours": v} for k, v in sub_task_regular.items()
            ],
            "machineUtilization": machine_stats,
            "totalRegularHours": total_regular_hrs,

            # ── Overtime Summary — SEPARATE, never mixed into productivity ─────
            "overtimeSummary": {
                "totalOvertimeHours": total_ot_hrs,
                "employeesWithOvertime": len(employees_with_ot),
            },
            "deptOvertimeList": [
                {"dept": k, "overtime": round(v, 2)}
                for k, v in dept_overtime.items() if v > 0
            ],
            "employeeOvertimeList": employees_with_ot,
        }
