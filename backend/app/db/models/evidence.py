from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship, backref

from app.db.database import Base


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    obligation_id = Column(Integer, ForeignKey("obligations.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    evidence_type = Column(String, nullable=False, default="Document")
    status = Column(String, nullable=False, default="Pending Review", index=True)
    source_document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    obligation = relationship("Obligation", backref=backref("evidence_items", cascade="all, delete-orphan"))
    source_document = relationship("Document", backref="evidence_items")
