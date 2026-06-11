from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime


class TimeEntryBase(BaseModel):
    shift: str = Field("A", description="A, B, or C")
    date: str = Field(..., description="YYYY-MM-DD format")
    category: str = Field("General", description="Work category name — kept for backward compatibility")
    subCategory: str = Field(..., description="Sub-task category name — kept for backward compatibility")
    workCategoryId: Optional[int] = Field(None, description="FK to work_categories.id — for analytics and reporting")
    subCategoryId: Optional[int] = Field(None, description="FK to sub_categories.id — for analytics and reporting")
    status: str = Field("P", description="P (Present), HD (Half Day), L (Leave), OD (On Duty)")
    regularMins: int = Field(0, ge=0)
    overtimeMins: int = Field(0, ge=0)
    remarks: str = Field("", description="Mandatory remarks for submission")
    machineRows: Optional[List[dict]] = None

    @validator('date')
    def date_not_future(cls, v):
        # Expect format YYYY-MM-DD
        try:
            entry_date = datetime.strptime(v, "%Y-%m-%d").date()
        except ValueError:
            raise ValueError('Date must be in YYYY-MM-DD format')
        if entry_date > datetime.utcnow().date():
            raise ValueError('Date cannot be in the future')
        return v


class TimeEntryCreate(TimeEntryBase):
    pass


class TimeEntryUpdate(BaseModel):
    shift: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None
    subCategory: Optional[str] = None
    workCategoryId: Optional[int] = None
    subCategoryId: Optional[int] = None
    regularMins: Optional[int] = None
    overtimeMins: Optional[int] = None
    remarks: Optional[str] = None
    approvalStatus: Optional[str] = None


class TimeEntryApprovalPayload(BaseModel):
    comment: Optional[str] = ""


class TimeEntryOut(TimeEntryBase):
    id: int
    empId: str
    empName: str
    empNo: str
    dept: str
    designation: str
    submittedAt: str
    approvalStatus: str  # "Pending", "Approved", "Rejected"
    approvalComment: Optional[str] = ""
    approvedAt: Optional[str] = None

    class Config:
        from_attributes = True

