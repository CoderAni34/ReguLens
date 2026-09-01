from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class EvidenceBase(BaseModel):
    title: str
    description: str
    evidence_type: Optional[str] = "Document"
    status: Optional[str] = "Pending Review"


class EvidenceCreate(EvidenceBase):
    obligation_id: int
    source_document_id: Optional[int] = None


class EvidenceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    evidence_type: Optional[str] = None
    status: Optional[str] = None
    source_document_id: Optional[int] = None


class EvidenceResponse(EvidenceBase):
    id: int
    obligation_id: int
    source_document_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
