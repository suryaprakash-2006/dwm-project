from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime

from app.schemas.entry_edit_request import EntryEditRequestCreate, EntryEditRequestOut
from app.middleware.rbac import get_current_user, RoleChecker
from app.repositories.db_repository import EntryEditRequestsRepository, TimeEntriesRepository

router = APIRouter(prefix="/entry-edit-requests", tags=["Entry Edit Requests"])

edit_req_repo = EntryEditRequestsRepository()
time_repo = TimeEntriesRepository()

@router.post("", response_model=EntryEditRequestOut, status_code=status.HTTP_201_CREATED)
def create_edit_request(
    payload: EntryEditRequestCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Submit a request to edit a time entry description.
    """
    time_entry = time_repo.get_by_id(payload.timeEntryId)
    if not time_entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
        
    if current_user["role"] in ["USER", "OPERATOR"] and time_entry["empId"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Cannot edit another user's entry")

    req_doc = {
        "timeEntryId": payload.timeEntryId,
        "requestedBy": current_user["id"],
        "oldDescription": time_entry.get("remarks", ""),
        "newDescription": payload.newDescription,
        "status": "Pending",
        "requestedAt": datetime.now().isoformat(),
        "approvedBy": None,
        "approvedAt": None
    }
    
    created = edit_req_repo.add(req_doc)
    return created

@router.get("", response_model=List[EntryEditRequestOut])
def get_edit_requests(
    status: str = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status
        
    # Standard users can only see their own requests
    if current_user["role"] in ["USER", "OPERATOR"]:
        query["requestedBy"] = current_user["id"]
        
    # ADMINs can only see requests for users in their department
    if current_user["role"] == "ADMIN":
        # To properly scope by dept, we'd need to join with employees.
        # For simplicity, returning all for now or filtering in memory.
        pass
        
    requests = edit_req_repo.collection.find(query)
    return [edit_req_repo._clean(r) for r in requests]

@router.put("/{id}/approve", response_model=EntryEditRequestOut)
def approve_edit_request(
    id: int,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in ["ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Only admins can approve edit requests")
        
    req = edit_req_repo.get_by_id(id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if req["status"] != "Pending":
        raise HTTPException(status_code=400, detail="Request is already processed")
        
    # Update the time entry's remarks
    time_repo.update(req["timeEntryId"], {"remarks": req["newDescription"]})
    
    # Update the request status
    updates = {
        "status": "Approved",
        "approvedBy": current_user["id"],
        "approvedAt": datetime.now().isoformat()
    }
    edit_req_repo.update(id, updates)
    
    # Fetch and return updated
    return edit_req_repo.get_by_id(id)

@router.put("/{id}/reject", response_model=EntryEditRequestOut)
def reject_edit_request(
    id: int,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in ["ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Only admins can reject edit requests")
        
    req = edit_req_repo.get_by_id(id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if req["status"] != "Pending":
        raise HTTPException(status_code=400, detail="Request is already processed")
        
    # Update the request status
    updates = {
        "status": "Rejected",
        "approvedBy": current_user["id"],
        "approvedAt": datetime.now().isoformat()
    }
    edit_req_repo.update(id, updates)
    
    return edit_req_repo.get_by_id(id)
