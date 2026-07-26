from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from app.schemas.time_entry import (
    TimeEntryCreate,
    TimeEntryUpdate,
    TimeEntryOut,
    TimeEntryApprovalPayload
)
from app.repositories.db_repository import (
    TimeEntriesRepository, 
    EmployeesRepository,
    WorkCategoriesRepository,
    SubCategoriesRepository
)
from app.services.business_logic import BusinessLogicService
from app.middleware.rbac import get_current_user, RoleChecker
from app.core.config import settings
from datetime import datetime as _dt

router = APIRouter(prefix="/time-entries", tags=["Time Entries"])
time_repo = TimeEntriesRepository()
emp_repo = EmployeesRepository()
wc_repo = WorkCategoriesRepository()
sc_repo = SubCategoriesRepository()
service = BusinessLogicService()

# Config-driven limits — never hardcode
DAILY_REGULAR_LIMIT_MINS = settings.MAX_REGULAR_HOURS_PER_DAY * 60
DAILY_OT_LIMIT_MINS = settings.MAX_OVERTIME_HOURS_PER_DAY * 60


def _today_str() -> str:
    return _dt.now().strftime("%Y-%m-%d")


def _validate_no_future_date(date_str: str, field_name: str = "date") -> None:
    """Raises 422 if the given date string is in the future."""
    if date_str and date_str > _today_str():
        raise HTTPException(
            status_code=422,
            detail=f"{field_name} cannot be in the future. Future dates are not allowed."
        )


@router.get("", response_model=List[TimeEntryOut])
def get_time_entries(
    empId: Optional[str] = Query(None),
    empNo: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    approvalStatus: Optional[str] = Query(None),
    dept: Optional[str] = Query(None),
    month: Optional[str] = Query(None),
    shift: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Returns time entries with filters.
    Future date filters are rejected.
    """
    today_str = _today_str()

    # Reject future date filters
    if date and date > today_str:
        raise HTTPException(status_code=422, detail="date cannot be in the future")
    if date_from and date_from > today_str:
        raise HTTPException(status_code=422, detail="date_from cannot be in the future")
    if date_to and date_to > today_str:
        raise HTTPException(status_code=422, detail="date_to cannot be in the future")
    if date_from and date_to and date_from > date_to:
        raise HTTPException(status_code=422, detail="date_from must be less than or equal to date_to")

    # Enforce role logic: USER or OPERATOR can only access their own entries
    if current_user["role"] in ["USER", "OPERATOR"]:
        empId = current_user["id"]
        # Do not enforce empNo filter; empId is sufficient and stable, whereas empNo may have changed in DB
        empNo = None

    # ADMIN is automatically scoped to their own department
    if current_user["role"] == "ADMIN" and not dept:
        dept = current_user.get("dept")

    results = time_repo.get_all(
        emp_id=empId,
        emp_no=empNo,
        date=date,
        date_from=date_from,
        date_to=date_to,
        approval_status=approvalStatus,
        dept=dept,
        month=month,
        shift=shift
    )

    for entry in results:
        if entry.get("workCategoryId"):
            wc = wc_repo.get_by_id(entry["workCategoryId"])
            if wc:
                entry["category"] = wc["name"]
        if entry.get("subCategoryId"):
            sc = sc_repo.get_by_id(entry["subCategoryId"])
            if sc:
                entry["subCategory"] = sc["name"]

    return results


@router.post("", response_model=TimeEntryOut, status_code=status.HTTP_201_CREATED)
def create_time_entry(
    payload: TimeEntryCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Submits a daily time entry log.
    - Future dates are blocked.
    - If date is >3 days in the past, marks as 'Pending' approval and alerts ADMINS.
    - Regular hours capped at MAX_REGULAR_HOURS_PER_DAY (8h). Excess is NOT silently converted.
    - Overtime hours capped at MAX_OVERTIME_HOURS_PER_DAY (8h). Excess is rejected.
    - Total (regular + overtime) cannot exceed MAX_TOTAL_HOURS_PER_DAY (16h).
    - User must explicitly enter overtime hours. No silent manipulation of entered values.
    - Pending + Approved entries count towards the daily limit. Rejected entries excluded.
    """
    _validate_no_future_date(payload.date, "date")

    emp = emp_repo.get_by_emp_no(current_user["empNo"])
    if not emp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee profile not found"
        )

    entry_dict = payload.dict()
    entry_dict.update({
        "empId": emp["id"],
        "empName": emp["name"],
        "empNo": emp["empNo"],
        "dept": emp["dept"],
        "designation": emp["designation"]
    })

    # Delegate ALL validation to business logic — no silent overrides here
    entry = service.submit_time_entry(entry_dict)
    return entry


