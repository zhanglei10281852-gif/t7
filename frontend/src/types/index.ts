export interface Station {
  id: number;
  name: string;
  design_capacity: number;
  process_type: string;
  operator: string;
  commission_date: string;
}

export interface WaterQualityRecord {
  id: number;
  station_id: number;
  record_date: string;
  sample_time: string;
  inflow_cod: number;
  inflow_nh3n: number;
  inflow_tp: number;
  inflow_ss: number;
  inflow_ph: number;
  outflow_cod: number;
  outflow_nh3n: number;
  outflow_tp: number;
  outflow_ss: number;
  outflow_ph: number;
  is_compliant: boolean;
  remark?: string;
}

export interface WaterQualityStats {
  date: string;
  inflow_cod: number;
  outflow_cod: number;
  inflow_nh3n: number;
  outflow_nh3n: number;
  is_compliant: boolean;
}

export interface Equipment {
  id: number;
  station_id: number;
  code: string;
  name: string;
  model?: string;
  location?: string;
  status: string;
  total_run_hours: number;
}

export interface EquipmentStatusLog {
  id: number;
  equipment_id: number;
  old_status?: string;
  new_status: string;
  change_time: string;
  remark?: string;
}

export interface Alarm {
  id: number;
  station_id: number;
  alarm_type: string;
  severity: string;
  status: string;
  title: string;
  description?: string;
  handle_result?: string;
  created_at: string;
  handled_at?: string;
  handled_by?: string;
}

export interface DashboardStationOverview {
  station_id: number;
  station_name: string;
  design_capacity: number;
  process_type: string;
  operator: string;
  latest_water_quality: {
    inflow_cod: number;
    outflow_cod: number;
    inflow_nh3n: number;
    outflow_nh3n: number;
    is_compliant: boolean;
    record_date: string;
  } | null;
  fault_equipment_count: number;
}

export interface ComplianceRateData {
  date: string;
  rate: number;
  station: string;
}
