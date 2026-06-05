from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.models.alarm import Alarm, AlarmStatus
from app.schemas.alarm import AlarmCreate, AlarmUpdate, AlarmResponse

router = APIRouter(prefix="/alarms", tags=["报警管理"])


@router.get("/", response_model=List[AlarmResponse])
def get_alarms(
    station_id: Optional[int] = None,
    status: Optional[AlarmStatus] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Alarm)
    if station_id:
        query = query.filter(Alarm.station_id == station_id)
    if status:
        query = query.filter(Alarm.status == status)
    return query.order_by(Alarm.created_at.desc()).all()


@router.get("/{alarm_id}", response_model=AlarmResponse)
def get_alarm(alarm_id: int, db: Session = Depends(get_db)):
    alarm = db.query(Alarm).filter(Alarm.id == alarm_id).first()
    if not alarm:
        raise HTTPException(status_code=404, detail="报警不存在")
    return alarm


@router.post("/", response_model=AlarmResponse)
def create_alarm(alarm: AlarmCreate, db: Session = Depends(get_db)):
    db_alarm = Alarm(**alarm.model_dump())
    db.add(db_alarm)
    db.commit()
    db.refresh(db_alarm)
    return db_alarm


@router.put("/{alarm_id}", response_model=AlarmResponse)
def update_alarm(alarm_id: int, alarm: AlarmUpdate, db: Session = Depends(get_db)):
    db_alarm = db.query(Alarm).filter(Alarm.id == alarm_id).first()
    if not db_alarm:
        raise HTTPException(status_code=404, detail="报警不存在")
    
    db_alarm.status = alarm.status
    db_alarm.handle_result = alarm.handle_result
    db_alarm.handled_by = alarm.handled_by
    
    if alarm.status == AlarmStatus.RESOLVED and not db_alarm.handled_at:
        db_alarm.handled_at = datetime.now()
    
    db.commit()
    db.refresh(db_alarm)
    return db_alarm


@router.get("/stats/unhandled")
def get_unhandled_alarms_count(db: Session = Depends(get_db)):
    count = db.query(Alarm).filter(Alarm.status == AlarmStatus.UNHANDLED).count()
    return {"count": count}
