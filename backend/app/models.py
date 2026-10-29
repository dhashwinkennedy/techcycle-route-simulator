from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base

def uid(): return str(uuid4())
def now(): return datetime.now(timezone.utc)

class Facility(Base):
    __tablename__ = "facilities"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid); name: Mapped[str] = mapped_column(String)
    latitude: Mapped[float] = mapped_column(Float); longitude: Mapped[float] = mapped_column(Float)
    address: Mapped[str | None] = mapped_column(Text, nullable=True); active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now); updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)
class Vehicle(Base):
    __tablename__ = "vehicles"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid); facility_id: Mapped[str] = mapped_column(ForeignKey("facilities.id"))
    name: Mapped[str] = mapped_column(String); weight_capacity_kg: Mapped[float] = mapped_column(Float); volume_capacity_m3: Mapped[float] = mapped_column(Float)
    fuel_type: Mapped[str] = mapped_column(String, default="diesel"); status: Mapped[str] = mapped_column(String, default="available"); max_working_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now); updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)
class PickupPoint(Base):
    __tablename__ = "pickup_points"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid); name: Mapped[str] = mapped_column(String); category: Mapped[str] = mapped_column(String)
    latitude: Mapped[float] = mapped_column(Float); longitude: Mapped[float] = mapped_column(Float); address: Mapped[str | None] = mapped_column(Text, nullable=True); notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    max_weight_kg: Mapped[float] = mapped_column(Float); max_volume_m3: Mapped[float] = mapped_column(Float); pending_weight_kg: Mapped[float] = mapped_column(Float, default=0); pending_volume_m3: Mapped[float] = mapped_column(Float, default=0)
    service_minutes: Mapped[int] = mapped_column(Integer, default=10); active: Mapped[bool] = mapped_column(Boolean, default=True); request_started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True); last_completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now); updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)
class LoadUpdate(Base):
    __tablename__ = "load_updates"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid); pickup_point_id: Mapped[str] = mapped_column(ForeignKey("pickup_points.id")); weight_kg: Mapped[float] = mapped_column(Float); volume_m3: Mapped[float] = mapped_column(Float); description: Mapped[str | None] = mapped_column(Text, nullable=True); created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
class AppState(Base):
    __tablename__ = "app_state"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1); simulation_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now); settings: Mapped[dict] = mapped_column(JSON, default=dict)
class Simulation(Base):
    __tablename__ = "simulations"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid); status: Mapped[str] = mapped_column(String, default="planned"); created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now); snapshot: Mapped[dict] = mapped_column(JSON); result: Mapped[dict] = mapped_column(JSON)
