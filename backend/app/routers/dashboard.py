from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date, timedelta
from app.core.database import get_db
from app.models.station import Station
from app.models.water_quality import WaterQualityRecord
from app.models.equipment import Equipment, EquipmentStatus
from app.models.alarm import Alarm, AlarmStatus

router = APIRouter(prefix="/dashboard", tags=["仪表盘"])


@router.get("/overview")
def get_dashboard_overview(db: Session = Depends(get_db)):
    stations = db.query(Station).all()
    result = []
    
    for station in stations:
        today = date.today()
        today_records = db.query(WaterQualityRecord).filter(
            WaterQualityRecord.station_id == station.id,
            WaterQualityRecord.record_date == today
        ).all()
        
        latest_record = None
        if today_records:
            latest_record = sorted(today_records, key=lambda x: x.sample_time.value, reverse=True)[0]
        else:
            latest_record = db.query(WaterQualityRecord).filter(
                WaterQualityRecord.station_id == station.id
            ).order_by(WaterQualityRecord.record_date.desc()).first()
        
        fault_count = db.query(Equipment).filter(
            Equipment.station_id == station.id,
            Equipment.status == EquipmentStatus.FAULT
        ).count()
        
        result.append({
            "station_id": station.id,
            "station_name": station.name,
            "design_capacity": station.design_capacity,
            "process_type": station.process_type.value,
            "operator": station.operator,
            "latest_water_quality": {
                "inflow_cod": latest_record.inflow_cod if latest_record else None,
                "outflow_cod": latest_record.outflow_cod if latest_record else None,
                "inflow_nh3n": latest_record.inflow_nh3n if latest_record else None,
                "outflow_nh3n": latest_record.outflow_nh3n if latest_record else None,
                "is_compliant": latest_record.is_compliant if latest_record else None,
                "record_date": latest_record.record_date if latest_record else None
            } if latest_record else None,
            "fault_equipment_count": fault_count
        })
    
    return result


@router.get("/compliance-rate")
def get_compliance_rate(days: int = 30, db: Session = Depends(get_db)):
    end_date = date.today()
    start_date = end_date - timedelta(days=days-1)
    
    stations = db.query(Station).all()
    result = {}
    
    for station in stations:
        records = db.query(WaterQualityRecord).filter(
            WaterQualityRecord.station_id == station.id,
            WaterQualityRecord.record_date >= start_date
        ).all()
        
        daily_stats = {}
        for record in records:
            date_str = record.record_date.isoformat()
            if date_str not in daily_stats:
                daily_stats[date_str] = {"total": 0, "compliant": 0}
            daily_stats[date_str]["total"] += 1
            if record.is_compliant:
                daily_stats[date_str]["compliant"] += 1
        
        rates = []
        for i in range(days):
            current_date = start_date + timedelta(days=i)
            date_str = current_date.isoformat()
            if date_str in daily_stats and daily_stats[date_str]["total"] > 0:
                rate = daily_stats[date_str]["compliant"] / daily_stats[date_str]["total"] * 100
            else:
                rate = 100
            rates.append({"date": date_str, "rate": rate, "station": station.name})
        
        result[station.name] = rates
    
    return result


@router.get("/unhandled-alarms-count")
def get_unhandled_alarms_count(db: Session = Depends(get_db)):
    count = db.query(Alarm).filter(Alarm.status == AlarmStatus.UNHANDLED).count()
    return {"count": count}
