from pydantic import BaseModel, Field
from datetime import date
from app.models.station import ProcessType


class StationBase(BaseModel):
    name: str = Field(..., max_length=100, description="站点名称")
    design_capacity: int = Field(..., gt=0, description="设计处理量(吨/天)")
    process_type: ProcessType
    operator: str = Field(..., max_length=50, description="运维负责人")
    commission_date: date


class StationCreate(StationBase):
    pass


class StationUpdate(StationBase):
    pass


class StationResponse(StationBase):
    id: int

    class Config:
        from_attributes = True
