from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator

class APIModel(BaseModel): model_config = ConfigDict(from_attributes=True)
class Coordinates(APIModel):
    latitude: float = Field(ge=-90, le=90); longitude: float = Field(ge=-180, le=180)
class FacilityIn(Coordinates): name: str = Field(min_length=1, max_length=160); address: str | None = None; active: bool = True
class FacilityPatch(FacilityIn): name: str | None = None; latitude: float | None = Field(default=None, ge=-90, le=90); longitude: float | None = Field(default=None, ge=-180, le=180)
class VehicleIn(APIModel): name: str = Field(min_length=1); weight_capacity_kg: float = Field(gt=0); volume_capacity_m3: float = Field(gt=0); fuel_type: str = "diesel"; status: Literal['available','inactive','maintenance'] = 'available'; max_working_minutes: int | None = Field(default=None, gt=0)
class VehiclePatch(VehicleIn): name: str | None = None; weight_capacity_kg: float | None = Field(default=None, gt=0); volume_capacity_m3: float | None = Field(default=None, gt=0)
class PickupIn(Coordinates):
    name: str = Field(min_length=1); category: str; address: str | None = None; notes: str | None = None; max_weight_kg: float = Field(gt=0); max_volume_m3: float = Field(gt=0); pending_weight_kg: float = Field(default=0, ge=0); pending_volume_m3: float = Field(default=0, ge=0); service_minutes: int = Field(default=10, ge=0); initial_wait_days: float = Field(default=0, ge=0); active: bool = True
class PickupPatch(PickupIn):
    name: str | None = None; category: str | None = None; latitude: float | None = Field(default=None, ge=-90, le=90); longitude: float | None = Field(default=None, ge=-180, le=180); max_weight_kg: float | None = Field(default=None, gt=0); max_volume_m3: float | None = Field(default=None, gt=0)
class LoadIn(APIModel): added_weight_kg: float = Field(ge=0); added_volume_m3: float = Field(ge=0); description: str | None = None
class AdvanceIn(APIModel): days: float = Field(gt=0, le=3650)
class SettingsPatch(APIModel):
    weight_safety_margin: float | None = Field(default=None, ge=0, lt=1); volume_safety_margin: float | None = Field(default=None, ge=0, lt=1); due_threshold: float | None = Field(default=None, gt=0, le=1); urgent_threshold: float | None = Field(default=None, gt=0, le=1); critical_threshold: float | None = Field(default=None, gt=0); mandatory_wait_days: float | None = Field(default=None, gt=0); opportunistic_detour_km: float | None = Field(default=None, ge=0); working_minutes_per_day: int | None = Field(default=None, gt=0); fuel_l_per_km: float | None = Field(default=None, ge=0); fuel_price_per_l: float | None = Field(default=None, ge=0); co2_kg_per_l: float | None = Field(default=None, ge=0)
class PlanIn(APIModel): facility_ids: list[str] | None = None; pickup_point_ids: list[str] | None = None; include_baseline: bool = True; objective: Literal['distance'] = 'distance'; allow_multi_trip: bool = True; include_opportunistic_pickups: bool = True
