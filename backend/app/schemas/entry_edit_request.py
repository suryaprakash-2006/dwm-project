from pydantic import BaseModel
from typing import Optional

class EntryEditRequestCreate(BaseModel):
    timeEntryId: int
    newDescription: str
    newData: Optional[dict] = None

class EntryEditRequestOut(BaseModel):
    id: int
    timeEntryId: int
    requestedBy: str
    oldDescription: str
    newDescription: str
    status: str  # Pending, Approved, Rejected
    requestedAt: str
    approvedBy: Optional[str] = None
    approvedAt: Optional[str] = None
    newData: Optional[dict] = None
