from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class ReportBase(BaseModel):
    title: str
    description: Optional[str] = None
    report_type: Optional[str] = "Compliance"
    period: Optional[str] = "Monthly"


class ReportCreate(ReportBase):
    created_by: Optional[str] = "Compliance Officer"


class ReportGenerateRequest(BaseModel):
    title: Optional[str] = None
    report_type: Optional[str] = "Compliance"
    period: Optional[str] = "Monthly"
    description: Optional[str] = None


class ReportResponse(ReportBase):
    id: int
    status: str
    created_by: str
    generated_at: datetime
    metrics_json: Optional[str] = None
    executive_summary: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
