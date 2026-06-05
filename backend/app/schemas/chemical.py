from pydantic import BaseModel, Field
from datetime import datetime
from app.models.chemical import ChemicalType, RecordType
from typing import Optional


class ChemicalInventoryBase(BaseModel):
    station_id: int
    chemical_type: ChemicalType
    current_quantity: float = Field(..., ge=0, description="当前库存量")
    safe_quantity: float = Field(100, gt=0, description="安全库存量")
    unit: str = "kg"


class ChemicalInventoryCreate(ChemicalInventoryBase):
    pass


class ChemicalInventoryResponse(ChemicalInventoryBase):
    id: int
    last_updated: datetime

    class Config:
        from_attributes = True


class ChemicalRecordBase(BaseModel):
    inventory_id: int
    record_type: RecordType
    quantity: float = Field(..., gt=0, description="数量")
    operator: Optional[str] = Field(None, max_length=50, description="操作人")
    remark: Optional[str] = Field(None, max_length=500, description="备注")


class ChemicalRecordCreate(ChemicalRecordBase):
    pass


class ChemicalRecordResponse(ChemicalRecordBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
