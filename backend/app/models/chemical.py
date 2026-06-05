from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Float
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import enum


class ChemicalType(str, enum.Enum):
    PAC = "PAC"
    PAM = "PAM"
    HYPOCHLORITE = "次氯酸钠"
    CARBON_SOURCE = "碳源"
    OTHER = "其他"


class RecordType(str, enum.Enum):
    IN = "入库"
    OUT = "出库"


class ChemicalInventory(Base):
    __tablename__ = "chemical_inventories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    chemical_type = Column(Enum(ChemicalType), nullable=False)
    current_quantity = Column(Float, default=0)
    safe_quantity = Column(Float, default=100)
    unit = Column(String(20), default="kg")
    last_updated = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    station = relationship("Station", back_populates="chemical_inventories")
    records = relationship("ChemicalRecord", back_populates="inventory", cascade="all, delete-orphan")


class ChemicalRecord(Base):
    __tablename__ = "chemical_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    inventory_id = Column(Integer, ForeignKey("chemical_inventories.id"), nullable=False)
    record_type = Column(Enum(RecordType), nullable=False)
    quantity = Column(Float, nullable=False)
    operator = Column(String(50))
    remark = Column(String(500))
    created_at = Column(DateTime, default=datetime.now)

    inventory = relationship("ChemicalInventory", back_populates="records")
