from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.database import engine, Base
from app.routers import (
    stations_router,
    water_quality_router,
    equipment_router,
    inspection_router,
    chemical_router,
    alarms_router,
    dashboard_router,
)

settings = get_settings()

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stations_router, prefix=settings.API_V1_STR)
app.include_router(water_quality_router, prefix=settings.API_V1_STR)
app.include_router(equipment_router, prefix=settings.API_V1_STR)
app.include_router(inspection_router, prefix=settings.API_V1_STR)
app.include_router(chemical_router, prefix=settings.API_V1_STR)
app.include_router(alarms_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {"message": "污水处理站运维管理平台API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
