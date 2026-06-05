from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.station import Station
from app.schemas.station import StationCreate, StationUpdate, StationResponse

router = APIRouter(prefix="/stations", tags=["站点管理"])


@router.get("/", response_model=List[StationResponse])
def get_stations(db: Session = Depends(get_db)):
    return db.query(Station).all()


@router.get("/{station_id}", response_model=StationResponse)
def get_station(station_id: int, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="站点不存在")
    return station


@router.post("/", response_model=StationResponse)
def create_station(station: StationCreate, db: Session = Depends(get_db)):
    db_station = db.query(Station).filter(Station.name == station.name).first()
    if db_station:
        raise HTTPException(status_code=400, detail="站点名称已存在")
    
    db_station = Station(**station.model_dump())
    db.add(db_station)
    db.commit()
    db.refresh(db_station)
    return db_station


@router.put("/{station_id}", response_model=StationResponse)
def update_station(station_id: int, station: StationUpdate, db: Session = Depends(get_db)):
    db_station = db.query(Station).filter(Station.id == station_id).first()
    if not db_station:
        raise HTTPException(status_code=404, detail="站点不存在")
    
    for key, value in station.model_dump().items():
        setattr(db_station, key, value)
    
    db.commit()
    db.refresh(db_station)
    return db_station


@router.delete("/{station_id}")
def delete_station(station_id: int, db: Session = Depends(get_db)):
    db_station = db.query(Station).filter(Station.id == station_id).first()
    if not db_station:
        raise HTTPException(status_code=404, detail="站点不存在")
    
    db.delete(db_station)
    db.commit()
    return {"message": "删除成功"}
