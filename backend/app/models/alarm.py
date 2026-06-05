from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import enum


class AlarmType(str, enum.Enum):
    WATER_QUALITY = "出水超标"
    EQUIPMENT_FAULT = "设备故障"
    INSPECTION_OVERDUE = "巡检逾期"
    CHEMICAL_LOW = "药剂不足"


class AlarmStatus(str, enum.Enum):
    UNHANDLED = "未处理"
    PROCESSING = "处理中"
    RESOLVED = "已处理"


class AlarmSeverity(str, enum.Enum):
    HIGH = "高"
    MEDIUM = "中"
    LOW = "低"


class Alarm(Base):
    __tablename__ = "alarms"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False, comment="站点ID")
    alarm_type = Column(Enum(AlarmType), nullable=False, comment="报警类型")
    severity = Column(Enum(AlarmSeverity), default=AlarmSeverity.MEDIUM, comment="严重程度")
    status = Column(Enum(AlarmStatus), default=AlarmStatus.UNHANDLED, comment="状态")
    title = Column(String(200), nullable=False, comment="标题")
    description = Column(Text, comment="详细描述")
    handle_result = Column(Text, comment="处理结果")
    created_at = Column(DateTime, default=datetime.now, comment="报警时间")
    handled_at = Column(DateTime, comment="处理时间")
    handled_by = Column(String(50), comment="处理人")

    station = relationship("Station", back_populates="alarms")
