from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ConflictBase(BaseModel):
    conflict_type: str
    title: str
    description: str
    severity: Optional[str] = "Medium"
    status: Optional[str] = "Unresolved"
    document_a_id: int
    document_b_id: int
    obligation_a_id: Optional[int] = None
    obligation_b_id: Optional[int] = None
    page_a: Optional[int] = None
    page_b: Optional[int] = None
    source_text_a: Optional[str] = None
    source_text_b: Optional[str] = None
    recommendation: Optional[str] = None


class ConflictCreate(ConflictBase):
    fingerprint: Optional[str] = None


class ConflictUpdate(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    recommendation: Optional[str] = None


class ConflictResponse(ConflictBase):
    id: int
    fingerprint: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
