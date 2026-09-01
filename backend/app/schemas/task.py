from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class TaskBase(BaseModel):
    title: str
    description: str
    deadline: Optional[str] = None
    responsible_unit: Optional[str] = None
    priority: Optional[str] = "Medium"
    status: Optional[str] = "To Do"


class TaskCreate(TaskBase):
    obligation_id: int


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[str] = None
    responsible_unit: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None


class TaskResponse(TaskBase):
    id: int
    obligation_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
