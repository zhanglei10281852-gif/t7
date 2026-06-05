from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta
from app.core.database import get_db
from app.models.inspection import InspectionPlan, InspectionRecord, InspectionFrequency
from app.models.alarm import Alarm, AlarmType, AlarmSeverity
from app.models.station import Station
from app.schemas.inspection import InspectionPlanCreate, InspectionPlanResponse, InspectionRecordCreate, InspectionRecordResponse

router = APIRouter(prefix="/inspection", tags=["巡检管理"])


@router.get("/plans", response_model=List[InspectionPlanResponse])
def get_inspection_plans(station_id: int = None, db: Session = Depends(get_db)):
    query = db.query(InspectionPlan)
    if station_id:
        query = query.filter(InspectionPlan.station_id == station_id)
    return query.all()


@router.post("/plans", response_model=InspectionPlanResponse)
def create_inspection_plan(plan: InspectionPlanCreate, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == plan.station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="站点不存在")
    
    db_plan = InspectionPlan(**plan.model_dump())
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan


@router.get("/records", response_model=List[InspectionRecordResponse])
def get_inspection_records(plan_id: int = None, db: Session = Depends(get_db)):
    query = db.query(InspectionRecord)
    if plan_id:
        query = query.filter(InspectionRecord.plan_id == plan_id)
    return query.order_by(InspectionRecord.inspection_date.desc()).all()


@router.post("/records", response_model=InspectionRecordResponse)
def create_inspection_record(record: InspectionRecordCreate, db: Session = Depends(get_db)):
    plan = db.query(InspectionPlan).filter(InspectionPlan.id == record.plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="巡检计划不存在")
    
    is_overdue = check_overdue(plan, record.inspection_date)
    
    db_record = InspectionRecord(**record.model_dump())
    db_record.is_overdue = is_overdue
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    
    if is_overdue:
        station = db.query(Station).filter(Station.id == plan.station_id).first()
        alarm = Alarm(
            station_id=plan.station_id,
            alarm_type=AlarmType.INSPECTION_OVERDUE,
            severity=AlarmSeverity.MEDIUM,
            status="未处理",
            title=f"{station.name}-{plan.name}巡检逾期",
            description=f"计划频率:{plan.frequency}, 巡检员:{plan.inspector}"
        )
        db.add(alarm)
        db.commit()
    
    return db_record


def check_overdue(plan: InspectionPlan, inspection_date: date) -> bool:
    if plan.frequency == InspectionFrequency.DAILY:
        expected_date = date.today()
        return inspection_date < expected_date
    elif plan.frequency == InspectionFrequency.WEEKLY:
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        return inspection_date < week_start
    return False


@router.put("/plans/{plan_id}", response_model=InspectionPlanResponse)
def update_inspection_plan(plan_id: int, plan: InspectionPlanCreate, db: Session = Depends(get_db)):
    db_plan = db.query(InspectionPlan).filter(InspectionPlan.id == plan_id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="巡检计划不存在")
    
    for key, value in plan.model_dump().items():
        setattr(db_plan, key, value)
    
    db.commit()
    db.refresh(db_plan)
    return db_plan


@router.delete("/plans/{plan_id}")
def delete_inspection_plan(plan_id: int, db: Session = Depends(get_db)):
    db_plan = db.query(InspectionPlan).filter(InspectionPlan.id == plan_id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="巡检计划不存在")
    
    db.delete(db_plan)
    db.commit()
    return {"message": "删除成功"}
