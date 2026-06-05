from pydantic import BaseModel, Field
from datetime import date, datetime
from app.models.inspection import InspectionFrequency
from typing import Optional


class InspectionPlanBase(BaseModel):
    station_id: int
    name: str = Field(..., max_length=100, description="计划名称")
    frequency: InspectionFrequency
    inspector: str = Field(..., max_length=50, description="巡检员")
    is_active: bool = True


class InspectionPlanCreate(InspectionPlanBase):
    pass


class InspectionPlanResponse(InspectionPlanBase):
    id: int

    class Config:
        from_attributes = True


class InspectionRecordBase(BaseModel):
    plan_id: int
    inspection_date: date
    equipment_status: Optional[str] = None
    photo_path: Optional[str] = Field(None, max_length=500, description="现场照片路径")
    problem_description: Optional[str] = None


class InspectionRecordCreate(InspectionRecordBase):
    pass


class InspectionRecordResponse(InspectionRecordBase):
    id: int
    created_at: datetime
    is_overdue: bool

    class Config:
        from_attributes = True
