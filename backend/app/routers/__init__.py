from .stations import router as stations_router
from .water_quality import router as water_quality_router
from .equipment import router as equipment_router
from .inspection import router as inspection_router
from .chemical import router as chemical_router
from .alarms import router as alarms_router
from .dashboard import router as dashboard_router

__all__ = [
    "stations_router",
    "water_quality_router",
    "equipment_router",
    "inspection_router",
    "chemical_router",
    "alarms_router",
    "dashboard_router",
]
