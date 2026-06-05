from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.station import Station, ProcessType
from app.models.equipment import Equipment, EquipmentStatus
from app.models.inspection import InspectionPlan, InspectionFrequency
from app.models.chemical import ChemicalInventory, ChemicalType
from datetime import date


def init_stations(db: Session):
    stations = [
        {
            "name": "河东污水处理站",
            "design_capacity": 500,
            "process_type": ProcessType.A2O,
            "operator": "张三",
            "commission_date": date(2022, 6, 1)
        },
        {
            "name": "河西污水处理站",
            "design_capacity": 300,
            "process_type": ProcessType.MBR,
            "operator": "李四",
            "commission_date": date(2023, 1, 15)
        },
        {
            "name": "新区污水处理站",
            "design_capacity": 800,
            "process_type": ProcessType.SBR,
            "operator": "王五",
            "commission_date": date(2021, 11, 20)
        }
    ]
    
    for s in stations:
        existing = db.query(Station).filter(Station.name == s["name"]).first()
        if not existing:
            db.add(Station(**s))
    db.commit()


def init_equipment(db: Session):
    equipments = [
        {"station_id": 1, "code": "HD-FJ-001", "name": "曝气风机", "model": "BK5006", "location": "曝气池", "status": EquipmentStatus.RUNNING},
        {"station_id": 1, "code": "HD-SB-001", "name": "进水泵", "model": "WQ100-10-7.5", "location": "进水井", "status": EquipmentStatus.RUNNING},
        {"station_id": 1, "code": "HD-JY-001", "name": "加药装置", "model": "JY-500", "location": "加药间", "status": EquipmentStatus.RUNNING},
        {"station_id": 1, "code": "HD-GS-001", "name": "格栅机", "model": "GS-300", "location": "格栅井", "status": EquipmentStatus.RUNNING},
        {"station_id": 2, "code": "HX-FJ-001", "name": "曝气风机", "model": "BK5008", "location": "曝气池", "status": EquipmentStatus.RUNNING},
        {"station_id": 2, "code": "HX-SB-001", "name": "回流泵", "model": "WQ80-10-5.5", "location": "回流井", "status": EquipmentStatus.RUNNING},
        {"station_id": 2, "code": "HX-WN-001", "name": "污泥压滤机", "model": "XMY20/630", "location": "污泥间", "status": EquipmentStatus.STOPPED},
        {"station_id": 3, "code": "XQ-FJ-001", "name": "曝气风机", "model": "BK5010", "location": "SBR池", "status": EquipmentStatus.RUNNING},
        {"station_id": 3, "code": "XQ-SB-001", "name": "滗水器", "model": "BS-100", "location": "SBR池", "status": EquipmentStatus.RUNNING},
        {"station_id": 3, "code": "XQ-JY-001", "name": "PAC加药装置", "model": "JY-1000", "location": "加药间", "status": EquipmentStatus.RUNNING},
    ]
    
    for e in equipments:
        existing = db.query(Equipment).filter(Equipment.code == e["code"]).first()
        if not existing:
            db.add(Equipment(**e))
    db.commit()


def init_inspection_plans(db: Session):
    plans = [
        {"station_id": 1, "name": "日常巡检", "frequency": InspectionFrequency.DAILY, "inspector": "张三"},
        {"station_id": 2, "name": "日常巡检", "frequency": InspectionFrequency.DAILY, "inspector": "李四"},
        {"station_id": 3, "name": "日常巡检", "frequency": InspectionFrequency.DAILY, "inspector": "王五"},
        {"station_id": 1, "name": "周检", "frequency": InspectionFrequency.WEEKLY, "inspector": "张三"},
        {"station_id": 2, "name": "周检", "frequency": InspectionFrequency.WEEKLY, "inspector": "李四"},
        {"station_id": 3, "name": "周检", "frequency": InspectionFrequency.WEEKLY, "inspector": "王五"},
    ]
    
    for p in plans:
        existing = db.query(InspectionPlan).filter(
            InspectionPlan.station_id == p["station_id"],
            InspectionPlan.name == p["name"]
        ).first()
        if not existing:
            db.add(InspectionPlan(**p))
    db.commit()


def init_chemical_inventory(db: Session):
    chemicals = [
        {"station_id": 1, "chemical_type": ChemicalType.PAC, "current_quantity": 500, "safe_quantity": 100},
        {"station_id": 1, "chemical_type": ChemicalType.PAM, "current_quantity": 50, "safe_quantity": 20},
        {"station_id": 2, "chemical_type": ChemicalType.PAC, "current_quantity": 300, "safe_quantity": 80},
        {"station_id": 2, "chemical_type": ChemicalType.HYPOCHLORITE, "current_quantity": 200, "safe_quantity": 50},
        {"station_id": 3, "chemical_type": ChemicalType.PAC, "current_quantity": 800, "safe_quantity": 150},
        {"station_id": 3, "chemical_type": ChemicalType.CARBON_SOURCE, "current_quantity": 150, "safe_quantity": 60},
    ]
    
    for c in chemicals:
        existing = db.query(ChemicalInventory).filter(
            ChemicalInventory.station_id == c["station_id"],
            ChemicalInventory.chemical_type == c["chemical_type"]
        ).first()
        if not existing:
            db.add(ChemicalInventory(**c))
    db.commit()


def main():
    db = SessionLocal()
    try:
        print("正在初始化站点数据...")
        init_stations(db)
        print("正在初始化设备数据...")
        init_equipment(db)
        print("正在初始化巡检计划...")
        init_inspection_plans(db)
        print("正在初始化药剂库存...")
        init_chemical_inventory(db)
        print("初始化完成！")
    finally:
        db.close()


if __name__ == "__main__":
    main()
