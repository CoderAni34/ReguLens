from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.database import Base


class Conflict(Base):
    __tablename__ = "conflicts"

    id = Column(Integer, primary_key=True, index=True)
    conflict_type = Column(String, nullable=False, default="Requirement Conflict")
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    severity = Column(String, nullable=False, default="Medium", index=True)
    status = Column(String, nullable=False, default="Unresolved", index=True)
    
    document_a_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    document_b_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    
    obligation_a_id = Column(Integer, ForeignKey("obligations.id", ondelete="SET NULL"), nullable=True, index=True)
    obligation_b_id = Column(Integer, ForeignKey("obligations.id", ondelete="SET NULL"), nullable=True, index=True)
    
    page_a = Column(Integer, nullable=True)
    page_b = Column(Integer, nullable=True)
    source_text_a = Column(Text, nullable=True)
    source_text_b = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=True)
    
    fingerprint = Column(String, nullable=False, unique=True, index=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    document_a = relationship("Document", foreign_keys=[document_a_id], backref="conflicts_a")
    document_b = relationship("Document", foreign_keys=[document_b_id], backref="conflicts_b")
    obligation_a = relationship("Obligation", foreign_keys=[obligation_a_id], backref="conflicts_a")
    obligation_b = relationship("Obligation", foreign_keys=[obligation_b_id], backref="conflicts_b")
