from pydantic import BaseModel, Field
from typing import Optional, List

class AIDocumentInfo(BaseModel):
    title: str
    document_type: str
    language: str
    version: str

class AIObligation(BaseModel):
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
    confidence: float = Field(..., ge=0, le=1)

class AIResponse(BaseModel):
    document: AIDocumentInfo
    obligations: List[AIObligation]
