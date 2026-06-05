from sqlalchemy import Column, Integer, String, Date, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class ProcessType(str, enum.Enum):
    A2O = "A2O"
    MBR = "MBR"
    SBR = "SBR"


class Station(Base):
    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, comment="站点名称")
    design_capacity = Column(Integer, nullable=False, comment="设计处理量(吨/天)")
    process_type = Column(Enum(ProcessType), nullable=False, comment="工艺类型")
    operator = Column(String(50), nullable=False, comment="运维负责人")
    commission_date = Column(Date, nullable=False, comment="投运日期")

    water_quality_records = relationship("WaterQualityRecord", back_populates="station", cascade="all, delete-orphan")
    equipment = relationship("Equipment", back_populates="station", cascade="all, delete-orphan")
    inspection_plans = relationship("InspectionPlan", back_populates="station", cascade="all, delete-orphan")
    chemical_inventories = relationship("ChemicalInventory", back_populates="station", cascade="all, delete-orphan")
    alarms = relationship("Alarm", back_populates="station", cascade="all, delete-orphan")