@router.put("/{id}", response_model=TimeEntryOut)
def update_time_entry(
    id: int,
    payload: TimeEntryUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Updates time entry log details."""
    entry = time_repo.get_by_id(id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Time entry with ID {id} not found"
        )

    if current_user["role"] in ["USER", "OPERATOR"] and entry["empId"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to modify this entry"
        )

    updated = service.update_time_entry(id, payload.dict(exclude_unset=True))
    return updated


@router.put("/{id}/approve", response_model=TimeEntryOut)
def approve_time_entry(
    id: int,
    payload: TimeEntryApprovalPayload = Body(default=TimeEntryApprovalPayload()),
    current_user: dict = Depends(RoleChecker(["ADMIN", "SUPER_ADMIN"]))
):
    """Approves a late time entry request."""
    entry = time_repo.get_by_id(id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Time entry with ID {id} not found"
        )

    updated = time_repo.set_approval(id, "Approved", payload.comment)

    emp_profile = emp_repo.get_by_id(entry["empId"])
    emp_email = emp_profile["email"] if emp_profile else ""

    service.notif_repo.add({
        "to": "user",
        "toEmail": emp_email,
        "from": current_user.get("name", "Admin"),
        "type": "success",
        "subject": "Time Entry Approved",
        "body": f"Your time entry for {entry['date']} has been approved by {current_user.get('name', 'Admin')}."
    })

    return updated


@router.put("/{id}/reject", response_model=TimeEntryOut)
def reject_time_entry(
    id: int,
    payload: TimeEntryApprovalPayload = Body(default=TimeEntryApprovalPayload()),
    current_user: dict = Depends(RoleChecker(["ADMIN", "SUPER_ADMIN"]))
):
    """Rejects a late time entry request."""
    entry = time_repo.get_by_id(id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Time entry with ID {id} not found"
        )

    updated = time_repo.set_approval(id, "Rejected", payload.comment)

    emp_profile = emp_repo.get_by_id(entry["empId"])
    emp_email = emp_profile["email"] if emp_profile else ""

    service.notif_repo.add({
        "to": "user",
        "toEmail": emp_email,
        "from": current_user.get("name", "Admin"),
        "type": "error",
        "subject": "Time Entry Rejected",
        "body": f"Your time entry for {entry['date']} was rejected. Comment: {payload.comment}"
    })

    return updated


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_draft_time_entry(
    id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Deletes a Draft time entry.
    - Only the owning USER or OPERATOR may delete their own draft.
    - Only entries with approvalStatus == 'Draft' may be deleted via this endpoint.
    - ADMIN and SUPER_ADMIN may also delete any draft (for admin cleanup).
    """
    entry = time_repo.get_by_id(id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Time entry with ID {id} not found"
        )

    if entry.get("approvalStatus") != "Draft":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Draft entries can be deleted via this endpoint."
        )

    if current_user["role"] in ["USER", "OPERATOR"] and entry["empId"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this entry."
        )

    time_repo.collection.delete_one({"id": id})
    return


@router.get("/daily-limit-check")
def check_daily_limit(
    empId: str = Query(...),
    date: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Returns remaining regular and overtime minute capacity for an employee on a given date.
    Used by frontend for overtime warning display before submission.
    Returns separate remainingRegularMins and remainingOvertimeMins.
    """
    _validate_no_future_date(date, "date")
    daily = service.get_daily_used_mins(empId, date)

    used_regular = daily["totalActiveRegularMins"]
    used_overtime = daily["totalActiveOvertimeMins"]
    remaining_regular = max(0, DAILY_REGULAR_LIMIT_MINS - used_regular)
    remaining_overtime = max(0, DAILY_OT_LIMIT_MINS - used_overtime)

    return {
        "date": date,
        "empId": empId,
        "approvedRegularMins": daily["approvedRegularMins"],
        "pendingRegularMins": daily["pendingRegularMins"],
        "approvedOvertimeMins": daily["approvedOvertimeMins"],
        "pendingOvertimeMins": daily["pendingOvertimeMins"],
        "usedRegularMins": used_regular,
        "usedOvertimeMins": used_overtime,
        "remainingRegularMins": remaining_regular,
        "remainingOvertimeMins": remaining_overtime,
        "dailyRegularLimitMins": DAILY_REGULAR_LIMIT_MINS,
        "dailyOvertimeLimitMins": DAILY_OT_LIMIT_MINS,
        "maxTotalMins": settings.MAX_TOTAL_HOURS_PER_DAY * 60,
        "regularWarning": used_regular >= DAILY_REGULAR_LIMIT_MINS,
        "overtimeWarning": used_overtime >= DAILY_OT_LIMIT_MINS,
    }