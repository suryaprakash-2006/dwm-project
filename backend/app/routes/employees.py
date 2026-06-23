from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeOut
from app.repositories.db_repository import EmployeesRepository
from app.services.business_logic import BusinessLogicService
from app.middleware.rbac import get_current_user, RoleChecker, enforce_role_hierarchy, guard_last_super_admin
from app.utils.security import get_password_hash
from app.core.config import settings

router = APIRouter(prefix="/employees", tags=["Employees"])
emp_repo = EmployeesRepository()
service = BusinessLogicService()


@router.get("", response_model=List[EmployeeOut])
def get_employees(
    role: Optional[str] = Query(None),
    dept: Optional[str] = Query(None),
    active: Optional[bool] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Returns a list of employee profiles, optionally filtered."""
    employees = emp_repo.get_all(role=role, dept=dept, active=active)

    # Server-side visibility enforcement
    if current_user.get("role") == "ADMIN":
        current_dept = current_user.get("dept")
        employees = [
            e for e in employees
            if e.get("role") != "SUPER_ADMIN" and e.get("dept") == current_dept
        ]

    return employees


@router.get("/{emp_no}", response_model=EmployeeOut)
def get_employee_by_emp_no(emp_no: str, current_user: dict = Depends(get_current_user)):
    """
    GET /employees/{emp_no}
    Fetches employee by their employee number.
    """
    emp = emp_repo.get_by_emp_no(emp_no)
    if not emp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with number {emp_no} not found"
        )

    # Visibility enforcement for direct lookups
    if current_user.get("role") == "ADMIN":
        if emp.get("role") == "SUPER_ADMIN" or emp.get("dept") != current_user.get("dept"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Employee with number {emp_no} not found"
            )

    return emp


@router.post("", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreate,
    current_user: dict = Depends(RoleChecker(["SUPER_ADMIN"]))
):
    """
    Registers a new employee and sets up default login credentials.
    SUPER_ADMIN only — ADMIN cannot create employees.
    Shift is NOT part of employee master data and is excluded.
    """
    if emp_repo.get_by_emp_no(payload.empNo):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee with this employee number already exists"
        )

    emp_data = payload.dict()
    emp_data.pop("shift", None)  # Shift is operational data, not master data

    hashed_pwd = get_password_hash(settings.DEFAULT_USER_PASSWORD)
    emp = service.register_employee(emp_data, hashed_pwd)
    return emp


@router.put("/{id}", response_model=EmployeeOut)
def update_employee(
    id: str,
    payload: EmployeeUpdate,
    current_user: dict = Depends(RoleChecker(["ADMIN", "SUPER_ADMIN"]))
):
    """
    Updates an employee profile.
    ADMIN cannot update SUPER_ADMIN accounts.
    ADMIN cannot demote the last SUPER_ADMIN.
    """
    emp = emp_repo.get_by_id(id)
    if not emp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee profile with ID {id} not found"
        )

    # RBAC: ADMIN cannot edit SUPER_ADMIN
    enforce_role_hierarchy(current_user, emp)

    update_data = payload.dict(exclude_unset=True)

    # Prevent role escalation to SUPER_ADMIN by ADMIN
    if current_user.get("role") == "ADMIN" and update_data.get("role") == "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="403 Forbidden: ADMIN cannot assign SUPER_ADMIN role."
        )

    # Protect last SUPER_ADMIN from being demoted
    new_role = update_data.get("role")
    if new_role and new_role != "SUPER_ADMIN" and emp.get("role") == "SUPER_ADMIN":
        guard_last_super_admin(id, action="demote")

    # Synchronize credentials if email or empNo changed
    old_emp_no = emp.get("empNo")
    new_email = update_data.get("email", emp.get("email"))
    new_emp_no = update_data.get("empNo", emp.get("empNo"))
    
    updated = emp_repo.update(id, update_data)
    
    if updated and (new_email != emp.get("email") or new_emp_no != emp.get("empNo")):
        from app.repositories.db_repository import CredentialsRepository
        cred_repo = CredentialsRepository()
        cred_repo.update_credentials_fields(old_emp_no, new_email, new_emp_no)
        
    return updated


@router.patch("/{id}/toggle", response_model=EmployeeOut)
def toggle_employee(
    id: str,
    current_user: dict = Depends(RoleChecker(["ADMIN", "SUPER_ADMIN"]))
):
    """
    Toggles employee active/inactive status.
    ADMIN cannot toggle SUPER_ADMIN accounts.
    Cannot disable the last active SUPER_ADMIN.
    """
    emp = emp_repo.get_by_id(id)
    if not emp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee profile with ID {id} not found"
        )

    # ADMIN cannot activate/deactivate own account
    if current_user.get("role") == "ADMIN" and current_user.get("id") == emp.get("id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="403 Forbidden: ADMIN cannot activate/deactivate own account."
        )

    # RBAC: ADMIN cannot disable SUPER_ADMIN
    enforce_role_hierarchy(current_user, emp)

    # Protect last active SUPER_ADMIN from being disabled
    guard_last_super_admin(id, action="disable")

    updated = emp_repo.toggle_active(id)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee profile with ID {id} not found"
        )
    return updated


@router.delete("/{id}")
def delete_employee(
    id: str,
    current_user: dict = Depends(RoleChecker(["ADMIN", "SUPER_ADMIN"]))
):
    """
    Deletes employee profile, credentials, and decrements headcount.
    ADMIN cannot delete SUPER_ADMIN.
    Cannot delete the last SUPER_ADMIN.
    """
    emp = emp_repo.get_by_id(id)
    if not emp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee profile with ID {id} not found"
        )

    # RBAC: ADMIN cannot delete SUPER_ADMIN
    enforce_role_hierarchy(current_user, emp)

    # Protect the last SUPER_ADMIN from deletion
    guard_last_super_admin(id, action="delete")

    success = service.terminate_employee(id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee profile with ID {id} not found"
        )
    return {"message": "Employee deleted successfully"}
