from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import enum


class EquipmentStatus(str, enum.Enum):
    RUNNING = "运行"
    STOPPED = "停机"
    FAULT = "故障"
    MAINTENANCE = "维保中"


class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False, comment="站点ID")
    code = Column(String(50), unique=True, nullable=False, comment="设备编号")
    name = Column(String(100), nullable=False, comment="设备名称")
    model = Column(String(100), comment="型号")
    location = Column(String(200), comment="安装位置")
    status = Column(Enum(EquipmentStatus), default=EquipmentStatus.RUNNING, comment="状态")
    
    total_run_hours = Column(Integer, default=0, comment="累计运行小时数")
    
    station = relationship("Station", back_populates="equipment")
    status_logs = relationship("EquipmentStatusLog", back_populates="equipment", cascade="all, delete-orphan")


class EquipmentStatusLog(Base):
    __tablename__ = "equipment_status_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=False, comment="设备ID")
    old_status = Column(Enum(EquipmentStatus), comment="原状态")
    new_status = Column(Enum(EquipmentStatus), nullable=False, comment="新状态")
    change_time = Column(DateTime, default=datetime.now, comment="变更时间")
    remark = Column(String(500), comment="备注")

    equipment = relationship("Equipment", back_populates="status_logs")
