from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.models.equipment import Equipment, EquipmentStatusLog, EquipmentStatus
from app.models.alarm import Alarm, AlarmType, AlarmSeverity
from app.models.station import Station
from app.schemas.equipment import EquipmentCreate, EquipmentUpdate, EquipmentResponse, EquipmentStatusLogResponse

router = APIRouter(prefix="/equipment", tags=["设备管理"])


@router.get("/", response_model=List[EquipmentResponse])
def get_equipment(station_id: Optional[int] = None, status: Optional[EquipmentStatus] = None, db: Session = Depends(get_db)):
    query = db.query(Equipment)
    if station_id:
        query = query.filter(Equipment.station_id == station_id)
    if status:
        query = query.filter(Equipment.status == status)
    return query.all()


@router.get("/{equipment_id}", response_model=EquipmentResponse)
def get_equipment_item(equipment_id: int, db: Session = Depends(get_db)):
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="设备不存在")
    return equipment


@router.post("/", response_model=EquipmentResponse)
def create_equipment(equipment: EquipmentCreate, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == equipment.station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="站点不存在")
    
    db_equipment = db.query(Equipment).filter(Equipment.code == equipment.code).first()
    if db_equipment:
        raise HTTPException(status_code=400, detail="设备编号已存在")
    
    db_equipment = Equipment(**equipment.model_dump())
    db.add(db_equipment)
    db.commit()
    db.refresh(db_equipment)
    
    status_log = EquipmentStatusLog(
        equipment_id=db_equipment.id,
        old_status=None,
        new_status=equipment.status,
        remark="设备初始化"
    )
    db.add(status_log)
    db.commit()
    
    return db_equipment


@router.put("/{equipment_id}", response_model=EquipmentResponse)
def update_equipment(equipment_id: int, equipment: EquipmentUpdate, db: Session = Depends(get_db)):
    db_equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not db_equipment:
        raise HTTPException(status_code=404, detail="设备不存在")
    
    old_status = db_equipment.status
    
    for key, value in equipment.model_dump().items():
        setattr(db_equipment, key, value)
    
    if old_status != equipment.status:
        calculate_run_hours(db, db_equipment, old_status, equipment.status)
        
        status_log = EquipmentStatusLog(
            equipment_id=equipment_id,
            old_status=old_status,
            new_status=equipment.status
        )
        db.add(status_log)
        
        if equipment.status == EquipmentStatus.FAULT:
            station = db.query(Station).filter(Station.id == db_equipment.station_id).first()
            alarm = Alarm(
                station_id=db_equipment.station_id,
                alarm_type=AlarmType.EQUIPMENT_FAULT,
                severity=AlarmSeverity.HIGH,
                status="未处理",
                title=f"{station.name}-{db_equipment.name}设备故障",
                description=f"设备编号:{db_equipment.code}, 安装位置:{db_equipment.location}"
            )
            db.add(alarm)
    
    db.commit()
    db.refresh(db_equipment)
    return db_equipment


def calculate_run_hours(db: Session, equipment: Equipment, old_status: EquipmentStatus, new_status: EquipmentStatus):
    if old_status == EquipmentStatus.RUNNING and new_status != EquipmentStatus.RUNNING:
        last_log = db.query(EquipmentStatusLog).filter(
            EquipmentStatusLog.equipment_id == equipment.id,
            EquipmentStatusLog.new_status == EquipmentStatus.RUNNING
        ).order_by(EquipmentStatusLog.change_time.desc()).first()
        
        if last_log:
            hours = (datetime.now() - last_log.change_time).total_seconds() / 3600
            equipment.total_run_hours += int(hours)


@router.get("/{equipment_id}/status-logs", response_model=List[EquipmentStatusLogResponse])
def get_equipment_status_logs(equipment_id: int, db: Session = Depends(get_db)):
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="设备不存在")
    
    return db.query(EquipmentStatusLog).filter(
        EquipmentStatusLog.equipment_id == equipment_id
    ).order_by(EquipmentStatusLog.change_time.desc()).all()


@router.delete("/{equipment_id}")
def delete_equipment(equipment_id: int, db: Session = Depends(get_db)):
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="设备不存在")
    
    db.delete(equipment)
    db.commit()
    return {"message": "删除成功"}
