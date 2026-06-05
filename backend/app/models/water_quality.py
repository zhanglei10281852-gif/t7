from sqlalchemy import Column, Integer, Float, String, Date, Time, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class SampleTime(str, enum.Enum):
    MORNING = "上午"
    AFTERNOON = "下午"


class WaterQualityRecord(Base):
    __tablename__ = "water_quality_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False, comment="站点ID")
    record_date = Column(Date, nullable=False, comment="记录日期")
    sample_time = Column(Enum(SampleTime), nullable=False, comment="取样时间")
    
    inflow_cod = Column(Float, nullable=False, comment="进水COD(mg/L)")
    inflow_nh3n = Column(Float, nullable=False, comment="进水氨氮(mg/L)")
    inflow_tp = Column(Float, nullable=False, comment="进水总磷(mg/L)")
    inflow_ss = Column(Float, nullable=False, comment="进水SS(mg/L)")
    inflow_ph = Column(Float, nullable=False, comment="进水pH")
    
    outflow_cod = Column(Float, nullable=False, comment="出水COD(mg/L)")
    outflow_nh3n = Column(Float, nullable=False, comment="出水氨氮(mg/L)")
    outflow_tp = Column(Float, nullable=False, comment="出水总磷(mg/L)")
    outflow_ss = Column(Float, nullable=False, comment="出水SS(mg/L)")
    outflow_ph = Column(Float, nullable=False, comment="出水pH")
    
    is_compliant = Column(Boolean, default=True, comment="是否达标")
    remark = Column(String(500), comment="备注")

    station = relationship("Station", back_populates="water_quality_records")

    def check_compliance(self) -> bool:
        cod_ok = self.outflow_cod <= 50
        nh3n_ok = self.outflow_nh3n <= 5
        tp_ok = self.outflow_tp <= 0.5
        ss_ok = self.outflow_ss <= 10
        return cod_ok and nh3n_ok and tp_ok and ss_ok
