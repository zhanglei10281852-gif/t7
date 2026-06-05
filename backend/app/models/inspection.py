from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import enum


class InspectionFrequency(str, enum.Enum):
    DAILY = "每天一次"
    WEEKLY = "每周一次"


class InspectionPlan(Base):
    __tablename__ = "inspection_plans"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False, comment="站点ID")
    name = Column(String(100), nullable=False, comment="计划名称")
    frequency = Column(Enum(InspectionFrequency), nullable=False, comment="巡检频率")
    inspector = Column(String(50), nullable=False, comment="巡检员")
    is_active = Column(Boolean, default=True, comment="是否启用")

    station = relationship("Station", back_populates="inspection_plans")
    records = relationship("InspectionRecord", back_populates="plan", cascade="all, delete-orphan")


class InspectionRecord(Base):
    __tablename__ = "inspection_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    plan_id = Column(Integer, ForeignKey("inspection_plans.id"), nullable=False, comment="计划ID")
    inspection_date = Column(Date, nullable=False, comment="巡检日期")
    equipment_status = Column(Text, comment="各设备运行状态确认")
    photo_path = Column(String(500), comment="现场照片路径")
    problem_description = Column(Text, comment="发现问题描述")
    created_at = Column(DateTime, default=datetime.now, comment="上报时间")
    is_overdue = Column(Boolean, default=False, comment="是否逾期")

    plan = relationship("InspectionPlan", back_populates="records")
