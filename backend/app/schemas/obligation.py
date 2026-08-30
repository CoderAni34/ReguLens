from pydantic import BaseModel, ConfigDict
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
    confidence: float

class ObligationCreate(ObligationBase):
    document_id: int

class ObligationResponse(ObligationBase):
    id: int
    document_id: int
    status: str

    model_config = ConfigDict(from_attributes=True)
