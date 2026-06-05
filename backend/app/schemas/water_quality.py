from pydantic import BaseModel, Field, field_validator
from datetime import date
from app.models.water_quality import SampleTime
from typing import Optional


class WaterQualityBase(BaseModel):
    station_id: int
    record_date: date
    sample_time: SampleTime
    
    inflow_cod: float = Field(..., description="进水COD(mg/L)")
    inflow_nh3n: float = Field(..., description="进水氨氮(mg/L)")
    inflow_tp: float = Field(..., description="进水总磷(mg/L)")
    inflow_ss: float = Field(..., description="进水SS(mg/L)")
    inflow_ph: float = Field(..., description="进水pH")
    
    outflow_cod: float = Field(..., description="出水COD(mg/L)")
    outflow_nh3n: float = Field(..., description="出水氨氮(mg/L)")
    outflow_tp: float = Field(..., description="出水总磷(mg/L)")
    outflow_ss: float = Field(..., description="出水SS(mg/L)")
    outflow_ph: float = Field(..., description="出水pH")
    
    remark: Optional[str] = None

    @field_validator('inflow_cod', 'outflow_cod')
    def validate_cod_range(cls, v):
        if not (0 <= v <= 1000):
            raise ValueError('COD范围必须在0-1000mg/L之间')
        return v

    @field_validator('inflow_nh3n', 'outflow_nh3n')
    def validate_nh3n_range(cls, v):
        if not (0 <= v <= 100):
            raise ValueError('氨氮范围必须在0-100mg/L之间')
        return v

    @field_validator('inflow_ph', 'outflow_ph')
    def validate_ph_range(cls, v):
        if not (1 <= v <= 14):
            raise ValueError('pH范围必须在1-14之间')
        return v

    @field_validator('inflow_tp', 'outflow_tp', 'inflow_ss', 'outflow_ss')
    def validate_positive(cls, v):
        if v < 0:
            raise ValueError('数值不能为负数')
        return v


class WaterQualityCreate(WaterQualityBase):
    pass


class WaterQualityResponse(WaterQualityBase):
    id: int
    is_compliant: bool

    class Config:
        from_attributes = True


class WaterQualityStats(BaseModel):
    date: str
    inflow_cod: float
    outflow_cod: float
    inflow_nh3n: float
    outflow_nh3n: float
    is_compliant: bool
