from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta
from app.core.database import get_db
from app.models.water_quality import WaterQualityRecord
from app.models.alarm import Alarm, AlarmType, AlarmSeverity
from app.models.station import Station
from app.schemas.water_quality import WaterQualityCreate, WaterQualityResponse
from fastapi.responses import StreamingResponse
import io
import csv

router = APIRouter(prefix="/water-quality", tags=["水质数据管理"])


@router.get("/", response_model=List[WaterQualityResponse])
def get_water_quality_records(station_id: int = None, start_date: date = None, end_date: date = None, db: Session = Depends(get_db)):
    query = db.query(WaterQualityRecord)
    if station_id:
        query = query.filter(WaterQualityRecord.station_id == station_id)
    if start_date:
        query = query.filter(WaterQualityRecord.record_date >= start_date)
    if end_date:
        query = query.filter(WaterQualityRecord.record_date <= end_date)
    return query.order_by(WaterQualityRecord.record_date.desc()).all()


@router.get("/{record_id}", response_model=WaterQualityResponse)
def get_water_quality_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(WaterQualityRecord).filter(WaterQualityRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.post("/", response_model=WaterQualityResponse)
def create_water_quality_record(record: WaterQualityCreate, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == record.station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="站点不存在")
    
    db_record = WaterQualityRecord(**record.model_dump())
    db_record.is_compliant = db_record.check_compliance()
    
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    
    if not db_record.is_compliant:
        alarm = Alarm(
            station_id=record.station_id,
            alarm_type=AlarmType.WATER_QUALITY,
            severity=AlarmSeverity.HIGH,
            status="未处理",
            title=f"{station.name}出水水质超标",
            description=f"COD:{db_record.outflow_cod}mg/L, 氨氮:{db_record.outflow_nh3n}mg/L, 总磷:{db_record.outflow_tp}mg/L, SS:{db_record.outflow_ss}mg/L"
        )
        db.add(alarm)
        db.commit()
    
    return db_record


@router.get("/stats/{station_id}")
def get_water_quality_stats(station_id: int, days: int = 30, db: Session = Depends(get_db)):
    end_date = date.today()
    start_date = end_date - timedelta(days=days-1)
    
    records = db.query(WaterQualityRecord).filter(
        WaterQualityRecord.station_id == station_id,
        WaterQualityRecord.record_date >= start_date
    ).order_by(WaterQualityRecord.record_date).all()
    
    daily_stats = {}
    for record in records:
        date_str = record.record_date.isoformat()
        if date_str not in daily_stats:
            daily_stats[date_str] = {
                "date": date_str,
                "inflow_cod": [],
                "outflow_cod": [],
                "inflow_nh3n": [],
                "outflow_nh3n": [],
                "is_compliant": True
            }
        daily_stats[date_str]["inflow_cod"].append(record.inflow_cod)
        daily_stats[date_str]["outflow_cod"].append(record.outflow_cod)
        daily_stats[date_str]["inflow_nh3n"].append(record.inflow_nh3n)
        daily_stats[date_str]["outflow_nh3n"].append(record.outflow_nh3n)
        if not record.is_compliant:
            daily_stats[date_str]["is_compliant"] = False
    
    result = []
    for date_str, stats in daily_stats.items():
        result.append({
            "date": date_str,
            "inflow_cod": sum(stats["inflow_cod"]) / len(stats["inflow_cod"]),
            "outflow_cod": sum(stats["outflow_cod"]) / len(stats["outflow_cod"]),
            "inflow_nh3n": sum(stats["inflow_nh3n"]) / len(stats["inflow_nh3n"]),
            "outflow_nh3n": sum(stats["outflow_nh3n"]) / len(stats["outflow_nh3n"]),
            "is_compliant": stats["is_compliant"]
        })
    
    return sorted(result, key=lambda x: x["date"])


@router.get("/export/{station_id}")
def export_water_quality_records(station_id: int, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="站点不存在")
    
    records = db.query(WaterQualityRecord).filter(
        WaterQualityRecord.station_id == station_id
    ).order_by(WaterQualityRecord.record_date.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "日期", "取样时间", 
        "进水COD", "进水氨氮", "进水总磷", "进水SS", "进水pH",
        "出水COD", "出水氨氮", "出水总磷", "出水SS", "出水pH",
        "是否达标", "备注"
    ])
    
    for record in records:
        writer.writerow([
            record.record_date, record.sample_time,
            record.inflow_cod, record.inflow_nh3n, record.inflow_tp, record.inflow_ss, record.inflow_ph,
            record.outflow_cod, record.outflow_nh3n, record.outflow_tp, record.outflow_ss, record.outflow_ph,
            "达标" if record.is_compliant else "超标", record.remark or ""
        ])
    
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={station.name}_水质数据.csv"}
    )
