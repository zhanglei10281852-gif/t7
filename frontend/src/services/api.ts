import axios from "axios";
import type {
  Station,
  WaterQualityRecord,
  WaterQualityStats,
  Equipment,
  EquipmentStatusLog,
  Alarm,
  DashboardStationOverview,
  ComplianceRateData,
  InspectionPlan,
  InspectionRecord,
  ChemicalInventory,
  ChemicalRecord,
} from "../types";

const API_BASE = "/api/v1";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

export const stationApi = {
  getAll: () => api.get<Station[]>("/stations"),
  getById: (id: number) => api.get<Station>(`/stations/${id}`),
  create: (data: Omit<Station, "id">) => api.post<Station>("/stations", data),
  update: (id: number, data: Omit<Station, "id">) =>
    api.put<Station>(`/stations/${id}`, data),
  delete: (id: number) => api.delete(`/stations/${id}`),
};

export const waterQualityApi = {
  getAll: (params?: {
    station_id?: number;
    start_date?: string;
    end_date?: string;
  }) => api.get<WaterQualityRecord[]>("/water-quality", { params }),
  getById: (id: number) => api.get<WaterQualityRecord>(`/water-quality/${id}`),
  create: (data: Omit<WaterQualityRecord, "id" | "is_compliant">) =>
    api.post<WaterQualityRecord>("/water-quality", data),
  getStats: (stationId: number, days: number = 30) =>
    api.get<WaterQualityStats[]>(`/water-quality/stats/${stationId}`, {
      params: { days },
    }),
  export: (stationId: number) =>
    api.get(`/water-quality/export/${stationId}`, { responseType: "blob" }),
};

export const equipmentApi = {
  getAll: (params?: { station_id?: number; status?: string }) =>
    api.get<Equipment[]>("/equipment", { params }),
  getById: (id: number) => api.get<Equipment>(`/equipment/${id}`),
  create: (data: Omit<Equipment, "id" | "total_run_hours">) =>
    api.post<Equipment>("/equipment", data),
  update: (id: number, data: Omit<Equipment, "id" | "total_run_hours">) =>
    api.put<Equipment>(`/equipment/${id}`, data),
  delete: (id: number) => api.delete(`/equipment/${id}`),
  getStatusLogs: (id: number) =>
    api.get<EquipmentStatusLog[]>(`/equipment/${id}/status-logs`),
};

export const alarmApi = {
  getAll: (params?: { station_id?: number; status?: string }) =>
    api.get<Alarm[]>("/alarms", { params }),
  getById: (id: number) => api.get<Alarm>(`/alarms/${id}`),
  create: (data: Omit<Alarm, "id" | "created_at" | "handled_at">) =>
    api.post<Alarm>("/alarms", data),
  update: (
    id: number,
    data: { status: string; handle_result?: string; handled_by?: string },
  ) => api.put<Alarm>(`/alarms/${id}`, data),
  getUnhandledCount: () =>
    api.get<{ count: number }>("/alarms/stats/unhandled"),
};

export const dashboardApi = {
  getOverview: () => api.get<DashboardStationOverview[]>("/dashboard/overview"),
  getComplianceRate: (days: number = 30) =>
    api.get<Record<string, ComplianceRateData[]>>(
      "/dashboard/compliance-rate",
      {
        params: { days },
      },
    ),
  getUnhandledAlarmsCount: () =>
    api.get<{ count: number }>("/dashboard/unhandled-alarms-count"),
};

export const inspectionApi = {
  getPlans: (params?: { station_id?: number }) =>
    api.get<InspectionPlan[]>("/inspection/plans", { params }),
  createPlan: (data: Omit<InspectionPlan, "id">) =>
    api.post<InspectionPlan>("/inspection/plans", data),
  updatePlan: (id: number, data: Omit<InspectionPlan, "id">) =>
    api.put<InspectionPlan>(`/inspection/plans/${id}`, data),
  deletePlan: (id: number) => api.delete(`/inspection/plans/${id}`),
  getRecords: (params?: { plan_id?: number }) =>
    api.get<InspectionRecord[]>("/inspection/records", { params }),
  createRecord: (
    data: Omit<InspectionRecord, "id" | "created_at" | "is_overdue">,
  ) => api.post<InspectionRecord>("/inspection/records", data),
};

export const chemicalApi = {
  getInventories: (params?: { station_id?: number }) =>
    api.get<ChemicalInventory[]>("/chemical/inventory", { params }),
  createInventory: (data: Omit<ChemicalInventory, "id" | "last_updated">) =>
    api.post<ChemicalInventory>("/chemical/inventory", data),
  updateInventory: (
    id: number,
    data: Omit<ChemicalInventory, "id" | "last_updated">,
  ) => api.put<ChemicalInventory>(`/chemical/inventory/${id}`, data),
  deleteInventory: (id: number) => api.delete(`/chemical/inventory/${id}`),
  getRecords: (params?: { inventory_id?: number }) =>
    api.get<ChemicalRecord[]>("/chemical/records", { params }),
  createRecord: (data: Omit<ChemicalRecord, "id" | "created_at">) =>
    api.post<ChemicalRecord>("/chemical/records", data),
};

export default api;
