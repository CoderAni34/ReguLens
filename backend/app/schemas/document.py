from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

from app.schemas.obligation import ObligationResponse


class DocumentBase(BaseModel):
    title: Optional[str] = None
    document_type: Optional[str] = None
    language: Optional[str] = None
    version: Optional[str] = None


class DocumentCreate(DocumentBase):
    filename: str
    file_path: str
    processing_status: Optional[str] = "uploaded"


class DocumentResponse(DocumentBase):
    id: int
    filename: str
    file_path: str
    uploaded_at: datetime
    processing_status: str

    model_config = ConfigDict(from_attributes=True)


class DocumentAnalysisResponse(BaseModel):
    document: DocumentResponse
    obligations: List[ObligationResponse]

