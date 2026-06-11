from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.schemas.sub_category import SubCategoryCreate, SubCategoryUpdate, SubCategoryOut
from app.repositories.db_repository import SubCategoriesRepository, WorkCategoriesRepository
from app.middleware.rbac import get_current_user, RoleChecker

# We register as /sub-categories and support /subcategories mapping in main
router = APIRouter(tags=["Sub Categories"])
sc_repo = SubCategoriesRepository()
wc_repo = WorkCategoriesRepository()

@router.get("/sub-categories", response_model=List[SubCategoryOut])
@router.get("/subcategories", response_model=List[SubCategoryOut])
def get_sub_categories(
    workCategoryId: Optional[int] = Query(None, description="Filter by parent Work Category ID"),
    department: Optional[str] = Query(None, description="Filter by department"),
    active: Optional[bool] = Query(None, description="Filter by active status"),
    current_user: dict = Depends(get_current_user)
):
    """
    Returns sub-categories with optional filters.
    Supports cascading dropdown: ?workCategoryId=2 to load relevant sub-categories.
    ADMIN/USER/OPERATOR-scoped department filtering applied automatically.
    """
    # Department isolation rules
    if current_user["role"] in ["ADMIN", "USER", "OPERATOR"]:
        department = current_user.get("dept")

    return sc_repo.get_all(
        work_category_id=workCategoryId,
        department=department,
        active=active
    )

@router.post("/sub-categories", response_model=SubCategoryOut, status_code=status.HTTP_201_CREATED)
@router.post("/subcategories", response_model=SubCategoryOut, status_code=status.HTTP_201_CREATED)
def create_sub_category(
    payload: SubCategoryCreate,
    current_user: dict = Depends(RoleChecker(["ADMIN", "SUPER_ADMIN"]))
):
    """Creates a new sub-category. ADMIN assigns it to their own department."""
    data = payload.dict()
    
    # Department assignment
    if current_user["role"] == "ADMIN":
        data["department"] = current_user.get("dept")
    elif not data.get("department"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department is required for this sub-category."
        )
    
    # Validate workCategoryId is provided
    if not data.get("workCategoryId"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parent Work Category is required."
        )
        
    # Check if parent Work Category exists
    wc = wc_repo.get_by_id(data["workCategoryId"])
    if not wc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Work Category with ID {data['workCategoryId']} does not exist."
        )
        
    # Prevent creation of a subcategory whose name matches an existing work category (case-insensitive)
    name = data["name"].strip()
    all_wcs = wc_repo.get_all()
    if any(w["name"].strip().lower() == name.lower() for w in all_wcs):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sub-category name cannot be identical to an existing Work Category name."
        )
        
    # Prevent creation of duplicate subcategories under the same department + work category
    existing_scs = sc_repo.get_all(
        work_category_id=data["workCategoryId"],
        department=data["department"]
    )
    if any(esc["name"].strip().lower() == name.lower() for esc in existing_scs):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Sub-category '{name}' already exists under the selected Work Category for this department."
        )
        
    sc = sc_repo.add(data)
    return sc

@router.put("/sub-categories/{id}", response_model=SubCategoryOut)
@router.put("/subcategories/{id}", response_model=SubCategoryOut)
def update_sub_category(
    id: int,
    payload: SubCategoryUpdate,
    current_user: dict = Depends(RoleChecker(["ADMIN", "SUPER_ADMIN"]))
):
    """Updates sub-category details."""
    sc = sc_repo.get_by_id(id)
    if not sc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sub-category with ID {id} not found"
        )
        
    # Merge existing data with updates to perform validation
    data = sc.copy()
    updates = payload.dict(exclude_unset=True)
    data.update(updates)
    
    # Enforce department isolation for ADMIN
    if current_user["role"] == "ADMIN":
        user_dept = current_user.get("dept")
        if sc.get("department") != user_dept or data.get("department") != user_dept:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="ADMIN is only allowed to update sub-categories in their own department."
            )
            
    # Validate workCategoryId if changed
    if "workCategoryId" in updates:
        if not data.get("workCategoryId"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent Work Category cannot be null."
            )
        wc = wc_repo.get_by_id(data["workCategoryId"])
        if not wc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Work Category with ID {data['workCategoryId']} does not exist."
            )
            
    # Name cross-matching & duplicate checks
    if "name" in updates or "workCategoryId" in updates or "department" in updates:
        name = data["name"].strip()
        
        # Prevent matching existing work category names
        all_wcs = wc_repo.get_all()
        if any(w["name"].strip().lower() == name.lower() for w in all_wcs):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sub-category name cannot be identical to an existing Work Category name."
            )
            
        # Prevent duplicates
        existing_scs = sc_repo.get_all(
            work_category_id=data["workCategoryId"],
            department=data["department"]
        )
        if any(esc["id"] != id and esc["name"].strip().lower() == name.lower() for esc in existing_scs):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Sub-category '{name}' already exists under the selected Work Category for this department."
            )
            
    updated = sc_repo.update(id, updates)
    return updated

@router.delete("/sub-categories/{id}")
@router.delete("/subcategories/{id}")
def delete_sub_category(
    id: int,
    current_user: dict = Depends(RoleChecker(["ADMIN", "SUPER_ADMIN"]))
):
    """
    DELETE /sub-categories/{id}
    Deletes a specific sub-category.
    """
    success = sc_repo.delete(id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sub-category with ID {id} not found"
        )
    return {"message": "Sub-category deleted successfully"}
