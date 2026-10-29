export type PickupCategory =
  | 'Residential community'
  | 'Apartment complex'
  | 'Residential area or colony'
  | 'College'
  | 'Hospital'
  | 'Office'
  | 'Business or IT shop'
  | string;

export type PickupStatus = 'normal' | 'due' | 'urgent' | 'critical';

export interface Facility {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FacilityCreateInput {
  name: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  active?: boolean;
}

export interface FacilityPatchInput {
  name?: string;
  latitude?: number;
  longitude?: number;
  address?: string | null;
  active?: boolean;
}

export type VehicleFuelType = 'diesel' | 'electric' | 'cng' | string;
export type VehicleStatus = 'available' | 'inactive' | 'maintenance';

export interface Vehicle {
  id: string;
  facility_id: string;
  name: string;
  rated_weight_capacity_kg: number;
  rated_cargo_volume_m3: number;
  usable_weight_capacity_kg: number;
  usable_volume_capacity_m3: number;
  fuel_type: VehicleFuelType;
  status: VehicleStatus;
  max_working_minutes?: number | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleCreateInput {
  name: string;
  weight_capacity_kg: number;
  volume_capacity_m3: number;
  fuel_type?: string;
  status?: VehicleStatus;
  max_working_minutes?: number | null;
}

export interface VehiclePatchInput {
  name?: string;
  weight_capacity_kg?: number;
  volume_capacity_m3?: number;
  fuel_type?: string;
  status?: VehicleStatus;
  max_working_minutes?: number | null;
}

export interface PickupPoint {
  id: string;
  name: string;
  category: PickupCategory;
  latitude: number;
  longitude: number;
  address?: string | null;
  notes?: string | null;
  maximum_safe_weight_kg: number;
  maximum_safe_volume_m3: number;
  current_pending_weight_kg: number;
  current_pending_volume_m3: number;
  service_minutes: number;
  active: boolean;
  weight_utilisation_percent: number;
  volume_utilisation_percent: number;
  waiting_days: number;
  status: PickupStatus;
  reasons: string[];
  created_at: string;
  updated_at: string;
}

export interface PickupCreateInput {
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  notes?: string | null;
  max_weight_kg: number;
  max_volume_m3: number;
  pending_weight_kg?: number;
  pending_volume_m3?: number;
  service_minutes?: number;
  initial_wait_days?: number;
  active?: boolean;
}

export interface PickupPatchInput {
  name?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  address?: string | null;
  notes?: string | null;
  max_weight_kg?: number;
  max_volume_m3?: number;
  service_minutes?: number;
  active?: boolean;
}

export interface LoadUpdateInput {
  added_weight_kg: number;
  added_volume_m3: number;
  description?: string | null;
}

export interface LoadUpdateResponse extends PickupPoint {
  added_weight_kg: number;
  added_volume_m3: number;
  warnings: string[];
}

export interface LoadHistoryItem {
  id: string;
  added_weight_kg: number;
  added_volume_m3: number;
  description?: string | null;
  created_at: string;
}

export interface SimulationSettings {
  weight_safety_margin: number;
  volume_safety_margin: number;
  due_threshold: number;
  urgent_threshold: number;
  critical_threshold: number;
  mandatory_wait_days: number;
  opportunistic_detour_km: number;
  working_minutes_per_day: number;
  fuel_l_per_km: number;
  fuel_price_per_l: number;
  co2_kg_per_l: number;
}

export interface SettingsPatchInput {
  weight_safety_margin?: number;
  volume_safety_margin?: number;
  due_threshold?: number;
  urgent_threshold?: number;
  critical_threshold?: number;
  mandatory_wait_days?: number;
  opportunistic_detour_km?: number;
  working_minutes_per_day?: number;
  fuel_l_per_km?: number;
  fuel_price_per_l?: number;
  co2_kg_per_l?: number;
}

export interface SimulationClockResponse {
  simulation_time: string;
}

export interface AdvanceClockResponse {
  simulation_time: string;
  advanced_days: number;
}

export interface PlanInput {
  facility_ids?: string[] | null;
  pickup_point_ids?: string[] | null;
  include_baseline?: boolean;
  objective?: 'distance';
  allow_multi_trip?: boolean;
  include_opportunistic_pickups?: boolean;
}

export interface RouteStop {
  sequence: number;
  pickup_point_id: string;
  planned_weight_kg: number;
  planned_volume_m3: number;
  weight_after_kg: number;
  volume_after_m3: number;
  remaining_weight_capacity_kg: number;
  remaining_volume_capacity_m3: number;
}

export interface RouteGeometry {
  type: 'LineString';
  coordinates: [number, number][]; // [lon, lat]
}

export interface SimulationRoute {
  facility_id: string;
  vehicle_id: string;
  trip_number: number;
  stops: RouteStop[];
  distance_km: number;
  drive_minutes: number;
  service_minutes: number;
  total_minutes: number;
  geometry?: RouteGeometry | null;
  routing_source: string;
}

export interface RouteAssignment {
  pickup_point_id: string;
  facility_id: string;
  reason: string;
}

export interface DeferredPickup {
  pickup_point_id: string;
  reason: string;
}

export interface RoutePlanMetrics {
  total_road_distance_km: number;
  driving_time_minutes: number;
  loading_service_minutes: number;
  weight_collected_kg: number;
  volume_collected_m3: number;
  number_of_trips: number;
  depot_returns: number;
  estimated_fuel_l: number;
  estimated_emissions_kg_co2: number;
  estimated_operating_cost: number;
}

export interface PercentageReduction {
  distance?: number;
  time?: number;
  cost?: number;
  emissions?: number;
}

export interface SimulationMetricsBundle {
  optimised: RoutePlanMetrics;
  baseline: Partial<RoutePlanMetrics>;
  percentage_reduction: PercentageReduction;
}

export interface SimulationRun {
  run_id: string;
  status: 'planned' | 'executed' | string;
  routing_provider: string;
  simulation_time: string;
  assignments: RouteAssignment[];
  routes: SimulationRoute[];
  metrics: SimulationMetricsBundle;
  deferred_pickups: DeferredPickup[];
  warnings: string[];
  created_at?: string;
}

export interface SimulationListItem {
  run_id: string;
  status: 'planned' | 'executed' | string;
  created_at: string;
}

export interface DashboardSummary {
  facilities: number;
  vehicles: number;
  pickup_points: number;
  by_status: {
    normal: number;
    due: number;
    urgent: number;
    critical: number;
  };
  pending_weight_kg: number;
  pending_volume_m3: number;
}

export interface GeoapifyStatus {
  provider: 'geoapify';
  configured: boolean;
  routing_api: string;
  map_tiles: string;
  message: string;
}

export interface BackendApiError {
  error: {
    code: string;
    message: string;
    details: any[];
  };
}
