from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.chemical import ChemicalInventory, ChemicalRecord, RecordType
from app.models.alarm import Alarm, AlarmType, AlarmSeverity
from app.models.station import Station
from app.schemas.chemical import (
    ChemicalInventoryCreate, ChemicalInventoryResponse,
    ChemicalRecordCreate, ChemicalRecordResponse
)

router = APIRouter(prefix="/chemical", tags=["药剂库存管理"])


@router.get("/inventory", response_model=List[ChemicalInventoryResponse])
def get_chemical_inventories(station_id: int = None, db: Session = Depends(get_db)):
    query = db.query(ChemicalInventory)
    if station_id:
        query = query.filter(ChemicalInventory.station_id == station_id)
    return query.all()


@router.post("/inventory", response_model=ChemicalInventoryResponse)
def create_chemical_inventory(inventory: ChemicalInventoryCreate, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == inventory.station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="站点不存在")
    
    existing = db.query(ChemicalInventory).filter(
        ChemicalInventory.station_id == inventory.station_id,
        ChemicalInventory.chemical_type == inventory.chemical_type
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="该站点此类型药剂已存在")
    
    db_inventory = ChemicalInventory(**inventory.model_dump())
    db.add(db_inventory)
    db.commit()
    db.refresh(db_inventory)
    return db_inventory


@router.get("/records", response_model=List[ChemicalRecordResponse])
def get_chemical_records(inventory_id: int = None, db: Session = Depends(get_db)):
    query = db.query(ChemicalRecord)
    if inventory_id:
        query = query.filter(ChemicalRecord.inventory_id == inventory_id)
    return query.order_by(ChemicalRecord.created_at.desc()).all()


@router.post("/records", response_model=ChemicalRecordResponse)
def create_chemical_record(record: ChemicalRecordCreate, db: Session = Depends(get_db)):
    inventory = db.query(ChemicalInventory).filter(
        ChemicalInventory.id == record.inventory_id
    ).first()
    if not inventory:
        raise HTTPException(status_code=404, detail="药剂库存不存在")
    
    db_record = ChemicalRecord(**record.model_dump())
    
    if record.record_type == RecordType.IN:
        inventory.current_quantity += record.quantity
    else:
        if inventory.current_quantity < record.quantity:
            raise HTTPException(status_code=400, detail="库存不足")
        inventory.current_quantity -= record.quantity
    
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    
    if inventory.current_quantity < inventory.safe_quantity:
        station = db.query(Station).filter(Station.id == inventory.station_id).first()
        existing_alarm = db.query(Alarm).filter(
            Alarm.station_id == inventory.station_id,
            Alarm.alarm_type == AlarmType.CHEMICAL_LOW,
            Alarm.status != "已处理"
        ).first()
        
        if not existing_alarm:
            alarm = Alarm(
                station_id=inventory.station_id,
                alarm_type=AlarmType.CHEMICAL_LOW,
                severity=AlarmSeverity.MEDIUM,
                status="未处理",
                title=f"{station.name}-{inventory.chemical_type.value}药剂库存不足",
                description=f"当前库存:{inventory.current_quantity}{inventory.unit}, 安全库存:{inventory.safe_quantity}{inventory.unit}"
            )
            db.add(alarm)
            db.commit()
    
    return db_record


@router.put("/inventory/{inventory_id}", response_model=ChemicalInventoryResponse)
def update_chemical_inventory(inventory_id: int, inventory: ChemicalInventoryCreate, db: Session = Depends(get_db)):
    db_inventory = db.query(ChemicalInventory).filter(
        ChemicalInventory.id == inventory_id
    ).first()
    if not db_inventory:
        raise HTTPException(status_code=404, detail="药剂库存不存在")
    
    for key, value in inventory.model_dump().items():
        setattr(db_inventory, key, value)
    
    db.commit()
    db.refresh(db_inventory)
    return db_inventory


@router.delete("/inventory/{inventory_id}")
def delete_chemical_inventory(inventory_id: int, db: Session = Depends(get_db)):
    db_inventory = db.query(ChemicalInventory).filter(
        ChemicalInventory.id == inventory_id
    ).first()
    if not db_inventory:
        raise HTTPException(status_code=404, detail="药剂库存不存在")
    
    db.delete(db_inventory)
    db.commit()
    return {"message": "删除成功"}
