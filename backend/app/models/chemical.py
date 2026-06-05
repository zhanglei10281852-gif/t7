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
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False, comment="站点ID")
    chemical_type = Column(Enum(ChemicalType), nullable=False, comment="药剂类型")
    current_quantity = Column(Float, default=0, comment="当前库存量(kg)")
    safe_quantity = Column(Float, default=100, comment="安全库存量(kg)")
    unit = Column(String(20), default="kg", comment="单位")
    last_updated = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="最后更新时间")

    station = relationship("Station", back_populates="chemical_inventories")
    records = relationship("ChemicalRecord", back_populates="inventory", cascade="all, delete-orphan")


class ChemicalRecord(Base):
    __tablename__ = "chemical_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    inventory_id = Column(Integer, ForeignKey("chemical_inventories.id"), nullable=False, comment="库存ID")
    record_type = Column(Enum(RecordType), nullable=False, comment="记录类型")
    quantity = Column(Float, nullable=False, comment="数量")
    operator = Column(String(50), comment="操作人")
    remark = Column(String(500), comment="备注")
    created_at = Column(DateTime, default=datetime.now, comment="记录时间")

    inventory = relationship("ChemicalInventory", back_populates="records")
