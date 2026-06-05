from pydantic import BaseModel, Field
from datetime import datetime
from app.models.alarm import AlarmType, AlarmStatus, AlarmSeverity
from typing import Optional


class AlarmBase(BaseModel):
    station_id: int
    alarm_type: AlarmType
    severity: AlarmSeverity = AlarmSeverity.MEDIUM
    title: str = Field(..., max_length=200, description="标题")
    description: Optional[str] = None


class AlarmCreate(AlarmBase):
    pass


class AlarmUpdate(BaseModel):
    status: AlarmStatus
    handle_result: Optional[str] = None
    handled_by: Optional[str] = Field(None, max_length=50, description="处理人")


class AlarmResponse(AlarmBase):
    id: int
    status: AlarmStatus
    handle_result: Optional[str] = None
    created_at: datetime
    handled_at: Optional[datetime] = None
    handled_by: Optional[str] = None

    class Config:
        from_attributes = True
