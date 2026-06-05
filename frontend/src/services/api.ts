import axios from 'axios';
import type {
  Station,
  WaterQualityRecord,
  WaterQualityStats,
  Equipment,
  EquipmentStatusLog,
  Alarm,
  DashboardStationOverview,
  ComplianceRateData,
} from '../types';

const API_BASE = '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

export const stationApi = {
  getAll: () => api.get<Station[]>('/stations'),
  getById: (id: number) => api.get<Station>(`/stations/${id}`),
  create: (data: Omit<Station, 'id'>) => api.post<Station>('/stations', data),
  update: (id: number, data: Omit<Station, 'id'>) => api.put<Station>(`/stations/${id}`, data),
  delete: (id: number) => api.delete(`/stations/${id}`),
};

export const waterQualityApi = {
  getAll: (params?: { station_id?: number; start_date?: string; end_date?: string }) =>
    api.get<WaterQualityRecord[]>('/water-quality', { params }),
  getById: (id: number) => api.get<WaterQualityRecord>(`/water-quality/${id}`),
  create: (data: Omit<WaterQualityRecord, 'id' | 'is_compliant'>) =>
    api.post<WaterQualityRecord>('/water-quality', data),
  getStats: (stationId: number, days: number = 30) =>
    api.get<WaterQualityStats[]>(`/water-quality/stats/${stationId}`, { params: { days } }),
  export: (stationId: number) =>
    api.get(`/water-quality/export/${stationId}`, { responseType: 'blob' }),
};

export const equipmentApi = {
  getAll: (params?: { station_id?: number; status?: string }) =>
    api.get<Equipment[]>('/equipment', { params }),
  getById: (id: number) => api.get<Equipment>(`/equipment/${id}`),
  create: (data: Omit<Equipment, 'id' | 'total_run_hours'>) =>
    api.post<Equipment>('/equipment', data),
  update: (id: number, data: Omit<Equipment, 'id' | 'total_run_hours'>) =>
    api.put<Equipment>(`/equipment/${id}`, data),
  delete: (id: number) => api.delete(`/equipment/${id}`),
  getStatusLogs: (id: number) =>
    api.get<EquipmentStatusLog[]>(`/equipment/${id}/status-logs`),
};

export const alarmApi = {
  getAll: (params?: { station_id?: number; status?: string }) =>
    api.get<Alarm[]>('/alarms', { params }),
  getById: (id: number) => api.get<Alarm>(`/alarms/${id}`),
  create: (data: Omit<Alarm, 'id' | 'created_at' | 'handled_at'>) =>
    api.post<Alarm>('/alarms', data),
  update: (id: number, data: { status: string; handle_result?: string; handled_by?: string }) =>
    api.put<Alarm>(`/alarms/${id}`, data),
  getUnhandledCount: () => api.get<{ count: number }>('/alarms/stats/unhandled'),
};

export const dashboardApi = {
  getOverview: () => api.get<DashboardStationOverview[]>('/dashboard/overview'),
  getComplianceRate: (days: number = 30) =>
    api.get<Record<string, ComplianceRateData[]>>('/dashboard/compliance-rate', {
      params: { days },
    }),
  getUnhandledAlarmsCount: () =>
    api.get<{ count: number }>('/dashboard/unhandled-alarms-count'),
};

export default api;
