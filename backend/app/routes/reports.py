from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from app.services.business_logic import BusinessLogicService
from app.middleware.rbac import get_current_user, RoleChecker
from datetime import datetime as _dt

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])
service = BusinessLogicService()


def _today_str() -> str:
    return _dt.now().strftime("%Y-%m-%d")


def _validate_no_future_date(date_str: Optional[str], field_name: str) -> None:
    if date_str and date_str > _today_str():
        raise HTTPException(
            status_code=422,
            detail=f"{field_name} cannot be in the future."
        )


@router.get("/monthly")
def get_monthly_report(
    month: str = Query(..., description="Target month in YYYY-MM format"),
    shift: str = Query(..., description="Target shift: A, B, or C"),
    current_user: dict = Depends(get_current_user)
):
    """
    GET /reports/monthly?month=YYYY-MM&shift=X
    Uses APPROVED entries only.
    Returns regularHours, overtimeHours, totalHours separately per employee.
    """
    report_data = service.get_monthly_shift_report(month=month, shift=shift)

    if current_user["role"] in ["USER", "OPERATOR"]:
        report_data = [r for r in report_data if r["empId"] == current_user["id"]]

    return report_data


@router.get("/attendance")
def get_attendance_report(
    month: Optional[str] = Query(None, description="Target month in YYYY-MM format"),
    dept: Optional[str] = Query(None, description="Filter by department"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    GET /reports/attendance
    Aggregates attendance counts — APPROVED entries only.
    """
    _validate_no_future_date(date_from, "date_from")
    _validate_no_future_date(date_to, "date_to")

    if current_user["role"] == "ADMIN" and not dept:
        dept = current_user["dept"]

    return service.get_attendance_report(month=month, dept=dept)


@router.get("/productivity")
def get_productivity_report(
    month: Optional[str] = Query(None, description="Target month in YYYY-MM format"),
    dept: Optional[str] = Query(None, description="Filter by department"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    GET /reports/productivity
    Uses APPROVED entries only.
    Productivity KPIs use ONLY approved regular hours — overtime is excluded.
    """
    _validate_no_future_date(date_from, "date_from")
    _validate_no_future_date(date_to, "date_to")

    if current_user["role"] == "ADMIN" and not dept:
        dept = current_user["dept"]

    return service.get_productivity_report(month=month, dept=dept)


@router.get("/work-summary")
def get_work_summary_report(
    month: Optional[str] = Query(None, description="Target month in YYYY-MM format"),
    dept: Optional[str] = Query(None, description="Filter by department"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    emp_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    GET /reports/work-summary
    Aggregates APPROVED work log summaries.
    Returns: Employee | Department | Date | Regular Hours | Overtime Hours | Total Hours | Approval Status
    Pending and Rejected entries are excluded.
    """
    _validate_no_future_date(date_from, "date_from")
    _validate_no_future_date(date_to, "date_to")

    if current_user["role"] in ["USER", "OPERATOR"]:
        # Employees can only see their own entries
        emp_id = current_user["id"]

    if current_user["role"] == "ADMIN" and not dept:
        dept = current_user["dept"]

    return service.get_work_summary_report(
        month=month,
        dept=dept,
        date_from=date_from,
        date_to=date_to,
        emp_id=emp_id
    )


@router.get("/dashboard-kpis")
def get_dashboard_kpis(current_user: dict = Depends(get_current_user)):
    """
    GET /reports/dashboard-kpis
    Returns real KPIs. Regular/Overtime split from Approved entries only.
    """
    if current_user["role"] in ["USER", "OPERATOR"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    return service.get_dashboard_kpis()


@router.get("/analytics-charts")
def get_analytics_charts(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    dept: Optional[str] = Query(None),
    emp_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    GET /reports/analytics-charts
    Returns aggregated statistics using APPROVED regular hours only.
    Overtime is displayed in a dedicated overtimeSummary section — never mixed into chart data.
    Productivity graphs: regular hours only.
    Overtime Summary: total OT hours, employees with OT, dept OT breakdown, top OT contributors.
    """
    _validate_no_future_date(date_from, "date_from")
    _validate_no_future_date(date_to, "date_to")

    if current_user["role"] in ["USER", "OPERATOR"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )

    if current_user["role"] == "ADMIN" and not dept:
        dept = current_user["dept"]

    return service.get_analytics_charts(date_from=date_from, date_to=date_to, dept=dept, emp_id=emp_id)
