from pydantic import BaseModel, Field
from typing import Optional


class WorkCategoryBase(BaseModel):
    name: str = Field(..., min_length=2, description="Name of the work category")
    description: Optional[str] = Field("", description="Optional description")
    active: Optional[bool] = Field(True, description="Whether this category is active")


class WorkCategoryCreate(WorkCategoryBase):
    pass


class WorkCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None


class WorkCategoryOut(WorkCategoryBase):
    id: int

    class Config:
        from_attributes = True
