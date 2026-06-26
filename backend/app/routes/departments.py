from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentOut
from app.repositories.db_repository import DepartmentsRepository, EmployeesRepository
from app.middleware.rbac import get_current_user, RoleChecker

router = APIRouter(prefix="/departments", tags=["Departments"])
dept_repo = DepartmentsRepository()
emp_repo  = EmployeesRepository()

@router.get("", response_model=List[DepartmentOut])
def get_departments(current_user: dict = Depends(get_current_user)):
    """Returns a list of all departments with live member counts."""
    depts = dept_repo.get_all()
    # Compute live headCount: count ALL employees (active or not) per department name
    all_emps = emp_repo.get_all()
    dept_counts = {}
    for e in all_emps:
        dept_name = e.get("dept", "")
        if dept_name:
            dept_counts[dept_name] = dept_counts.get(dept_name, 0) + 1
    for d in depts:
        d["headCount"] = dept_counts.get(d.get("name", ""), 0)
    return depts


@router.get("/{id}", response_model=DepartmentOut)
def get_department_by_id(id: int, current_user: dict = Depends(get_current_user)):
    """
    GET /departments/{id}
    Critical gap resolved. Returns details for specific department.
    """
    dept = dept_repo.get_by_id(id)
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Department with ID {id} not found"
        )
    return dept

@router.post("", response_model=DepartmentOut, status_code=status.HTTP_201_CREATED)
def create_department(
    payload: DepartmentCreate,
    current_user: dict = Depends(RoleChecker(["SUPER_ADMIN"]))
):
    """Creates a new department."""
    # Check duplicate
    if dept_repo.get_by_name(payload.name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department with this name already exists"
        )
    dept = dept_repo.add(payload.dict())
    return dept

@router.put("/{id}", response_model=DepartmentOut)
def update_department(
    id: int,
    payload: DepartmentUpdate,
    current_user: dict = Depends(RoleChecker(["SUPER_ADMIN"]))
):
    """Updates department details."""
    dept = dept_repo.get_by_id(id)
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Department with ID {id} not found"
        )
    updated = dept_repo.update(id, payload.dict(exclude_unset=True))
    return updated

@router.delete("/{id}")
def delete_department(
    id: int,
    current_user: dict = Depends(RoleChecker(["SUPER_ADMIN"]))
):
    """Deletes department."""
    success = dept_repo.delete(id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Department with ID {id} not found"
        )
    return {"message": "Department deleted successfully"}
