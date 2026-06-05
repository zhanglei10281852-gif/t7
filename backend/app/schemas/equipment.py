from pydantic import BaseModel, Field
from datetime import datetime
from app.models.equipment import EquipmentStatus
from typing import Optional


class EquipmentBase(BaseModel):
    station_id: int
    code: str = Field(..., max_length=50, description="设备编号")
    name: str = Field(..., max_length=100, description="设备名称")
    model: Optional[str] = Field(None, max_length=100, description="型号")
    location: Optional[str] = Field(None, max_length=200, description="安装位置")
    status: EquipmentStatus = EquipmentStatus.RUNNING


class EquipmentCreate(EquipmentBase):
    pass


class EquipmentUpdate(EquipmentBase):
    pass


class EquipmentResponse(EquipmentBase):
    id: int
    total_run_hours: int

    class Config:
        from_attributes = True


class EquipmentStatusLogResponse(BaseModel):
    id: int
    equipment_id: int
    old_status: Optional[EquipmentStatus]
    new_status: EquipmentStatus
    change_time: datetime
    remark: Optional[str]

    class Config:
        from_attributes = True
