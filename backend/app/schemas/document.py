from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class DocumentBase(BaseModel):
    title: Optional[str] = None
    document_type: Optional[str] = None
    language: Optional[str] = None
    version: Optional[str] = None

class DocumentCreate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    id: int
    filename: str
    file_path: str
    uploaded_at: datetime
    processing_status: str

    model_config = ConfigDict(from_attributes=True)
