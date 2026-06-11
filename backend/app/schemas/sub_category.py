from pydantic import BaseModel, Field
from typing import Optional


class SubCategoryBase(BaseModel):
    name: str = Field(..., min_length=2)
    description: Optional[str] = ""
    workCategoryId: Optional[int] = Field(None, description="ID of the parent Work Category")
    department: Optional[str] = Field(None, description="Department this sub-category belongs to")
    active: Optional[bool] = Field(True, description="Whether this sub-category is active")


class SubCategoryCreate(SubCategoryBase):
    pass


class SubCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    workCategoryId: Optional[int] = None
    department: Optional[str] = None
    active: Optional[bool] = None


class SubCategoryOut(SubCategoryBase):
    id: int

    class Config:
        from_attributes = True

