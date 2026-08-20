from pydantic import BaseModel, ConfigDict, Field
from typing import Optional


class ObligationBase(BaseModel):
    title: str
    description: str
    responsible_unit: Optional[str] = None
    deadline: Optional[str] = None
    evidence_required: Optional[str] = None
    penalty: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    source_text: str
    source_page: Optional[int] = None
    confidence: float = Field(..., ge=0.0, le=1.0)


class ObligationCreate(ObligationBase):
    document_id: int
    status: Optional[str] = "active"


class ObligationResponse(ObligationBase):
    id: int
    document_id: int
    status: str

    model_config = ConfigDict(from_attributes=True)

