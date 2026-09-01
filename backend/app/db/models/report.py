from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime

from app.db.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    report_type = Column(String, nullable=False, default="Compliance", index=True)
    period = Column(String, nullable=False, default="Monthly")
    status = Column(String, nullable=False, default="Ready", index=True)
    created_by = Column(String, nullable=False, default="Compliance Officer")
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    metrics_json = Column(Text, nullable=True)
    executive_summary = Column(Text, nullable=True)
