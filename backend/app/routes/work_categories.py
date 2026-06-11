from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.schemas.work_category import WorkCategoryCreate, WorkCategoryUpdate, WorkCategoryOut
from app.repositories.db_repository import WorkCategoriesRepository
from app.middleware.rbac import get_current_user, RoleChecker

router = APIRouter(prefix="/work-categories", tags=["Work Categories"])
wc_repo = WorkCategoriesRepository()


@router.get("", response_model=List[WorkCategoryOut])
def get_work_categories(
    active: Optional[bool] = Query(None, description="Filter by active status"),
    current_user: dict = Depends(get_current_user)
):
    """
    Returns all work categories.
    Authenticated users may query. Optional ?active=true filter.
    """
    return wc_repo.get_all(active=active)


@router.post("", response_model=WorkCategoryOut, status_code=status.HTTP_201_CREATED)
def create_work_category(
    payload: WorkCategoryCreate,
    current_user: dict = Depends(RoleChecker(["SUPER_ADMIN"]))
):
    """
    Creates a new work category.
    SUPER_ADMIN only — work categories are global across the organization.
    """
    existing = wc_repo.get_by_name(payload.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Work category '{payload.name}' already exists."
        )
    return wc_repo.add(payload.dict())


@router.put("/{id}", response_model=WorkCategoryOut)
def update_work_category(
    id: int,
    payload: WorkCategoryUpdate,
    current_user: dict = Depends(RoleChecker(["SUPER_ADMIN"]))
):
    """
    Updates a work category.
    SUPER_ADMIN only.
    """
    wc = wc_repo.get_by_id(id)
    if not wc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Work category with ID {id} not found."
        )
    updated = wc_repo.update(id, payload.dict(exclude_unset=True))
    return updated


@router.delete("/{id}")
def delete_work_category(
    id: int,
    current_user: dict = Depends(RoleChecker(["SUPER_ADMIN"]))
):
    """
    Deletes a work category.
    SUPER_ADMIN only. Use with caution — sub-categories referencing this ID will be orphaned.
    """
    wc = wc_repo.get_by_id(id)
    if not wc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Work category with ID {id} not found."
        )
    success = wc_repo.delete(id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete work category."
        )
    return {"message": "Work category deleted successfully."}
